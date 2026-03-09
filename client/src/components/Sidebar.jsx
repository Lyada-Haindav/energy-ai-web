import { MessageCirclePlus, Trash2 } from "lucide-react";

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  createChat,
  removeChat,
  owner
}) {
  return (
    <aside className="flex min-h-0 w-full flex-col rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur sm:rounded-[34px] lg:h-full lg:max-h-none">
      <button
        type="button"
        onClick={createChat}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-[22px] border border-[#bfe1cc] bg-[#edf9f1] px-3 py-2.5 text-sm font-semibold text-[#1d6d47] transition hover:bg-[#e3f5ea]"
      >
        <MessageCirclePlus size={16} />
        New Session
      </button>

      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-[#5a7362]">Energy Memory</span>
          {owner ? <p className="mt-1 text-xs text-[#7b8d82]">{owner}</p> : null}
        </div>
        <span className="text-xs text-[#7b8d82]">{sessions.length} threads</span>
      </div>
      <div className="scrollbar-hide flex max-h-[280px] min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1 sm:max-h-[360px] lg:max-h-none">
        {sessions.map((session) => {
          const selected = session.id === activeSessionId;
          return (
            <div
              key={session.id}
              className={`group rounded-2xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-[#bfe1cc] bg-[#edf9f1]"
                  : "border-[#e0e7e2] bg-white/80 hover:border-[#cad8cf]"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveSessionId(session.id)}
                className="w-full text-left"
              >
                <div className="max-h-10 overflow-hidden text-ellipsis text-sm font-semibold text-[#14261a]">
                  {session.title}
                </div>
              </button>
              <div className="mt-2 flex items-center justify-between text-xs text-[#6b7f73]">
                <span>{formatDate(session.updatedAt)}</span>
                <button
                  type="button"
                  onClick={() => {
                    removeChat(session.id);
                  }}
                  className="rounded-lg p-1 text-slate-400 opacity-100 transition hover:bg-white/70 hover:text-[#c44949] sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
