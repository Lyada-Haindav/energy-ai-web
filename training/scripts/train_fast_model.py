#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import SFTTrainer


def load_config(path: Path):
  with path.open("r", encoding="utf-8") as f:
    return json.load(f)


def load_system_prompt():
  prompt_path = Path(__file__).resolve().parent.parent / "prompts" / "fast_system.txt"
  return prompt_path.read_text(encoding="utf-8").strip()


def format_example(system_prompt, row):
  return {
    "text": (
      f"<s>[SYSTEM] {system_prompt}\n"
      f"[USER_CONTEXT]\n{row['prompt']}\n"
      f"[ASSISTANT]\n{row['completion']}</s>"
    )
  }


def main():
  parser = argparse.ArgumentParser(description="Train fast response model with LoRA SFT.")
  parser.add_argument("--config", required=True)
  parser.add_argument("--train-file", required=True)
  args = parser.parse_args()

  cfg = load_config(Path(args.config))
  system_prompt = load_system_prompt()

  tokenizer = AutoTokenizer.from_pretrained(cfg["base_model"], use_fast=True)
  tokenizer.pad_token = tokenizer.eos_token

  model = AutoModelForCausalLM.from_pretrained(
    cfg["base_model"],
    torch_dtype="auto",
    device_map="auto"
  )

  dataset = load_dataset("json", data_files={"train": args.train_file})["train"]
  dataset = dataset.map(lambda row: format_example(system_prompt, row), remove_columns=dataset.column_names)

  lora_config = LoraConfig(
    r=cfg["lora_r"],
    lora_alpha=cfg["lora_alpha"],
    lora_dropout=cfg["lora_dropout"],
    target_modules=cfg["target_modules"],
    task_type="CAUSAL_LM"
  )

  training_args = TrainingArguments(
    output_dir=cfg["output_dir"],
    learning_rate=cfg["learning_rate"],
    num_train_epochs=cfg["num_train_epochs"],
    per_device_train_batch_size=cfg["per_device_train_batch_size"],
    gradient_accumulation_steps=cfg["gradient_accumulation_steps"],
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,
    report_to="none"
  )

  trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    peft_config=lora_config,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length=cfg["max_seq_length"]
  )

  trainer.train()
  trainer.save_model(cfg["output_dir"])
  tokenizer.save_pretrained(cfg["output_dir"])

  print(json.dumps({"saved_to": cfg["output_dir"], "samples": len(dataset)}, indent=2))


if __name__ == "__main__":
  main()
