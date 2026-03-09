import { Flame, Leaf } from "lucide-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, isLoading, userName }) {
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return undefined;
    }

    const updateStickyState = () => {
      const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 140;
    };

    updateStickyState();
    node.addEventListener("scroll", updateStickyState);
    return () => node.removeEventListener("scroll", updateStickyState);
  }, []);

  useLayoutEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return;
    }

    const shouldScroll = lastMessage.role === "user" || shouldStickToBottomRef.current;
    if (!shouldScroll) {
      return;
    }

    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        block: "end",
        behavior: lastMessage.role === "user" ? "smooth" : "auto"
      });
    });
  }, [messages, isLoading]);

  return (
    <section className="flex min-h-[420px] flex-col rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur sm:rounded-[34px] lg:h-full lg:min-h-0">
      <header className="mb-4 overflow-hidden rounded-[24px] border border-[#d7e0da] bg-[linear-gradient(135deg,#ffffff_0%,#eff8f2_52%,#fff2f2_100%)] p-4 sm:rounded-[28px] sm:p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#52705e]">Energy AI Stack</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#112218] sm:text-3xl">Energy AI</h1>
            <p className="mt-2 text-sm text-[#4a6555]">
              {userName
                ? `${userName}'s private workspace. Auto-balances low-energy speed with high-energy reasoning and keeps source context visible when the backend can ground an answer.`
                : "Auto-balances low-energy speed with high-energy reasoning, and keeps source context visible when the backend can ground an answer."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#bfe1cc] bg-[#edf9f1] px-3 py-1.5 text-xs font-semibold text-[#1d6d47]">
              <Leaf size={14} />
              energy-low-own-v1
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#ebc2c2] bg-[#fff3f3] px-3 py-1.5 text-xs font-semibold text-[#9d3030]">
              <Flame size={14} />
              energy-high-own-v1
            </span>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-auto px-1 pb-3 sm:pb-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading ? (
          <div className="text-center text-xs uppercase tracking-[0.2em] text-[#5b6d8f]">
            <span className="animate-blink">Generating</span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </section>
  );
}
