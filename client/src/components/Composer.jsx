import { Loader2, SendHorizonal } from "lucide-react";
import { useState } from "react";
import { ENERGY_MODE_OPTIONS } from "../lib/energy";

export default function Composer({ isLoading, onSend, mode, setMode }) {
  const [draft, setDraft] = useState("");

  function submit(event) {
    event?.preventDefault();
    if (isLoading) {
      return;
    }

    if (!draft.trim()) {
      return;
    }

    onSend(draft);
    setDraft("");
  }

  function handleKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    submit(event);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[28px] border border-white/70 bg-white/85 p-3 shadow-panel backdrop-blur sm:rounded-[30px] sm:p-4"
    >
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        {ENERGY_MODE_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => setMode(option.id)}
            className={`rounded-2xl border px-3 py-2 text-left transition ${
              mode === option.id
                ? option.activeClass
                : option.idleClass
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="mt-0.5 block text-[11px] opacity-80">{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Ask anything. Energy AI will choose low-energy speed or high-energy depth when it matters."
          className="h-36 flex-1 resize-none rounded-[24px] border border-[#d6dfd9] bg-[#f8faf8] px-4 py-3 text-sm text-[#112218] outline-none transition focus:border-[#2a9d62] sm:h-24"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[22px] bg-[#0f2f20] px-5 text-white transition hover:bg-[#164a31] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
          <span className="sm:hidden">Send</span>
        </button>
      </div>
    </form>
  );
}
