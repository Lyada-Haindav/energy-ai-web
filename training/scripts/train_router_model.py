#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

import evaluate
from datasets import load_dataset
from transformers import (
  AutoModelForSequenceClassification,
  AutoTokenizer,
  DataCollatorWithPadding,
  Trainer,
  TrainingArguments
)


LABEL2ID = {"fast": 0, "deep": 1}
ID2LABEL = {0: "fast", 1: "deep"}


def load_config(path: Path):
  with path.open("r", encoding="utf-8") as f:
    return json.load(f)


def tokenize_batch(batch, tokenizer, max_length):
  return tokenizer(batch["text"], truncation=True, max_length=max_length)


def main():
  parser = argparse.ArgumentParser(description="Train router classifier (fast vs deep).")
  parser.add_argument("--config", required=True)
  parser.add_argument("--train-file", required=True)
  args = parser.parse_args()

  cfg = load_config(Path(args.config))

  dataset = load_dataset("json", data_files={"train": args.train_file})["train"]
  dataset = dataset.map(lambda row: {"label": LABEL2ID[row["label"]]})
  split = dataset.train_test_split(test_size=0.1, seed=42)

  tokenizer = AutoTokenizer.from_pretrained(cfg["base_model"], use_fast=True)
  tokenized_train = split["train"].map(
    lambda x: tokenize_batch(x, tokenizer, cfg["max_length"]),
    batched=True
  )
  tokenized_eval = split["test"].map(
    lambda x: tokenize_batch(x, tokenizer, cfg["max_length"]),
    batched=True
  )

  model = AutoModelForSequenceClassification.from_pretrained(
    cfg["base_model"],
    num_labels=2,
    id2label=ID2LABEL,
    label2id=LABEL2ID
  )

  accuracy = evaluate.load("accuracy")

  def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(axis=-1)
    return accuracy.compute(predictions=preds, references=labels)

  args_train = TrainingArguments(
    output_dir=cfg["output_dir"],
    learning_rate=cfg["learning_rate"],
    num_train_epochs=cfg["num_train_epochs"],
    per_device_train_batch_size=cfg["per_device_train_batch_size"],
    per_device_eval_batch_size=cfg["per_device_eval_batch_size"],
    weight_decay=cfg["weight_decay"],
    evaluation_strategy="epoch",
    save_strategy="epoch",
    logging_steps=10,
    report_to="none"
  )

  trainer = Trainer(
    model=model,
    args=args_train,
    train_dataset=tokenized_train,
    eval_dataset=tokenized_eval,
    tokenizer=tokenizer,
    data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
    compute_metrics=compute_metrics
  )

  trainer.train()
  metrics = trainer.evaluate()

  trainer.save_model(cfg["output_dir"])
  tokenizer.save_pretrained(cfg["output_dir"])

  print(json.dumps({"saved_to": cfg["output_dir"], "metrics": metrics}, indent=2))


if __name__ == "__main__":
  main()
