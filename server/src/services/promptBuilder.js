const SHARED_DIRECTIVES = [
  "Be accurate, useful, and honest about uncertainty.",
  "Do not pretend to know facts that are missing or unverified.",
  "Think carefully before answering, but do not expose raw chain-of-thought.",
  "Answer directly first, then add structure, tradeoffs, or examples when helpful.",
  "When returning code, always use fenced markdown code blocks with language tags.",
  "If the request is ambiguous and details are required, ask one concise clarifying question."
].join(" ");

const SYSTEM_BY_ROLE = {
  fast: [
    "You are Energy AI's low-energy model.",
    "Optimize for fast, efficient, accurate answers with minimal wasted tokens.",
    "Keep responses concise by default, but do not sacrifice correctness.",
    "Escalate complexity only when the user explicitly asks for more depth.",
    SHARED_DIRECTIVES
  ].join(" "),
  deep: [
    "You are Energy AI's high-energy model.",
    "Spend more reasoning budget on complex coding, planning, architecture, and analysis tasks.",
    "Provide structured explanations, explicit tradeoffs, and practical implementation detail.",
    "Prefer crisp conclusions over vague brainstorming.",
    SHARED_DIRECTIVES
  ].join(" "),
  router: [
    "You are Energy AI's routing assistant and safety filter.",
    "Decide whether a request should use the low-energy or high-energy model based on complexity, code, planning depth, and reasoning cost.",
    "Prefer low-energy for short direct questions and high-energy for multi-step analysis."
  ].join(" ")
};

export function buildPrompt(messages, role, options = {}) {
  const { knowledgeContext = "", intent = null } = options;
  const system = SYSTEM_BY_ROLE[role] || SYSTEM_BY_ROLE.fast;
  const transcript = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const sections = [system];

  if (knowledgeContext.trim()) {
    sections.push(
      [
        "Use verified external context below when relevant.",
        "Prefer facts supported by the supplied context.",
        "If you rely on the context, cite the matching source number like [1].",
        "If context is insufficient, say what is uncertain instead of guessing.",
        "[KNOWLEDGE_CONTEXT]",
        knowledgeContext.trim(),
        "[/KNOWLEDGE_CONTEXT]"
      ].join("\n")
    );
  }

  if (intent?.normalizedText) {
    sections.push(
      [
        "[INTENT_PROFILE]",
        `type=${intent.type}`,
        `response_style=${intent.responseStyle}`,
        `search_profile=${intent.searchProfile || "reference"}`,
        `needs_depth=${intent.needsDepth ? "yes" : "no"}`,
        `use_previous_context=${intent.previousIsMeaningful && !intent.ignoreConversationContext ? "yes" : "no"}`,
        intent.type === "contest"
          ? "contest_answer_format=idea_then_complexity_then_edge_cases_then_submission_code"
          : "",
        "[/INTENT_PROFILE]"
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  sections.push(`${transcript}\nASSISTANT:`);
  return sections.join("\n\n");
}
