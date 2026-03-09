import { Bot, Check, Copy, User } from "lucide-react";
import { useState } from "react";
import { energyKeyFromMeta, energyLabelFromMeta, energyOptionById, modelDisplayName } from "../lib/energy";

function ModelChip({ meta }) {
  if (!meta?.model || meta.model === "bootstrap") {
    return null;
  }

  const energyKey = energyKeyFromMeta(meta);
  const energyOption = energyOptionById(energyKey);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#5b6d8f]">
      <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-1">{modelDisplayName(meta.model)}</span>
      <span className={`rounded-full border px-2 py-1 ${energyOption.chipClass}`}>{energyLabelFromMeta(meta)}</span>
      {meta.latencyMs ? (
        <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-1">
          {meta.latencyMs} ms
        </span>
      ) : null}
      {meta.energyScore ? (
        <span className="rounded-full border border-slate-300 bg-white/70 px-2 py-1">
          energy {meta.energyScore}
        </span>
      ) : null}
    </div>
  );
}

function Sources({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((source, index) => (
        <a
          key={`${source.url || source.title}-${index}`}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-full border border-[#cad8cf] bg-white/80 px-2.5 py-1 text-[11px] font-medium text-[#35543f] transition hover:bg-[#edf9f1]"
        >
          {source.title || `Source ${index + 1}`}
        </a>
      ))}
    </div>
  );
}

function parseContentSegments(content) {
  const text = String(content || "");
  const segments = [];
  const regex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match = regex.exec(text);

  while (match) {
    if (match.index > cursor) {
      segments.push({
        type: "text",
        value: text.slice(cursor, match.index)
      });
    }

    segments.push({
      type: "code",
      language: match[1] || "text",
      value: match[2] || ""
    });

    cursor = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (cursor < text.length) {
    segments.push({
      type: "text",
      value: text.slice(cursor)
    });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-slate-300/80 bg-[#0f172a] text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-slate-300">
        <span>{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-100 transition hover:bg-slate-700"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MessageContent({ content }) {
  const segments = parseContentSegments(content);

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        if (segment.type === "code") {
          return <CodeBlock key={`code-${index}`} language={segment.language} code={segment.value} />;
        }

        if (!segment.value.trim()) {
          return null;
        }

        return (
          <div key={`text-${index}`} className="whitespace-pre-wrap leading-relaxed">
            {segment.value}
          </div>
        );
      })}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const fromUser = message.role === "user";
  const energyKey = energyKeyFromMeta(message.meta);

  return (
    <article
      className={`animate-rise rounded-3xl border px-4 py-3 shadow-soft ${
        fromUser
          ? "ml-auto max-w-[92%] border-[#0f2f20]/20 bg-[#0f2f20] text-white sm:max-w-[80%]"
          : energyKey === "deep"
            ? "mr-auto max-w-[94%] border-[#f0d1d1] bg-[#fff8f8] text-[#2d1313] sm:max-w-[85%]"
            : "mr-auto max-w-[94%] border-[#d8e7dc] bg-white text-[#14203a] sm:max-w-[85%]"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] opacity-80">
        {fromUser ? <User size={13} /> : <Bot size={13} />}
        {fromUser ? "You" : "Energy AI"}
      </div>
      <MessageContent content={message.content || "..."} />
      {!fromUser ? <ModelChip meta={message.meta} /> : null}
      {!fromUser ? <Sources sources={message.meta?.sources} /> : null}
    </article>
  );
}
