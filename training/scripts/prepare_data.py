#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path


def read_jsonl(path: Path):
  with path.open("r", encoding="utf-8") as f:
    for line in f:
      line = line.strip()
      if not line:
        continue
      yield json.loads(line)


def write_jsonl(path: Path, rows):
  path.parent.mkdir(parents=True, exist_ok=True)
  with path.open("w", encoding="utf-8") as f:
    for row in rows:
      f.write(json.dumps(row, ensure_ascii=True) + "\n")


def complexity_score(text: str) -> int:
  score = 0
  score += len(text.split()) // 40
  for token in ["analyze", "architecture", "train", "debug", "compare", "design", "optimize", "tradeoff", "code"]:
    if token in text.lower():
      score += 1
  if "\n" in text:
    score += 1
  return score


def build_examples(messages):
  history = []
  examples = []

  for m in messages:
    role = m.get("role", "").strip().lower()
    content = m.get("content", "").strip()
    if not content:
      continue

    if role == "assistant":
      prompt = "\n".join(history + ["ASSISTANT:"])
      if prompt.strip():
        user_context = "\n".join(history[-4:])
        score = complexity_score(user_context)
        examples.append({
          "prompt": prompt,
          "completion": content,
          "complexity": score
        })

    history.append(f"{role.upper()}: {content}")

  return examples


def main():
  parser = argparse.ArgumentParser(description="Prepare SFT + router datasets from raw chat logs.")
  parser.add_argument("--input", required=True, help="Path to raw JSONL chats")
  parser.add_argument("--out-dir", required=True, help="Output directory")
  parser.add_argument("--deep-threshold", type=int, default=3, help="Complexity threshold for deep samples")
  args = parser.parse_args()

  input_path = Path(args.input)
  out_dir = Path(args.out_dir)

  fast_rows = []
  deep_rows = []
  router_rows = []

  for row in read_jsonl(input_path):
    messages = row.get("messages", [])
    for ex in build_examples(messages):
      train_row = {"prompt": ex["prompt"], "completion": ex["completion"]}

      if ex["complexity"] >= args.deep_threshold:
        deep_rows.append(train_row)
        router_rows.append({"text": ex["prompt"], "label": "deep"})
      else:
        fast_rows.append(train_row)
        router_rows.append({"text": ex["prompt"], "label": "fast"})

  write_jsonl(out_dir / "fast_sft.jsonl", fast_rows)
  write_jsonl(out_dir / "deep_sft.jsonl", deep_rows)
  write_jsonl(out_dir / "router_train.jsonl", router_rows)

  print(json.dumps({
    "input": str(input_path),
    "out_dir": str(out_dir),
    "fast_examples": len(fast_rows),
    "deep_examples": len(deep_rows),
    "router_examples": len(router_rows)
  }, indent=2))


if __name__ == "__main__":
  main()
