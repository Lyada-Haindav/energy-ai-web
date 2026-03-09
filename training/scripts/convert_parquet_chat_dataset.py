#!/usr/bin/env python
import argparse
import json
from pathlib import Path

import pandas as pd


def normalize_text(text):
  return " ".join(str(text or "").strip().split())


def normalize_role(role):
  lowered = str(role or "").strip().lower()
  if lowered in {"human", "user", "prompter"}:
    return "user"
  if lowered in {"assistant", "gpt"}:
    return "assistant"
  return ""


def iter_rows(input_paths, english_only=True, skip_redacted=True):
  for input_path in input_paths:
    frame = pd.read_parquet(
      input_path,
      columns=["conversation_id", "model", "conversation", "turn", "language", "redacted"]
    )

    for row in frame.itertuples(index=False):
      language = str(getattr(row, "language", "") or "").strip().lower()
      if english_only and language and "english" not in language and language not in {"en", "en-us", "en-gb"}:
        continue

      if skip_redacted and bool(getattr(row, "redacted", False)):
        continue

      conversation = getattr(row, "conversation", None)
      if conversation is None:
        continue

      mapped = []
      for turn in list(conversation):
        if not isinstance(turn, dict):
          continue

        role = normalize_role(turn.get("role"))
        content = normalize_text(turn.get("content"))
        if not role or not content:
          continue

        if mapped and mapped[-1]["role"] == role:
          mapped[-1]["content"] = f'{mapped[-1]["content"]}\n{content}'.strip()
        else:
          mapped.append({"role": role, "content": content})

      if len(mapped) < 2:
        continue
      if mapped[0]["role"] != "user":
        continue
      if not any(message["role"] == "assistant" for message in mapped):
        continue

      yield {
        "dataset": f"parquet:{input_path.stem}",
        "conversation_id": str(getattr(row, "conversation_id", "") or ""),
        "source_model": str(getattr(row, "model", "") or ""),
        "messages": mapped
      }


def write_jsonl(output_path, rows):
  output_path.parent.mkdir(parents=True, exist_ok=True)
  with output_path.open("w", encoding="utf-8") as handle:
    for row in rows:
      handle.write(json.dumps(row, ensure_ascii=True) + "\n")


def main():
  parser = argparse.ArgumentParser(description="Convert chat parquet shards into local training JSONL.")
  parser.add_argument("--input", action="append", required=True, help="Input parquet shard")
  parser.add_argument("--out", required=True, help="Output JSONL path")
  parser.add_argument("--max-rows", type=int, default=0, help="Optional cap on written rows (0 means no cap)")
  parser.add_argument("--include-redacted", action="store_true", help="Keep redacted rows")
  parser.add_argument("--all-languages", action="store_true", help="Keep non-English rows too")
  args = parser.parse_args()

  input_paths = [Path(item) for item in args.input]
  for input_path in input_paths:
    if not input_path.exists():
      raise SystemExit(f"Input parquet not found: {input_path}")

  rows = []
  for row in iter_rows(
    input_paths,
    english_only=not args.all_languages,
    skip_redacted=not args.include_redacted
  ):
    rows.append(row)
    if args.max_rows > 0 and len(rows) >= args.max_rows:
      break

  write_jsonl(Path(args.out), rows)
  print(
    json.dumps(
      {
        "status": "ok",
        "output": args.out,
        "rows": len(rows),
        "inputs": [str(path) for path in input_paths],
        "english_only": not args.all_languages,
        "skip_redacted": not args.include_redacted
      },
      indent=2
    )
  )


if __name__ == "__main__":
  main()
