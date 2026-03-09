import {
  ArrowRight,
  BarChart3,
  LockKeyhole,
  MailCheck,
  MessageCircleMore,
  Sparkles,
  Zap
} from "lucide-react";

function FloatingStat({ label, value, tint, className = "" }) {
  return (
    <div
      className={`animate-rise rounded-[26px] border border-white/60 p-4 shadow-[0_30px_80px_-48px_rgba(15,47,32,0.55)] backdrop-blur-xl ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/70">{label}</p>
      <p className={`mt-2 font-display text-3xl font-bold tracking-[-0.04em] ${tint}`}>{value}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body, accent }) {
  return (
    <article className="animate-rise rounded-[30px] border border-white/60 bg-white/82 p-5 shadow-[0_30px_80px_-52px_rgba(15,47,32,0.55)] backdrop-blur">
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
        <Icon size={18} />
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold tracking-[-0.03em] text-[#10261b]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#4d6357]">{body}</p>
    </article>
  );
}

function CTAButton({ filled = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
        filled
          ? "bg-[#10261b] text-white shadow-[0_24px_40px_-24px_rgba(15,47,32,0.8)] hover:bg-[#183528]"
          : "border border-[#cad9cf] bg-white/80 text-[#10261b] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function HomePage({ isAuthenticated, user, onNavigate }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe4] text-[#10261b]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(circle_at_top_left,rgba(255,190,59,0.28),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(36,170,120,0.24),transparent_24%),radial-gradient(circle_at_72%_42%,rgba(255,122,89,0.24),transparent_18%)]" />
        <div className="absolute left-[-7rem] top-[16rem] h-80 w-80 rounded-full bg-[#7dd0a9]/30 blur-3xl" />
        <div className="absolute right-[-5rem] top-[7rem] h-72 w-72 rounded-full bg-[#ffd36d]/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[12%] h-96 w-96 rounded-full bg-[#ff9a7a]/22 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-4 pb-10 pt-6 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/55 bg-white/68 px-5 py-3 shadow-[0_24px_70px_-50px_rgba(15,47,32,0.5)] backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#10261b_0%,#2e8f63_100%)] text-white shadow-[0_20px_40px_-26px_rgba(16,38,27,0.8)]">
              <Zap size={18} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Energy AI</p>
              <p className="text-xs uppercase tracking-[0.2em] text-[#6c8074]">Private AI workspace</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="rounded-full border border-[#d7dfd9] bg-white/80 px-4 py-2 text-sm text-[#3e5a4c]">
                  {user?.name || "Signed in"}
                </span>
                <CTAButton onClick={() => onNavigate("analytics")}>Analytics</CTAButton>
                <CTAButton filled onClick={() => onNavigate("chat")}>
                  Open Workspace
                  <ArrowRight size={15} />
                </CTAButton>
              </>
            ) : (
              <>
                <CTAButton onClick={() => onNavigate("login")}>Sign in</CTAButton>
                <CTAButton filled onClick={() => onNavigate("signup")}>
                  Create account
                  <ArrowRight size={15} />
                </CTAButton>
              </>
            )}
          </div>
        </header>

        <div className="grid flex-1 gap-10 pb-10 pt-10 lg:grid-cols-[minmax(0,1.05fr)_520px] lg:items-center lg:pt-14">
          <div className="max-w-3xl">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-[#eadcb7] bg-white/72 px-4 py-2 text-sm font-semibold text-[#78590e] backdrop-blur">
              <Sparkles size={15} />
              Cleaner home. Private user chats. Verification-ready auth.
            </div>

            <h1 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[0.92] tracking-[-0.06em] text-[#0f2419] sm:text-6xl lg:text-7xl">
              A colorful home page with space to breathe.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#496252] sm:text-lg">
              Energy AI now starts with a proper landing page instead of dropping users into a cramped screen. The new
              flow is brighter, more open, and leads cleanly into account creation, private chats, analytics, email
              verification, and password recovery.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <CTAButton filled onClick={() => onNavigate(isAuthenticated ? "chat" : "signup")}>
                {isAuthenticated ? "Go to chat" : "Start free"}
                <ArrowRight size={15} />
              </CTAButton>
              <CTAButton onClick={() => onNavigate(isAuthenticated ? "analytics" : "login")}>
                {isAuthenticated ? "View analytics" : "Sign in"}
              </CTAButton>
            </div>

            <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
              <div className="animate-rise rounded-[24px] border border-white/55 bg-white/74 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b8074]">Separated</p>
                <p className="mt-2 text-sm leading-6 text-[#365041]">Each user gets their own chats instead of one universal history.</p>
              </div>
              <div className="animate-rise rounded-[24px] border border-white/55 bg-white/74 p-4 backdrop-blur [animation-delay:120ms]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b8074]">Verified</p>
                <p className="mt-2 text-sm leading-6 text-[#365041]">Email confirmation, resend verification, and password reset are ready.</p>
              </div>
              <div className="animate-rise rounded-[24px] border border-white/55 bg-white/74 p-4 backdrop-blur [animation-delay:220ms]">
                <p className="text-xs uppercase tracking-[0.18em] text-[#6b8074]">Focused</p>
                <p className="mt-2 text-sm leading-6 text-[#365041]">The layout stays spacious, colorful, and easier to scan on desktop and mobile.</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[480px]">
            <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(155deg,rgba(16,38,27,0.92)_0%,rgba(38,126,86,0.88)_46%,rgba(255,134,92,0.84)_100%)] shadow-[0_50px_120px_-60px_rgba(16,38,27,0.85)]" />
            <div className="absolute inset-4 rounded-[34px] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_100%)]" />

            <FloatingStat
              label="Auth"
              value="Ready"
              tint="text-[#f7ebbd]"
              className="absolute left-5 top-6 w-[180px] bg-white/14"
            />
            <FloatingStat
              label="User memory"
              value="Private"
              tint="text-[#d5ffe6]"
              className="absolute right-5 top-20 w-[190px] bg-white/14 [animation-delay:120ms]"
            />
            <FloatingStat
              label="Chat routes"
              value="Low + High"
              tint="text-[#ffe3d6]"
              className="absolute left-8 bottom-24 w-[210px] bg-white/14 [animation-delay:220ms]"
            />

            <div className="absolute left-1/2 top-1/2 w-[88%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[34px] border border-white/20 bg-[#fffdf7]/92 p-5 shadow-[0_35px_90px_-55px_rgba(16,38,27,0.8)] animate-rise">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#6d826f]">Workspace preview</p>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em] text-[#10261b]">Made to feel lighter.</h2>
                </div>
                <span className="rounded-full bg-[#f4efe4] px-3 py-1 text-xs font-semibold text-[#5b713f]">New home</span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-[#e5eadf] bg-white p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf9f1] text-[#1d6d47]">
                      <MessageCircleMore size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#14261a]">Private chat threads</p>
                      <p className="text-sm text-[#4f6659]">Conversations are stored per account, not shared globally.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-[#f1e4c1] bg-[#fff8e7] p-4">
                    <MailCheck className="text-[#a27214]" size={18} />
                    <p className="mt-3 text-sm font-semibold text-[#7f5b10]">Email flows</p>
                    <p className="mt-1 text-sm text-[#816524]">Verify, resend, reset.</p>
                  </div>
                  <div className="rounded-[24px] border border-[#cfe7db] bg-[#eef8f3] p-4">
                    <BarChart3 className="text-[#1f7a4c]" size={18} />
                    <p className="mt-3 text-sm font-semibold text-[#1d6d47]">Usage analytics</p>
                    <p className="mt-1 text-sm text-[#3f6a51]">Low-energy vs high-energy trends.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <FeatureCard
            icon={LockKeyhole}
            title="Proper authentication"
            body="Dedicated sign in, sign up, forgot password, reset password, and verify email pages instead of mixing everything into one crowded view."
            accent="bg-[#eef8f3] text-[#1d6d47]"
          />
          <FeatureCard
            icon={MessageCircleMore}
            title="User-specific chat memory"
            body="Chats are synced against the signed-in account, so one person’s sessions no longer appear for someone else."
            accent="bg-[#fff7e6] text-[#9a6712]"
          />
          <FeatureCard
            icon={MailCheck}
            title="Brevo-ready recovery"
            body="The backend already supports verification and password recovery email flows. Once your Brevo keys are added, those emails go out for real."
            accent="bg-[#fff1ed] text-[#b55335]"
          />
        </section>
      </section>
    </main>
  );
}
