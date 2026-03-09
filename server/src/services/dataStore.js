import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const MONGODB_URI = String(process.env.MONGODB_URI || "").trim();
const MONGODB_DB_NAME = String(process.env.MONGODB_DB_NAME || "").trim();
const MONGODB_COLLECTION_NAME = String(process.env.MONGODB_COLLECTION || "appData").trim();
const MONGODB_DOCUMENT_ID = String(process.env.MONGODB_DOCUMENT_ID || "energy-ai").trim();
const DATA_DIR = path.resolve(process.env.APP_DATA_DIR || path.join(PROJECT_ROOT, "data"));
const DATA_FILE = path.resolve(process.env.APP_DATA_FILE || path.join(DATA_DIR, "app-data.json"));

let mongoCollectionPromise;
let mongoFallbackLogged = false;
let mongoPermanentlyDisabled = false;

function useMongoStore() {
  return Boolean(MONGODB_URI) && !mongoPermanentlyDisabled;
}

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

function normalizeDbShape(parsed) {
  return {
    users: Array.isArray(parsed?.users) ? parsed.users : [],
    sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
    chats: parsed?.chats && typeof parsed.chats === "object" ? parsed.chats : {}
  };
}

function resolveMongoDbName() {
  if (MONGODB_DB_NAME) {
    return MONGODB_DB_NAME;
  }

  try {
    const pathname = new URL(MONGODB_URI).pathname.replace(/^\/+/, "");
    return pathname || "";
  } catch {
    return "";
  }
}

async function getMongoCollection() {
  if (!useMongoStore()) {
    return null;
  }

  if (!mongoCollectionPromise) {
    mongoCollectionPromise = (async () => {
      const dbName = resolveMongoDbName();
      if (!dbName) {
        throw new Error("MONGODB_URI is set, but the database name is missing.");
      }

      const client = new MongoClient(MONGODB_URI, {
        ignoreUndefined: true
      });

      await client.connect();

      const collection = client.db(dbName).collection(MONGODB_COLLECTION_NAME);
      await collection.updateOne(
        { _id: MONGODB_DOCUMENT_ID },
        {
          $setOnInsert: createEmptyDb()
        },
        { upsert: true }
      );

      return collection;
    })();
  }

  return mongoCollectionPromise;
}

function disableMongoStore(error) {
  mongoPermanentlyDisabled = true;
  mongoCollectionPromise = null;

  if (!mongoFallbackLogged) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    console.error(`MongoDB unavailable, falling back to file storage: ${message}`);
    mongoFallbackLogged = true;
  }
}

async function ensureDataFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(createEmptyDb(), null, 2));
  }
}

async function readDbFromMongo() {
  const collection = await getMongoCollection();
  const document = await collection.findOne({ _id: MONGODB_DOCUMENT_ID });
  return normalizeDbShape(document);
}

async function writeDbToMongo(db) {
  const collection = await getMongoCollection();

  await collection.updateOne(
    { _id: MONGODB_DOCUMENT_ID },
    {
      $set: normalizeDbShape(db)
    },
    { upsert: true }
  );
}

async function readDbDirect() {
  if (useMongoStore()) {
    try {
      return await readDbFromMongo();
    } catch (error) {
      disableMongoStore(error);
    }
  }

  await ensureDataFile();
  const raw = await readFile(DATA_FILE, "utf8");

  try {
    return normalizeDbShape(JSON.parse(raw));
  } catch {
    return createEmptyDb();
  }
}

async function writeDbDirect(db) {
  if (useMongoStore()) {
    try {
      await writeDbToMongo(db);
      return;
    } catch (error) {
      disableMongoStore(error);
    }
  }

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
