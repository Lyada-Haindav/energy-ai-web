#!/usr/bin/env python3
import argparse
import json
import time
from urllib import request


EVAL_PROMPTS = [
  "Write a two line summary of reinforcement learning.",
  "Analyze tradeoffs between retrieval augmented generation and full fine-tuning for private enterprise data.",
  "Give me a short JavaScript function that debounces input and explain complexity.",
  "What is LoRA in one paragraph?",
  "Solve subarray sum equals k in Python with complexity.",
  "A contest problem gives a graph with non-negative weights. Find shortest path from node 1 to node n. Explain the right algorithm."
]


def run_prompt(server_url, prompt):
  payload = json.dumps({
    "mode": "auto",
    "messages": [{"role": "user", "content": prompt}]
  }).encode("utf-8")

  req = request.Request(
    f"{server_url}/api/chat",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
  )

  start = time.perf_counter()
  output = ""
  route = None
  energy = None

  with request.urlopen(req, timeout=120) as resp:
    for raw_line in resp:
      line = raw_line.decode("utf-8").strip()
      if not line:
        continue

      evt = json.loads(line)
      if evt.get("type") == "start":
        route = evt.get("model")
      elif evt.get("type") == "token":
        output += evt.get("token", "")
      elif evt.get("type") == "final":
        energy = evt.get("energyScore")

  latency_ms = int((time.perf_counter() - start) * 1000)
  return {
    "prompt": prompt,
    "latency_ms": latency_ms,
    "route_model": route,
    "energy_score": energy,
    "output_chars": len(output)
  }


def main():
  parser = argparse.ArgumentParser(description="Evaluate routing behavior and latency.")
  parser.add_argument("--server-url", default="http://localhost:8787")
  args = parser.parse_args()

  rows = [run_prompt(args.server_url, prompt) for prompt in EVAL_PROMPTS]
  avg_latency = sum(r["latency_ms"] for r in rows) / len(rows)

  summary = {
    "evaluations": rows,
    "average_latency_ms": round(avg_latency, 1),
    "num_prompts": len(rows)
  }

  print(json.dumps(summary, indent=2))


if __name__ == "__main__":
  main()
