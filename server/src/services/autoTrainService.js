import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearOwnArtifactCache } from "./modelClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const AUTO_TRAIN_ENABLED = (process.env.AUTO_TRAIN_ENABLED || "true").toLowerCase() !== "false";
const AUTO_TRAIN_MIN_NEW_EXAMPLES = Number(process.env.AUTO_TRAIN_MIN_NEW_EXAMPLES || 10);
const AUTO_TRAIN_COOLDOWN_MS = Number(process.env.AUTO_TRAIN_COOLDOWN_MINUTES || 20) * 60 * 1000;

const USER_DATA_PATH = path.resolve(
  process.env.USER_TRAIN_DATA_PATH || path.join(PROJECT_ROOT, "training/data/local/user_live_pairs.jsonl")
);
const PUBLIC_DATA_PATH = path.resolve(
  process.env.PUBLIC_TRAIN_DATA_PATH || path.join(PROJECT_ROOT, "training/data/public/merged_public_chat.jsonl")
);
const TRAIN_SCRIPT_PATH = path.resolve(
  process.env.AUTO_TRAIN_SCRIPT || path.join(PROJECT_ROOT, "training/scripts/train_own_models.py")
);
const OUT_DIR = path.resolve(process.env.OWN_MODELS_DIR || path.join(PROJECT_ROOT, "training/checkpoints/own"));
const AUTO_TRAIN_STATE_PATH = path.resolve(
  process.env.AUTO_TRAIN_STATE_PATH || path.join(PROJECT_ROOT, "training/data/local/auto_train_state.json")
);

const TRAIN_DEEP_THRESHOLD = process.env.AUTO_TRAIN_DEEP_THRESHOLD || "2";
const TRAIN_MAX_PAIRS = process.env.AUTO_TRAIN_MAX_PAIRS || "180000";
const TRAIN_MAX_DUPLICATE_PROMPTS = process.env.AUTO_TRAIN_MAX_DUPLICATE_PROMPTS || "10";
const TRAIN_FAST_TO_DEEP_RATIO = process.env.AUTO_TRAIN_MAX_FAST_TO_DEEP_RATIO || "6";
const TRAIN_SEED = process.env.AUTO_TRAIN_SEED || "42";

const SKIP_PROMPT_PATTERN =
  /^(hi|hello|hey|yo|ok|okay|good|great|nice|thanks|thank you|cool|how are you|bye|goodbye|see you|see ya|later|[0-9]+)$/i;
const ABUSIVE_PATTERN = /\b(fuck|idiot|stupid|moron|dumb|shut\s*up)\b/i;

let trainingInProgress = false;
let lastTrainCompletedAt = 0;

function normalize(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function shouldSkipPair(prompt, completion) {
  if (!prompt || !completion) {
    return true;
  }
  if (prompt.length < 3 || completion.length < 8) {
    return true;
  }
  if (SKIP_PROMPT_PATTERN.test(prompt)) {
    return true;
  }
  if (ABUSIVE_PATTERN.test(prompt)) {
    return true;
  }
  return false;
}

async function appendUserPair(prompt, completion) {
  const payload = {
    prompt,
    completion,
    source: "live_user_chat",
    created_at: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(USER_DATA_PATH), { recursive: true });
  await fs.appendFile(USER_DATA_PATH, `${JSON.stringify(payload)}\n`, "utf-8");
}

async function countJsonlRows(filePath) {
  if (!(await fileExists(filePath))) {
    return 0;
  }

  const raw = await fs.readFile(filePath, "utf-8");
  if (!raw.trim()) {
    return 0;
  }

  return raw.trim().split("\n").length;
}

async function readAutoTrainState() {
  if (!(await fileExists(AUTO_TRAIN_STATE_PATH))) {
    return { last_trained_lines: 0 };
  }

  try {
    const raw = await fs.readFile(AUTO_TRAIN_STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      last_trained_lines: Number(parsed.last_trained_lines || 0)
    };
  } catch {
    return { last_trained_lines: 0 };
  }
}

async function writeAutoTrainState(lastTrainedLines) {
  await fs.mkdir(path.dirname(AUTO_TRAIN_STATE_PATH), { recursive: true });
  await fs.writeFile(
    AUTO_TRAIN_STATE_PATH,
    JSON.stringify(
      {
        last_trained_lines: lastTrainedLines,
        updated_at: new Date().toISOString()
      },
      null,
      2
    ),
    "utf-8"
  );
}

function buildTrainingArgs(inputs) {
  const args = [TRAIN_SCRIPT_PATH];

  for (const input of inputs) {
    args.push("--input", input);
  }

  args.push(
    "--out-dir",
    OUT_DIR,
    "--deep-threshold",
    TRAIN_DEEP_THRESHOLD,
    "--max-pairs",
    TRAIN_MAX_PAIRS,
    "--max-duplicate-prompts",
    TRAIN_MAX_DUPLICATE_PROMPTS,
    "--max-fast-to-deep-ratio",
    TRAIN_FAST_TO_DEEP_RATIO,
    "--seed",
    TRAIN_SEED
  );

  return args;
}

async function runTrainingJob() {
  const hasUserData = await fileExists(USER_DATA_PATH);
  if (!hasUserData) {
    return false;
  }

  const inputs = [];
  if (await fileExists(PUBLIC_DATA_PATH)) {
    inputs.push(PUBLIC_DATA_PATH);
  }
  inputs.push(USER_DATA_PATH);

  const args = buildTrainingArgs(inputs);
  const startedAt = Date.now();

  const success = await new Promise((resolve) => {
    const child = spawn("python3", args, {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code, signal) => {
      if (code === 0) {
        clearOwnArtifactCache();
        console.log(
          `[auto-train] completed in ${Math.round((Date.now() - startedAt) / 1000)}s; model cache refreshed`
        );
        resolve(true);
      } else {
        const details = code === null ? `signal ${signal || "unknown"}` : `code ${code}`;
        console.error(`[auto-train] failed with ${details}`);
        if (stderr.trim()) {
          console.error(stderr.trim());
        }
        if (stdout.trim()) {
          console.error(stdout.trim());
        }
        resolve(false);
      }
    });
  });

  return success;
}

export async function maybeAutoTrain() {
  if (!AUTO_TRAIN_ENABLED) {
    return;
  }
  if (trainingInProgress) {
    return;
  }
  if (Date.now() - lastTrainCompletedAt < AUTO_TRAIN_COOLDOWN_MS) {
    return;
  }

  const totalLines = await countJsonlRows(USER_DATA_PATH);
  const state = await readAutoTrainState();
  const newExamples = Math.max(totalLines - state.last_trained_lines, 0);

  if (newExamples < AUTO_TRAIN_MIN_NEW_EXAMPLES) {
    return;
  }

  trainingInProgress = true;
  try {
    console.log(`[auto-train] starting with ${newExamples} new examples`);
    const ok = await runTrainingJob();
    if (ok) {
      lastTrainCompletedAt = Date.now();
      await writeAutoTrainState(totalLines);
    }
  } finally {
    trainingInProgress = false;
  }
}

export async function recordUserTrainingPair({ prompt, completion }) {
  const cleanPrompt = normalize(prompt);
  const cleanCompletion = normalize(completion);

  if (shouldSkipPair(cleanPrompt, cleanCompletion)) {
    return;
  }

  await appendUserPair(cleanPrompt, cleanCompletion);
  void maybeAutoTrain();
}
