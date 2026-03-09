#!/usr/bin/env python3
import argparse
import json
import random
from collections import defaultdict
from pathlib import Path


TOPICS = [
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "database design",
  "API security",
  "system design",
  "Linux",
  "Git",
  "testing",
  "cloud architecture",
  "data engineering"
]

TASKS = [
  "optimize latency",
  "reduce memory usage",
  "improve readability",
  "add retry logic",
  "handle edge cases",
  "improve maintainability",
  "increase reliability",
  "improve error handling",
  "design for scalability"
]

FRAMEWORKS = ["React", "Vue", "Svelte", "Express", "FastAPI", "Django", "Spring Boot", "Flask"]

LANGUAGES = ["JavaScript", "TypeScript", "Python", "Go", "Java"]

AI_DEFINITIONS = {
  "ai": "AI is software that performs tasks that usually need human intelligence, such as understanding language, recognizing patterns, and making predictions.",
  "machine learning": "Machine learning is a method where models learn patterns from data instead of relying only on fixed rules.",
  "deep learning": "Deep learning is a type of machine learning that uses multi-layer neural networks to model complex patterns.",
  "llm": "An LLM is a large language model trained on text data to generate and understand natural language.",
  "rag": "RAG means Retrieval-Augmented Generation, where a model uses external documents at answer time to improve factual accuracy.",
  "transformer": "A transformer is a neural network architecture that uses attention to process relationships between tokens efficiently."
}

FOLLOW_UPS = [
  "Add one practical example.",
  "Now keep it under 120 words.",
  "Give me a checklist version.",
  "Turn this into actionable steps.",
  "What are the top 3 mistakes to avoid?",
  "Make this beginner-friendly.",
  "Give me a quick test plan for this.",
  "Summarize this in bullet points.",
  "Add performance and reliability considerations.",
  "Now provide a version for production use."
]

FOLLOW_RESPONSES = [
  "Practical example: start with a minimal implementation, benchmark it, then improve the bottleneck with one change at a time.",
  "Actionable checklist: define goal, implement baseline, test edge cases, measure metrics, iterate.",
  "Top mistakes: skipping requirements, ignoring failure paths, and optimizing before measuring.",
  "Production tips: add validation, structured logging, retries with backoff, and clear monitoring alerts.",
  "Test plan: happy path, invalid input, timeout path, retry behavior, and load behavior under concurrency."
]

AUDIENCES = [
  "for a beginner",
  "for an intermediate engineer",
  "for a senior engineer",
  "for a startup team",
  "for an enterprise team"
]

CONSTRAINTS = [
  "Keep it concise.",
  "Prioritize production reliability.",
  "Include failure cases.",
  "Mention monitoring strategy.",
  "Focus on low latency.",
  "Focus on maintainability.",
  "Assume limited budget."
]

OUTPUT_FORMATS = [
  "Use bullet points.",
  "Use a numbered plan.",
  "Use a short paragraph and checklist.",
  "Give a practical example first.",
  "Start with key tradeoffs."
]

SCALES = [
  "for 1k users",
  "for 10k users",
  "for 100k users",
  "for 1M users",
  "for high concurrency traffic"
]


def write_jsonl(path: Path, rows):
  path.parent.mkdir(parents=True, exist_ok=True)
  with path.open("w", encoding="utf-8") as file:
    for row in rows:
      file.write(json.dumps(row, ensure_ascii=True) + "\n")


def general_chat_example():
  prompts = [
    "hi",
    "hello",
    "hey there",
    "good morning",
    "what can you do?",
    "how can you help me learn coding?",
    "teach me programming from zero"
  ]
  responses = [
    "Hi. I can help with coding, analysis, writing, planning, and debugging. Tell me your goal and I will give a step-by-step plan.",
    "Hello. I can explain concepts, write code, review architecture, and create practical action plans.",
    "Hey. Share your current level and target outcome. I will tailor a focused learning path.",
    "Good morning. I can help you build projects, improve code quality, and troubleshoot issues quickly.",
    "I can act as your technical assistant: explain topics, generate code, debug errors, and design scalable solutions."
  ]
  return random.choice(prompts), random.choice(responses)


def factual_definition_example():
  term = random.choice(list(AI_DEFINITIONS.keys()))
  prompt_options = [
    f"what is {term}",
    f"Explain {term} in simple terms.",
    f"Define {term} with an example.",
    f"I am beginner. What is {term}?"
  ]
  response = AI_DEFINITIONS[term]
  response += " Example: a spam filter that learns from labeled emails and improves over time."
  return random.choice(prompt_options), response


def coding_example():
  framework = random.choice(FRAMEWORKS)
  language = random.choice(LANGUAGES)
  task = random.choice(TASKS)
  prompt = (
    f"Write a {language} solution using {framework} to {task}. "
    "Include edge cases and complexity."
  )
  response = (
    f"Approach: implement a clear function/module in {language}, validate inputs, and separate core logic from I/O. "
    "Complexity target should be O(n) where possible. "
    "Edge cases: empty input, invalid types, large payloads, and timeout paths."
  )
  return prompt, response


def debugging_example():
  language = random.choice(LANGUAGES)
  prompt = (
    f"My {language} service fails intermittently in production. "
    "Give a debugging strategy with exact steps and priority order."
  )
  response = (
    "1) Reproduce and capture logs with request IDs. "
    "2) Correlate failures with deploys, traffic spikes, and dependency latency. "
    "3) Add guards for null/invalid states and improve retries. "
    "4) Add regression tests for the failure mode before shipping the fix."
  )
  return prompt, response


def architecture_example():
  topic = random.choice(TOPICS)
  prompt = (
    f"Design a scalable architecture for {topic}. "
    "Compare two designs, include tradeoffs, and recommend one."
  )
  response = (
    "Design A is simpler and faster to ship. Design B is more resilient at high scale with better fault isolation. "
    "Recommendation: start with Design A for MVP, then evolve hot paths to Design B as load grows."
  )
  return prompt, response


def writing_example():
  topic = random.choice(TOPICS)
  prompt = (
    f"Rewrite this explanation about {topic} for non-technical users. "
    "Make it clear and concise."
  )
  response = (
    f"{topic.title()} means teaching software to improve from examples, so it gets better at tasks over time without manually coding every rule."
  )
  return prompt, response


def math_reasoning_example():
  n = random.randint(30, 800)
  prompt = (
    f"Estimate complexity for processing {n} records with nested loops and suggest a faster approach."
  )
  response = (
    "Nested loops often give O(n^2), which becomes expensive as data grows. "
    "Use hash-based lookups, sorting with two pointers, or indexing to reduce runtime to O(n) or O(n log n)."
  )
  return prompt, response


def security_example():
  prompt = "Give me a secure API design checklist for authentication, authorization, and data protection."
  response = (
    "Use short-lived tokens, enforce role-based access control, validate all inputs, apply rate limiting, "
    "encrypt data in transit and at rest, and log security events with alerting."
  )
  return prompt, response


def product_planning_example():
  topic = random.choice(TOPICS)
  prompt = (
    f"Create a 30-day execution plan to ship a project in {topic}. "
    "Include milestones, risks, and mitigation."
  )
  response = (
    "Week 1: scope and architecture; Week 2: core implementation; Week 3: reliability and performance; "
    "Week 4: deployment, monitoring, and user feedback loop. "
    "Risks: unclear scope, unstable dependencies, and missing observability."
  )
  return prompt, response


BUILDERS = [
  ("general_chat", general_chat_example),
  ("factual_definitions", factual_definition_example),
  ("coding_assistant", coding_example),
  ("debugging", debugging_example),
  ("architecture", architecture_example),
  ("writing", writing_example),
  ("math_reasoning", math_reasoning_example),
  ("security", security_example),
  ("product_planning", product_planning_example)
]


def decorate_prompt(prompt):
  hints = [
    random.choice(AUDIENCES),
    random.choice(CONSTRAINTS),
    random.choice(OUTPUT_FORMATS),
    random.choice(SCALES)
  ]
  random.shuffle(hints)
  suffix = " ".join(hints[: random.randint(2, 4)])
  return f"{prompt} {suffix}".strip()


def maybe_follow_up(messages):
  if random.random() > 0.62:
    return messages

  messages.append({"role": "user", "content": random.choice(FOLLOW_UPS)})
  messages.append({"role": "assistant", "content": random.choice(FOLLOW_RESPONSES)})
  return messages


def generate_rows(count, seed):
  random.seed(seed)
  rows = []
  by_dataset = defaultdict(int)

  for _ in range(count):
    dataset_name, builder = random.choice(BUILDERS)
    prompt, response = builder()
    prompt = decorate_prompt(prompt)

    messages = [
      {"role": "user", "content": prompt},
      {"role": "assistant", "content": response}
    ]
    messages = maybe_follow_up(messages)

    rows.append({"messages": messages, "dataset": dataset_name})
    by_dataset[dataset_name] += 1

  return rows, dict(by_dataset)


def main():
  parser = argparse.ArgumentParser(description="Generate multi-dataset synthetic ChatGPT-style data.")
  parser.add_argument("--out", required=True, help="Output JSONL path")
  parser.add_argument("--count", type=int, default=10000, help="Number of generated conversations")
  parser.add_argument("--seed", type=int, default=42, help="Random seed")
  args = parser.parse_args()

  rows, by_dataset = generate_rows(args.count, args.seed)
  output = Path(args.out)
  write_jsonl(output, rows)

  print(
    json.dumps(
      {
        "status": "ok",
        "rows": len(rows),
        "output": str(output),
        "datasets": by_dataset
      },
      indent=2
    )
  )


if __name__ == "__main__":
  main()
