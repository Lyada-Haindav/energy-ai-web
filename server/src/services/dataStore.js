import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "app-data.json");

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyDb() {
  return {
    users: [],
    sessions: [],
    chats: {}
  };
}

async function ensureDataFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(createEmptyDb(), null, 2));
  }
}

async function readDbDirect() {
  await ensureDataFile();
  const raw = await readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      chats: parsed.chats && typeof parsed.chats === "object" ? parsed.chats : {}
    };
  } catch {
    return createEmptyDb();
  }
}

async function writeDbDirect(db) {
  await ensureDataFile();
  await writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

let queue = Promise.resolve();

export async function readDb() {
  await queue;
  return cloneData(await readDbDirect());
}

export async function updateDb(mutator) {
  let result;

  const task = queue.then(async () => {
    const db = await readDbDirect();
    result = await mutator(db);
    await writeDbDirect(db);
  });

  queue = task.catch(() => undefined);
  await task;
  return result;
}

export function cloneSessions(sessions) {
  return cloneData(Array.isArray(sessions) ? sessions : []);
}
