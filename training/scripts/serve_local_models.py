#!/usr/bin/env python3
import argparse
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import torch
from peft import AutoPeftModelForCausalLM
from transformers import AutoModelForSequenceClassification, AutoTokenizer


ROOT_DIR = Path(__file__).resolve().parent.parent


def read_json(path: Path):
  with path.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def resolve_checkpoint_dir(config_path: Path, override: str | None):
  if override:
    return Path(override).resolve()

  config = read_json(config_path)
  return (ROOT_DIR / config["output_dir"]).resolve()


def model_device(model):
  device = getattr(model, "device", None)
  if device and str(device) != "meta":
    return device

  try:
    return next(model.parameters()).device
  except StopIteration:
    return torch.device("cpu")


class LocalModelRegistry:
  def __init__(self, args):
    self.fast_dir = resolve_checkpoint_dir(ROOT_DIR / "config" / "fast_model.json", args.fast_dir)
    self.deep_dir = resolve_checkpoint_dir(ROOT_DIR / "config" / "deep_model.json", args.deep_dir)
    self.router_dir = resolve_checkpoint_dir(ROOT_DIR / "config" / "router_model.json", args.router_dir)
    self.max_input_tokens = args.max_input_tokens
    self._lock = threading.Lock()
    self._text_models = {}
    self._router = None

  def health(self):
    return {
      "ok": True,
      "service": "energy-local-model-server",
      "fast_dir": str(self.fast_dir),
      "deep_dir": str(self.deep_dir),
      "router_dir": str(self.router_dir),
      "loaded_roles": sorted(self._text_models.keys()) + (["router"] if self._router else [])
    }

  def _load_text_model(self, role: str):
    if role in self._text_models:
      return self._text_models[role]

    with self._lock:
      if role in self._text_models:
        return self._text_models[role]

      model_dir = self.fast_dir if role == "fast" else self.deep_dir
      if not model_dir.exists():
        raise FileNotFoundError(f"Checkpoint directory not found for role={role}: {model_dir}")

      tokenizer = AutoTokenizer.from_pretrained(model_dir, use_fast=True)
      if tokenizer.pad_token is None and tokenizer.eos_token is not None:
        tokenizer.pad_token = tokenizer.eos_token

      load_kwargs = {"torch_dtype": "auto"}
      if torch.cuda.is_available():
        load_kwargs["device_map"] = "auto"

      model = AutoPeftModelForCausalLM.from_pretrained(model_dir, **load_kwargs)
      model.eval()

      payload = {
        "tokenizer": tokenizer,
        "model": model,
        "name": model_dir.name
      }
      self._text_models[role] = payload
      return payload

  def _load_router(self):
    if self._router:
      return self._router

    with self._lock:
      if self._router:
        return self._router

      if not self.router_dir.exists():
        raise FileNotFoundError(f"Router checkpoint directory not found: {self.router_dir}")

      tokenizer = AutoTokenizer.from_pretrained(self.router_dir, use_fast=True)
      model = AutoModelForSequenceClassification.from_pretrained(self.router_dir)
      if torch.cuda.is_available():
        model = model.to("cuda")
      model.eval()

      self._router = {
        "tokenizer": tokenizer,
        "model": model,
        "name": self.router_dir.name
      }
      return self._router

  def _move_to_model_device(self, model, encoded):
    device = model_device(model)
    return {key: value.to(device) for key, value in encoded.items()}

  def generate(self, role: str, prompt: str, max_new_tokens: int, temperature: float):
    bundle = self._load_text_model(role)
    tokenizer = bundle["tokenizer"]
    model = bundle["model"]

    encoded = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=self.max_input_tokens)
    encoded = self._move_to_model_device(model, encoded)

    generate_kwargs = {
      "max_new_tokens": max_new_tokens,
      "pad_token_id": tokenizer.pad_token_id or tokenizer.eos_token_id
    }

    if temperature > 0:
      generate_kwargs["do_sample"] = True
      generate_kwargs["temperature"] = temperature
      generate_kwargs["top_p"] = 0.95
    else:
      generate_kwargs["do_sample"] = False

    with torch.no_grad():
      output_ids = model.generate(**encoded, **generate_kwargs)

    generated_ids = output_ids[0][encoded["input_ids"].shape[1]:]
    text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()

    return {
      "text": text,
      "model": bundle["name"]
    }

  def classify(self, prompt: str):
    bundle = self._load_router()
    tokenizer = bundle["tokenizer"]
    model = bundle["model"]

    encoded = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    encoded = self._move_to_model_device(model, encoded)

    with torch.no_grad():
      logits = model(**encoded).logits

    label_id = int(torch.argmax(logits, dim=-1).item())
    id_to_label = getattr(model.config, "id2label", {}) or {}
    raw_label = id_to_label.get(label_id, id_to_label.get(str(label_id), "fast"))
    target_role = "deep" if str(raw_label).lower() == "deep" else "fast"

    return {
      "targetRole": target_role,
      "model": bundle["name"]
    }


class Handler(BaseHTTPRequestHandler):
  registry: LocalModelRegistry = None

  def _read_json(self):
    length = int(self.headers.get("Content-Length", "0"))
    raw = self.rfile.read(length) if length > 0 else b"{}"
    return json.loads(raw.decode("utf-8") or "{}")

  def _send_json(self, status_code: int, payload):
    data = json.dumps(payload, ensure_ascii=True).encode("utf-8")
    self.send_response(status_code)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(data)))
    self.end_headers()
    self.wfile.write(data)

  def log_message(self, fmt, *args):
    return

  def do_GET(self):
    if self.path == "/health":
      self._send_json(200, self.registry.health())
      return

    self._send_json(404, {"error": "Not found"})

  def do_POST(self):
    try:
      payload = self._read_json()

      if self.path == "/generate":
        role = str(payload.get("role") or "fast").strip().lower()
        prompt = str(payload.get("prompt") or "")
        max_new_tokens = int(payload.get("max_new_tokens") or 700)
        temperature = float(payload.get("temperature") if payload.get("temperature") is not None else 0.4)
        result = self.registry.generate(role, prompt, max_new_tokens=max_new_tokens, temperature=temperature)
        self._send_json(200, result)
        return

      if self.path == "/classify":
        prompt = str(payload.get("prompt") or "")
        result = self.registry.classify(prompt)
        self._send_json(200, result)
        return

      self._send_json(404, {"error": "Not found"})
    except Exception as error:  # noqa: BLE001
      self._send_json(500, {"error": str(error)})


def main():
  parser = argparse.ArgumentParser(description="Serve local HF/PEFT checkpoints for Energy AI.")
  parser.add_argument("--host", default="127.0.0.1")
  parser.add_argument("--port", type=int, default=9001)
  parser.add_argument("--fast-dir", default=None, help="Fast model checkpoint directory")
  parser.add_argument("--deep-dir", default=None, help="Deep model checkpoint directory")
  parser.add_argument("--router-dir", default=None, help="Router checkpoint directory")
  parser.add_argument("--max-input-tokens", type=int, default=4096)
  args = parser.parse_args()

  registry = LocalModelRegistry(args)
  Handler.registry = registry

  server = ThreadingHTTPServer((args.host, args.port), Handler)
  print(json.dumps({"status": "ok", "host": args.host, "port": args.port, **registry.health()}, indent=2))
  server.serve_forever()


if __name__ == "__main__":
  main()
