# Training Stack (Router + Low Energy + High Energy)

This folder trains three model roles for Energy AI.

## Roles
- `router`: cheap classifier that chooses `fast` vs `deep`
- `fast`: low-energy general assistant model
- `deep`: high-energy analysis/coding/reasoning model

## 1) Install Python dependencies

```bash
cd training
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 1b) Fast Offline Own-Model Training (no extra packages)

This creates your own local model artifacts immediately.

```bash
python3 scripts/train_own_models.py \
  --input data/sample_raw_chats.jsonl \
  --out-dir checkpoints/own
```

Outputs:
- `checkpoints/own/router.json`
- `checkpoints/own/fast.json`
- `checkpoints/own/deep.json`

Artifact names default to:
- `energy-router-own-v1`
- `energy-low-own-v1`
- `energy-high-own-v1`

## 1b+) Energy AI alignment seed

Use the bundled alignment seed to reinforce branding, source-grounded answers, coding quality, and honest uncertainty:

```bash
python3 scripts/train_own_models.py \
  --input data/energy_alignment_seed.jsonl \
  --input data/public/merged_public_chat.jsonl \
  --out-dir checkpoints/own \
  --deep-threshold 3 \
  --max-pairs 9000 \
  --max-duplicate-prompts 4 \
  --max-fast-to-deep-ratio 5.0
```

Use these with backend provider `own`.

## 1b++) Contest-heavy training profile

Use the contest alignment set plus the larger local corpus when you want stronger coding-problem behavior:

```bash
python3 scripts/train_own_models.py \
  --input data/energy_alignment_seed.jsonl \
  --input data/contest_alignment_seed.jsonl \
  --input data/public/merged_public_chat.jsonl \
  --input data/datasets/multi_a.jsonl \
  --input data/datasets/multi_b.jsonl \
  --input data/datasets/multi_c.jsonl \
  --input data/datasets/multi_v2_a.jsonl \
  --input data/datasets/multi_v2_b.jsonl \
  --input data/datasets/multi_v2_c.jsonl \
  --out-dir checkpoints/own \
  --deep-threshold 3 \
  --max-pairs 18000 \
  --max-duplicate-prompts 6 \
  --max-fast-to-deep-ratio 6.0
```

This repo already contains more than 600k local training rows across public and synthetic shards. The command above uses that larger corpus but still keeps the deployed retrieval artifact size bounded.

## 1c) High-Diversity Multi-Dataset Training (recommended)

Generate multiple dataset shards:

```bash
python3 scripts/generate_chatgpt_style_data.py --out data/datasets/multi_a.jsonl --count 40000 --seed 1001
python3 scripts/generate_chatgpt_style_data.py --out data/datasets/multi_b.jsonl --count 40000 --seed 2002
python3 scripts/generate_chatgpt_style_data.py --out data/datasets/multi_c.jsonl --count 40000 --seed 3003
```

Train from all shards:

```bash
python3 scripts/train_own_models.py \
  --input data/datasets/multi_a.jsonl \
  --input data/datasets/multi_b.jsonl \
  --input data/datasets/multi_c.jsonl \
  --out-dir checkpoints/own \
  --deep-threshold 3 \
  --max-pairs 80000 \
  --max-duplicate-prompts 5 \
  --max-fast-to-deep-ratio 8.0
```

## 1d) Download Public Datasets (OpenAssistant + Alpaca + ShareGPT-style)

```bash
python3 scripts/download_public_chat_datasets.py \
  --out-dir data/public \
  --max-oasst 80000 \
  --max-alpaca 52000 \
  --max-sharegpt 90000
```

Then train on merged public data:

```bash
python3 scripts/train_own_models.py \
  --input data/public/merged_public_chat.jsonl \
  --out-dir checkpoints/own \
  --deep-threshold 3 \
  --max-pairs 120000 \
  --max-duplicate-prompts 6 \
  --max-fast-to-deep-ratio 8.0
```

## 2) Prepare dataset

Input dataset format (`.jsonl`):

```json
{"messages":[{"role":"user","content":"..."},{"role":"assistant","content":"..."}]}
```

Run:

```bash
python scripts/prepare_data.py --input data/raw_chats.jsonl --out-dir data/processed
```

Outputs:
- `data/processed/fast_sft.jsonl`
- `data/processed/deep_sft.jsonl`
- `data/processed/router_train.jsonl`

## 3) Train fast model

```bash
python scripts/train_fast_model.py \
  --config config/fast_model.json \
  --train-file data/processed/fast_sft.jsonl
```

## 4) Train deep model

```bash
python scripts/train_deep_model.py \
  --config config/deep_model.json \
  --train-file data/processed/deep_sft.jsonl
```

## 5) Train router model

```bash
python scripts/train_router_model.py \
  --config config/router_model.json \
  --train-file data/processed/router_train.jsonl
```

## 6) Evaluate end-to-end stack

```bash
python scripts/evaluate_stack.py --server-url http://localhost:8787
```

## 7) Serve real local checkpoints

After training the router, fast, and deep checkpoints, serve them with:

```bash
python3 scripts/serve_local_models.py --port 9001
```

Then set the backend to:

```env
ROUTER_PROVIDER=python_local
FAST_PROVIDER=python_local
DEEP_PROVIDER=python_local
PYTHON_LOCAL_BASE_URL=http://127.0.0.1:9001
```

This path uses your own fine-tuned checkpoints instead of the lightweight JSON `own` artifacts.

## Notes
- Start with open-weight checkpoints and LoRA/QLoRA.
- Keep router small (1B to 3B or sequence classifier) for low energy use.
- Use your own conversations for iterative alignment.
- Data quality matters more than raw volume. Prefer curated instruction-style pairs over noisy generative dumps.
