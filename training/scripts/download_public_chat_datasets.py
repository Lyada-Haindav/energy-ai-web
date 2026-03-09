#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from datasets import load_dataset

SHAREGPT_DATASET_CANDIDATES = [
  "anon8231489123/ShareGPT_Vicuna_unfiltered",
  "Aeala/ShareGPT_Vicuna_unfiltered",
  "HuggingFaceH4/ultrachat_200k"
]


def normalize_text(text):
  return " ".join(str(text).strip().split())


def write_jsonl(path, rows):
  path.parent.mkdir(parents=True, exist_ok=True)
  with path.open("w", encoding="utf-8") as file:
    for row in rows:
      file.write(json.dumps(row, ensure_ascii=True) + "\n")


def convert_alpaca(max_rows):
  rows = []
  split = load_dataset("tatsu-lab/alpaca", split="train")
  for item in split:
    instruction = normalize_text(item.get("instruction", ""))
    in_text = normalize_text(item.get("input", ""))
    output = normalize_text(item.get("output", ""))

    if not instruction or not output:
      continue

    prompt = instruction if not in_text else f"{instruction}\nInput: {in_text}"
    rows.append(
      {
        "dataset": "alpaca",
        "messages": [
          {"role": "user", "content": prompt},
          {"role": "assistant", "content": output}
        ]
      }
    )

    if len(rows) >= max_rows:
      break

  return rows


def load_first_available_dataset(dataset_names):
  last_error = None
  for name in dataset_names:
    try:
      return load_dataset(name, split="train"), name
    except Exception as error:  # noqa: BLE001
      last_error = error
  raise RuntimeError(f"Unable to load any dataset from candidates: {dataset_names}. Last error: {last_error}")


def convert_sharegpt(max_rows):
  rows = []
  split, source_name = load_first_available_dataset(SHAREGPT_DATASET_CANDIDATES)
  for item in split:
    conversations = item.get("conversations") or item.get("messages") or []
    mapped = []

    for turn in conversations:
      role_raw = str(turn.get("from") or turn.get("role") or "").lower().strip()
      text = normalize_text(turn.get("value") or turn.get("content") or "")
      if not text:
        continue

      if role_raw in {"human", "user"}:
        mapped.append({"role": "user", "content": text})
      elif role_raw in {"gpt", "assistant"}:
        mapped.append({"role": "assistant", "content": text})

    if len(mapped) < 2:
      continue

    rows.append({"dataset": f"sharegpt:{source_name}", "messages": mapped})
    if len(rows) >= max_rows:
      break

  return rows, source_name


def convert_oasst(max_rows):
  # OASST is a conversation tree. Build user->assistant pairs from parent links.
  train_split = load_dataset("OpenAssistant/oasst1", split="train")
  val_split = load_dataset("OpenAssistant/oasst1", split="validation")

  id_to_node = {}
  for split in [train_split, val_split]:
    for item in split:
      message_id = item.get("message_id")
      if not message_id:
        continue
      id_to_node[message_id] = {
        "role": str(item.get("role", "")).lower().strip(),
        "text": normalize_text(item.get("text", "")),
        "lang": str(item.get("lang", "")).lower().strip(),
        "parent_id": item.get("parent_id")
      }

  rows = []
  for node in id_to_node.values():
    if node["role"] != "assistant":
      continue
    if node["lang"] not in {"en", "en_us", "en-gb", ""}:
      continue
    if not node["text"]:
      continue

    parent_id = node.get("parent_id")
    parent = id_to_node.get(parent_id)
    if not parent:
      continue
    if parent["role"] != "prompter":
      continue
    if parent["lang"] not in {"en", "en_us", "en-gb", ""}:
      continue
    if not parent["text"]:
      continue

    rows.append(
      {
        "dataset": "oasst1",
        "messages": [
          {"role": "user", "content": parent["text"]},
          {"role": "assistant", "content": node["text"]}
        ]
      }
    )

    if len(rows) >= max_rows:
      break

  return rows


def main():
  parser = argparse.ArgumentParser(description="Download and convert public chat datasets to local JSONL format.")
  parser.add_argument("--out-dir", default="training/data/public", help="Output folder for JSONL files")
  parser.add_argument("--max-oasst", type=int, default=100000, help="Maximum OASST pairs")
  parser.add_argument("--max-alpaca", type=int, default=52000, help="Maximum Alpaca rows")
  parser.add_argument("--max-sharegpt", type=int, default=90000, help="Maximum ShareGPT conversations")
  args = parser.parse_args()

  out_dir = Path(args.out_dir)
  out_dir.mkdir(parents=True, exist_ok=True)

  oasst_rows = convert_oasst(args.max_oasst)
  write_jsonl(out_dir / "oasst1.jsonl", oasst_rows)

  alpaca_rows = convert_alpaca(args.max_alpaca)
  write_jsonl(out_dir / "alpaca.jsonl", alpaca_rows)

  sharegpt_source = None
  try:
    sharegpt_rows, sharegpt_source = convert_sharegpt(args.max_sharegpt)
  except Exception as error:  # noqa: BLE001
    print(f"[warning] ShareGPT download failed, continuing without ShareGPT: {error}")
    sharegpt_rows = []

  write_jsonl(out_dir / "sharegpt.jsonl", sharegpt_rows)

  merged = oasst_rows + alpaca_rows + sharegpt_rows
  write_jsonl(out_dir / "merged_public_chat.jsonl", merged)

  print(
    json.dumps(
      {
        "status": "ok",
        "output_dir": str(out_dir),
        "oasst1_rows": len(oasst_rows),
        "alpaca_rows": len(alpaca_rows),
        "sharegpt_rows": len(sharegpt_rows),
        "sharegpt_source": sharegpt_source,
        "merged_rows": len(merged)
      },
      indent=2
    )
  )


if __name__ == "__main__":
  main()
