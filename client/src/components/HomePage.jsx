import { ArrowRight, Clock3, Flame, Leaf, Sparkles, Zap } from "lucide-react";

function CTAButton({ filled = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
        filled
          ? "bg-[#10261b] text-white shadow-[0_24px_40px_-24px_rgba(15,47,32,0.8)] hover:bg-[#183528]"
          : "border border-[#cad9cf] bg-white/80 text-[#10261b] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function ModeCard({ icon: Icon, title, body, accent, glow }) {
  return (
    <article className={`rounded-[30px] border border-white/55 p-5 shadow-[0_30px_80px_-52px_rgba(15,47,32,0.55)] backdrop-blur ${glow}`}>
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        <Icon size={18} />
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] text-[#10261b]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#4d6357]">{body}</p>
    </article>
  );
}

export default function HomePage({ isAuthenticated, user, onNavigate }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe4] text-[#10261b]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_top_left,rgba(255,190,59,0.28),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(36,170,120,0.24),transparent_24%),radial-gradient(circle_at_72%_42%,rgba(255,122,89,0.24),transparent_18%)]" />
        <div className="absolute left-[-7rem] top-[16rem] h-80 w-80 rounded-full bg-[#7dd0a9]/30 blur-3xl" />
        <div className="absolute right-[-5rem] top-[7rem] h-72 w-72 rounded-full bg-[#ffd36d]/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[12%] h-96 w-96 rounded-full bg-[#ff9a7a]/22 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-4 pb-8 pt-4 sm:pb-10 sm:pt-6 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-white/55 bg-white/68 px-4 py-3 shadow-[0_24px_70px_-50px_rgba(15,47,32,0.5)] backdrop-blur sm:rounded-full sm:px-5">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#10261b_0%,#2e8f63_100%)] text-white shadow-[0_20px_40px_-26px_rgba(16,38,27,0.8)]">
              <Zap size={18} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Energy AI</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6c8074]">Low-energy speed. High-energy depth.</p>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            {isAuthenticated ? (
              <>
                <span className="rounded-full border border-[#d7dfd9] bg-white/80 px-4 py-2 text-center text-sm text-[#3e5a4c]">
                  {user?.name || "Signed in"}
                </span>
                <CTAButton onClick={() => onNavigate("analytics")}>Analytics</CTAButton>
                <CTAButton filled onClick={() => onNavigate("chat")}>
                  Open chat
                  <ArrowRight size={15} />
                </CTAButton>
              </>
            ) : (
              <>
                <CTAButton onClick={() => onNavigate("login")}>Sign in</CTAButton>
                <CTAButton filled onClick={() => onNavigate("signup")}>
                  Try Energy AI
                  <ArrowRight size={15} />
                </CTAButton>
              </>
            )}
          </div>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 sm:gap-10 sm:py-10 lg:grid-cols-[minmax(0,1.02fr)_540px] lg:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eadcb7] bg-white/72 px-4 py-2 text-sm font-semibold text-[#78590e] backdrop-blur">
              <Sparkles size={15} />
              One AI system. Three energy levels.
            </div>

            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[0.92] tracking-[-0.06em] text-[#0f2419] sm:text-6xl lg:text-7xl">
              The right answer at the right speed.
            </h1>

            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#496252] sm:text-lg sm:leading-8">
              Energy AI answers simple prompts in Low-Energy mode, switches to High-Energy mode for harder reasoning,
              and uses Auto Balance to decide when speed matters more than depth.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
              <CTAButton filled onClick={() => onNavigate(isAuthenticated ? "chat" : "signup")}>
                {isAuthenticated ? "Open workspace" : "Start now"}
                <ArrowRight size={15} />
              </CTAButton>
              <CTAButton onClick={() => onNavigate(isAuthenticated ? "analytics" : "login")}>
                {isAuthenticated ? "View energy stats" : "Sign in"}
              </CTAButton>
            </div>

            <div className="mt-10 grid gap-3 sm:flex sm:flex-wrap">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe3d5] bg-white/74 px-4 py-2 text-sm font-semibold text-[#1d6d47]">
                <Leaf size={14} />
                Low Energy
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#e9ddba] bg-white/74 px-4 py-2 text-sm font-semibold text-[#8f6a10]">
                <Clock3 size={14} />
                Auto Balance
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#efcece] bg-white/74 px-4 py-2 text-sm font-semibold text-[#a23838]">
                <Flame size={14} />
                High Energy
              </span>
            </div>
          </div>

          <div className="relative min-h-[420px] sm:min-h-[520px]">
            <div className="absolute inset-0 rounded-[34px] bg-[linear-gradient(155deg,rgba(16,38,27,0.94)_0%,rgba(34,118,82,0.88)_44%,rgba(255,145,98,0.82)_100%)] shadow-[0_50px_120px_-60px_rgba(16,38,27,0.85)] sm:rounded-[44px]" />
            <div className="absolute inset-3 rounded-[28px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_100%)] sm:inset-4 sm:rounded-[36px]" />

            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 sm:left-6 sm:top-6 sm:px-4 sm:py-2 sm:text-sm">
              Energy routing
            </div>

            <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/20 bg-[#fffdf7]/90 p-4 shadow-[0_35px_90px_-55px_rgba(16,38,27,0.8)] sm:w-[88%] sm:rounded-[34px] sm:p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[#6d826f]">Model preview</p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#10261b] sm:text-3xl">Choose speed. Keep depth.</h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-[26px] border border-[#dce9e0] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf9f1] text-[#1d6d47]">
                      <Leaf size={18} />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[#14261a]">Low-Energy</p>
                      <p className="mt-1 text-sm leading-6 text-[#4f6659]">Built for direct questions, short tasks, and faster response time.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#f1e4c1] bg-[#fff8e7] p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[#a27214]">
                      <Clock3 size={18} />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[#7f5b10]">Auto Balance</p>
                      <p className="mt-1 text-sm leading-6 text-[#816524]">Routes the prompt automatically so easy work stays fast and hard work gets more thinking time.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#f2d5d1] bg-[#fff2ed] p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[#bd5c3b]">
                      <Flame size={18} />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[#873d2b]">High-Energy</p>
                      <p className="mt-1 text-sm leading-6 text-[#965342]">Uses more reasoning time for coding, debugging, planning, architecture, and deeper analysis.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] bg-[#11271d] p-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Energy AI</p>
                <p className="mt-2 text-lg font-semibold tracking-[-0.03em]">Fast for the easy parts. Deep for the important parts.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
