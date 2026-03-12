import { buildPrompt } from "../services/promptBuilder.js";
import { recordUserTrainingPair } from "../services/autoTrainService.js";
import { analyzeUserIntent } from "../services/intentAnalyzer.js";
import { fetchKnowledgeContext } from "../services/knowledgeService.js";
import { chooseRoute } from "../services/routerService.js";
import { generateTextForRole } from "../services/modelClient.js";

const SIMPLE_SKIP_PATTERN =
  /^(hi|hello|hey|yo|good|great|nice|ok|okay|thanks|thank you|cool|how are you)\b/i;
const ASSISTANT_META_PATTERN =
  /^(what(?:'s| is)\s+your\s+name|who\s+are\s+you|which\s+model\s+are\s+you|which\s+model\s+you\s+are|what\s+is\s+your\s+model\s+name|what\s+model\s+are\s+you)\??$/i;
const WHAT_IS_PATTERN =
  /^(?:(?:can\s+i\s+know|do\s+you\s+know|tell\s+me|can\s+you\s+tell\s+me|could\s+you\s+tell\s+me|please\s+tell\s+me)\s+)?what\s+is\s+(.+?)\??$/i;
const SHORT_WHAT_IS_PATTERN =
  /^(?:(?:can\s+i\s+know|do\s+you\s+know|tell\s+me|can\s+you\s+tell\s+me|could\s+you\s+tell\s+me|please\s+tell\s+me)\s+)?what\s+is\s+([a-z0-9-]{1,4})\??$/i;
const AFFIRMATIVE_EXPLAIN_PATTERN =
  /^(yes|yeah|yep|sure|ok|okay)(?:\s+(please\s+)?)?(explain|elaborate|details?|more|continue|again|with\s+examples?|in\s+simple\s+words)\??$/i;
const REWRITE_FOLLOWUP_PATTERN = /^(make\s+it(?:\s+(simple|simpler|short|shorter|clear|clearer|easy|easier|better|detailed))?)\??$/i;
const DATE_TIME_QUERY_PATTERN =
  /^(?:(?:can\s+i\s+know|tell\s+me|do\s+you\s+know)\s+)?(?:(?:what(?:'s| is)?|which)\s+)?(?:(today'?s?|current|now)\s+)?(date|time|day)(?:\s+(?:today|now|it\s+is|is\s+it))?\??$/i;
const KNOWLEDGE_TRIGGER_PATTERN =
  /^(what|who|when|where|why|how)\b|\b(explain|define|overview|latest|history)\b/i;
const DISCOVERY_TRIGGER_PATTERN =
  /\b(best|top|recommend|suggest|buy|purchase|download|builder|free|paid|pricing|price|official)\b/i;

function writeChunk(res, payload) {
  res.write(`${JSON.stringify(payload)}\n`);
}

function tokenize(text) {
  const words = text.split(/(\s+)/).filter(Boolean);
  return words.length > 0 ? words : [text];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldFetchKnowledge(text, intent = null) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return false;
  }
  if (SIMPLE_SKIP_PATTERN.test(trimmed)) {
    return false;
  }
  if (ASSISTANT_META_PATTERN.test(trimmed)) {
    return false;
  }
  if (SHORT_WHAT_IS_PATTERN.test(trimmed)) {
    return false;
  }
  if (DATE_TIME_QUERY_PATTERN.test(trimmed)) {
    return false;
  }
  if (trimmed.length < 8) {
    return false;
  }
  if (["download", "shopping", "builder", "recommendation"].includes(intent?.type || "")) {
    return true;
  }
  if (KNOWLEDGE_TRIGGER_PATTERN.test(trimmed)) {
    return true;
  }
  if (DISCOVERY_TRIGGER_PATTERN.test(trimmed)) {
    return true;
  }
  return /^[A-Za-z][A-Za-z0-9+.#/\-&\s]{3,80}$/.test(trimmed) && trimmed.split(/\s+/).length <= 5;
}

function buildKnowledgeQuery(messages, intent = null) {
  const userMessages = messages.filter((message) => message.role === "user");
  const latestUserText = userMessages[userMessages.length - 1]?.content || "";
  const previousUserText = userMessages[userMessages.length - 2]?.content || "";
  const secondPreviousUserText = userMessages[userMessages.length - 3]?.content || "";
  const latestTrimmed = latestUserText.trim();
  const previousTrimmed = previousUserText.trim();
  const secondPreviousTrimmed = secondPreviousUserText.trim();

  const previousAnchor =
    ((AFFIRMATIVE_EXPLAIN_PATTERN.test(previousTrimmed) || REWRITE_FOLLOWUP_PATTERN.test(previousTrimmed) || /^really\??$/i.test(previousTrimmed)) &&
      secondPreviousTrimmed) ||
    previousTrimmed;

  const latestWhatIsMatch = latestTrimmed.match(WHAT_IS_PATTERN);
  if (latestWhatIsMatch) {
    return latestWhatIsMatch[1].trim();
  }

  if (SHORT_WHAT_IS_PATTERN.test(previousAnchor) && /^[A-Za-z][A-Za-z0-9+.#/\-&\s]{3,80}$/.test(latestTrimmed) && !latestTrimmed.includes("?")) {
    return latestTrimmed;
  }

  if (AFFIRMATIVE_EXPLAIN_PATTERN.test(latestTrimmed) || REWRITE_FOLLOWUP_PATTERN.test(latestTrimmed)) {
    const match = previousAnchor.match(WHAT_IS_PATTERN);
    if (match) {
      return match[1].trim();
    }
  }

  if (["download", "shopping", "builder", "recommendation"].includes(intent?.type || "")) {
    return latestTrimmed;
  }

  return latestTrimmed;
}

export async function chatRoute(req, res) {
  const { messages = [], mode = "auto" } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "`messages` must be a non-empty array." });
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const intent = analyzeUserIntent({ messages, mode });
  const latestUserText = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const knowledgeQuery = buildKnowledgeQuery(messages, intent);
  const knowledgePromise = intent.shouldFetchKnowledge && shouldFetchKnowledge(knowledgeQuery, intent)
    ? fetchKnowledgeContext(knowledgeQuery, { intent })
    : Promise.resolve({ contextText: "", sources: [] });
  const [route, knowledge] = await Promise.all([chooseRoute({ messages, mode, intent }), knowledgePromise]);
  const prompt = buildPrompt(messages, route.targetRole, { knowledgeContext: knowledge.contextText, intent });

  writeChunk(res, {
    type: "start",
    model: route.modelLabel,
    routeReason: route.reason,
    role: route.targetRole,
    energyMode: route.energyMode,
    sources: knowledge.sources
  });

  try {
    const generation = await generateTextForRole({
      role: route.targetRole,
      prompt,
      intent,
      knowledge
    });
    void recordUserTrainingPair({
      prompt: latestUserText,
      completion: generation.text
    });

    for (const token of tokenize(generation.text)) {
      writeChunk(res, { type: "token", token });
      await sleep(route.targetRole === "deep" ? 16 : 9);
    }

    writeChunk(res, {
      type: "final",
      model: generation.model,
      routeReason: route.reason,
      role: route.targetRole,
      energyMode: route.energyMode,
      energyScore: route.energyScore,
      sources: knowledge.sources
    });
  } catch (error) {
    const safeError = error instanceof Error ? error.message : "Unknown model error";

    writeChunk(res, {
      type: "token",
      token: "I hit a model execution issue. Please verify provider credentials and model availability."
    });

    writeChunk(res, {
      type: "final",
      model: route.modelLabel,
      routeReason: `${route.reason} | ${safeError}`,
      role: route.targetRole,
      energyMode: route.energyMode,
      energyScore: route.energyScore,
      sources: knowledge.sources
    });
  }

  res.end();
}
