import { Flame, Leaf, TimerReset, Zap } from "lucide-react";

const MODE_COPY = {
  login: {
    eyebrow: "Adaptive Model System",
    title: "Fast when simple. Deep when it matters.",
    description:
      "Energy AI uses Low-Energy mode for faster response time on direct questions, and High-Energy mode for slower, deeper reasoning on harder work."
  },
  signup: {
    eyebrow: "Energy Modes",
    title: "Two models. Two response speeds.",
    description:
      "Low-Energy answers with speed and efficiency. High-Energy spends more time for coding, analysis, architecture, and complex reasoning."
  },
  "forgot-password": {
    eyebrow: "Response Timing",
    title: "Short answers fast. Hard answers deep.",
    description:
      "Energy AI balances time and reasoning cost. Simple prompts return quickly, while difficult prompts can take longer to think through properly."
  },
  "reset-password": {
    eyebrow: "Reasoning Budget",
    title: "Speed for basics. Depth for complexity.",
    description:
      "The Fast model focuses on quick useful output. The Deep model uses more reasoning time to produce stronger analysis and more deliberate answers."
  },
  "verify-email": {
    eyebrow: "Energy AI Models",
    title: "One system with low-energy and high-energy thinking.",
    description:
      "Energy AI can stay lightweight for everyday prompts or move into a deeper mode when the request needs more time, structure, and reasoning."
  }
};

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#f6e7b4]">
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{body}</p>
    </div>
  );
}

export default function AuthShell({ mode, children, footer }) {
  const copy = MODE_COPY[mode] || MODE_COPY.login;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3efe4]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(244,196,48,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(26,82,57,0.16),transparent_24%)]" />
        <div className="absolute right-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-[#f2d7a4]/45 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-80 w-80 rounded-full bg-[#8fc0a9]/40 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1380px] items-center px-4 py-8 lg:px-6">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.2fr)_460px]">
          <div className="overflow-hidden rounded-[40px] border border-[#143324]/12 bg-[linear-gradient(145deg,#0d2218_0%,#123526_48%,#45281b_100%)] p-6 text-white shadow-[0_45px_120px_-60px_rgba(15,47,32,0.75)] lg:p-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-[#f7e6ad]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/14 bg-white/10 text-white">
                <Zap size={17} />
              </span>
              Energy AI Models
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.26em] text-[#c5d8cc]">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/74">{copy.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Feature
                icon={Leaf}
                title="Low-Energy Model"
                body="Optimized for faster response time on direct questions, quick facts, and lightweight tasks."
              />
              <Feature
                icon={Flame}
                title="High-Energy Model"
                body="Uses more time and reasoning depth for coding, debugging, architecture, and multi-step analysis."
              />
              <Feature
                icon={TimerReset}
                title="Auto Energy Balance"
                body="Energy AI shifts between speed and depth so each answer matches the complexity of the prompt."
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full rounded-[34px] border border-[#143324]/10 bg-white/85 p-5 shadow-[0_35px_90px_-60px_rgba(15,47,32,0.65)] backdrop-blur sm:p-6">
              {children}
              {footer ? <div className="mt-6 border-t border-[#d8dfd8] pt-4 text-sm text-[#4b6257]">{footer}</div> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
