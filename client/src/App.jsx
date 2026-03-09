import {
  BarChart3,
  Flame,
  Leaf,
  Loader2,
  LogOut,
  MailCheck,
  MessageCircle,
  UserCircle2,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AnalyticsPage from "./components/AnalyticsPage";
import AuthPage from "./components/AuthPage";
import ChatWindow from "./components/ChatWindow";
import Composer from "./components/Composer";
import HomePage from "./components/HomePage";
import Sidebar from "./components/Sidebar";
import TokenActionPage from "./components/TokenActionPage";
import { useAuth } from "./hooks/useAuth";
import { useChat } from "./hooks/useChat";

const PUBLIC_ROUTES = new Set(["home", "login", "signup", "forgot-password", "reset-password", "verify-email"]);
const APP_ROUTES = new Set(["chat", "analytics"]);

function parseRoute() {
  const raw = window.location.hash || "#/home";
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const [pathPart, queryString = ""] = normalized.split("?");
  const params = new URLSearchParams(queryString);

  switch (pathPart) {
    case "/home":
      return { page: "home", token: params.get("token") || "" };
    case "/chat":
      return { page: "chat", token: params.get("token") || "" };
    case "/analytics":
      return { page: "analytics", token: params.get("token") || "" };
    case "/signup":
      return { page: "signup", token: params.get("token") || "" };
    case "/forgot-password":
      return { page: "forgot-password", token: params.get("token") || "" };
    case "/reset-password":
      return { page: "reset-password", token: params.get("token") || "" };
    case "/verify-email":
      return { page: "verify-email", token: params.get("token") || "" };
    case "/login":
      return { page: "login", token: params.get("token") || "" };
    default:
      return { page: "home", token: params.get("token") || "" };
  }
}

function hashForPage(page, params = {}) {
  const pathByPage = {
    home: "/home",
    chat: "/chat",
    analytics: "/analytics",
    login: "/login",
    signup: "/signup",
    "forgot-password": "/forgot-password",
    "reset-password": "/reset-password",
    "verify-email": "/verify-email"
  };

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return `#${pathByPage[page] || "/home"}${query ? `?${query}` : ""}`;
}

function StatusBanner({ tone = "neutral", children, action }) {
  const toneClass =
    tone === "error"
      ? "border-[#f0c9c9] bg-[#fff4f4] text-[#8a2f2f]"
      : tone === "success"
        ? "border-[#cde7d8] bg-[#eff9f3] text-[#1d6d47]"
        : "border-[#e2d6b7] bg-[#fff8ea] text-[#7b5b12]";

  return (
    <div
      className={`mb-4 flex flex-col gap-3 rounded-[24px] border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between ${toneClass}`}
    >
      <div>{children}</div>
      {action}
    </div>
  );
}

function AppShell({
  page,
  user,
  sessions,
  activeSession,
  activeSessionId,
  setActiveSessionId,
  createChat,
  removeChat,
  sendMessage,
  isLoading,
  isHydrating,
  syncError,
  activeMode,
  setActiveMode,
  onNavigate,
  onLogout,
  onResendVerification
}) {
  const [banner, setBanner] = useState(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  async function resendVerification() {
    setIsResendingVerification(true);

    try {
      const result = await onResendVerification({ email: user.email });
      setBanner({
        tone: result.emailDelivery?.previewOnly ? "neutral" : "success",
        text: result.emailDelivery?.previewOnly
          ? "Verification email prepared. Delivery is not configured yet, so use the preview link."
          : result.message || "Verification email sent.",
        previewUrl: result.emailDelivery?.previewUrl
      });
    } catch (error) {
      setBanner({
        tone: "error",
        text: error.message || "Could not resend verification email."
      });
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf3ee]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-[#bde3c9]/60 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-[#f1c5c5]/55 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(15,47,32,0.14),transparent_58%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[linear-gradient(135deg,#07130f_0%,#10261b_52%,#351616_100%)]">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:px-6">
          <div className="flex w-full items-center gap-3 text-white sm:w-auto">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-[#bfe1cc]">
              <Zap size={16} />
            </span>
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em]">Energy AI</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Low-energy speed. High-energy depth.</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <div className="hidden items-center gap-2 md:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3f7d5d] bg-[#163726] px-2.5 py-1 text-[11px] font-semibold text-[#bfe1cc]">
                <Leaf size={12} />
                Low Energy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7f3a3a] bg-[#361818] px-2.5 py-1 text-[11px] font-semibold text-[#f2c3c3]">
                <Flame size={12} />
                High Energy
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigate("chat")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                  page === "chat" ? "bg-white text-[#10261b]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <MessageCircle size={14} />
                Chat
              </button>
              <button
                type="button"
                onClick={() => onNavigate("analytics")}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold transition sm:flex-none ${
                  page === "analytics" ? "bg-white text-[#10261b]" : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <BarChart3 size={14} />
                Analytics
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-white/85">
              <UserCircle2 size={18} />
              <div className="text-left">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="mt-1 text-xs text-white/60">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/14 bg-white/8 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <section
        className={`relative mx-auto w-full max-w-[1440px] p-3 sm:p-4 lg:p-6 ${
          page === "chat" ? "lg:h-[calc(100vh-4.5rem)] lg:overflow-hidden" : ""
        }`}
      >
        {!user.emailVerified ? (
          <StatusBanner
            tone="neutral"
            action={
              <button
                type="button"
                onClick={resendVerification}
                disabled={isResendingVerification}
                className="inline-flex items-center gap-2 rounded-xl border border-[#d8cca2] bg-white/80 px-3 py-2 font-semibold text-[#5a4814] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingVerification ? <Loader2 size={14} className="animate-spin" /> : <MailCheck size={14} />}
                Resend verification
              </button>
            }
          >
            Verify <strong>{user.email}</strong> to complete your account setup.
          </StatusBanner>
        ) : null}

        {banner ? (
          <StatusBanner tone={banner.tone}>
            <div>
              <div>{banner.text}</div>
              {banner.previewUrl ? (
                <a href={banner.previewUrl} className="mt-2 block break-all font-semibold text-[#0f2f20]">
                  {banner.previewUrl}
                </a>
              ) : null}
            </div>
          </StatusBanner>
        ) : null}

        {syncError ? <StatusBanner tone="error">{syncError}</StatusBanner> : null}

        {isHydrating ? (
          <div className="flex min-h-[55vh] items-center justify-center rounded-[34px] border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-[#d8dfd8] bg-[#fbfcfa] px-5 py-3 text-sm text-[#365041]">
              <Loader2 size={16} className="animate-spin" />
              Loading your private chats
            </div>
          </div>
        ) : page === "chat" ? (
          <div className="grid gap-4 lg:h-full lg:grid-cols-[300px_minmax(0,1fr)]">
            <Sidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              createChat={createChat}
              removeChat={removeChat}
              owner={user.email}
            />
            <section className="grid min-h-0 gap-3 lg:h-full lg:grid-rows-[minmax(0,1fr)_auto]">
              <ChatWindow messages={activeSession?.messages || []} isLoading={isLoading} userName={user.name} />
              <Composer isLoading={isLoading} onSend={sendMessage} mode={activeMode} setMode={setActiveMode} />
            </section>
          </div>
        ) : (
          <AnalyticsPage sessions={sessions} />
        )}
      </section>
    </main>
  );
}

export default function App() {
  const {
    user,
    isAuthenticated,
    isBootstrapping,
    register,
    login,
    logout,
    refreshUser,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword
  } = useAuth();
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createChat,
    removeChat,
    sendMessage,
    isLoading,
    isHydrating,
    syncError,
    activeMode,
    setActiveMode
  } = useChat({ enabled: isAuthenticated });

  const [route, setRoute] = useState(parseRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(page, params = {}) {
    window.location.hash = hashForPage(page, params);
  }

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    if (!isAuthenticated && APP_ROUTES.has(route.page)) {
      navigate("login");
      return;
    }

    if (isAuthenticated && (route.page === "login" || route.page === "signup")) {
      navigate("chat");
    }
  }, [isAuthenticated, isBootstrapping, route.page]);

  const page = useMemo(() => route.page, [route.page]);

  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#edf3ee] px-4">
        <div className="inline-flex items-center gap-3 rounded-[24px] border border-[#d8dfd8] bg-white px-5 py-4 text-sm text-[#365041] shadow-soft">
          <Loader2 size={16} className="animate-spin" />
          Loading Energy AI
        </div>
      </main>
    );
  }

  if (page === "home") {
    return <HomePage isAuthenticated={isAuthenticated} user={user} onNavigate={navigate} />;
  }

  if (!isAuthenticated && PUBLIC_ROUTES.has(page)) {
    if (page === "reset-password" || page === "verify-email") {
      return (
        <TokenActionPage
          mode={page}
          token={route.token}
          onVerifyEmail={async (tokenValue) => {
            const result = await verifyEmail(tokenValue);
            await refreshUser().catch(() => null);
            return result;
          }}
          onResetPassword={resetPassword}
          onResendVerification={resendVerification}
          navigate={navigate}
        />
      );
    }

    return (
      <AuthPage
        mode={page}
        onLogin={login}
        onRegister={register}
        onForgotPassword={forgotPassword}
        navigate={navigate}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthPage
        mode="login"
        onLogin={login}
        onRegister={register}
        onForgotPassword={forgotPassword}
        navigate={navigate}
      />
    );
  }

  if (page === "reset-password" || page === "verify-email") {
    return (
      <TokenActionPage
        mode={page}
        token={route.token}
        email={user.email}
        onVerifyEmail={async (tokenValue) => {
          const result = await verifyEmail(tokenValue);
          await refreshUser();
          return result;
        }}
        onResetPassword={resetPassword}
        onResendVerification={resendVerification}
        navigate={navigate}
      />
    );
  }

  return (
    <AppShell
      page={page}
      user={user}
      sessions={sessions}
      activeSession={activeSession}
      activeSessionId={activeSessionId}
      setActiveSessionId={setActiveSessionId}
      createChat={createChat}
      removeChat={removeChat}
      sendMessage={sendMessage}
      isLoading={isLoading}
      isHydrating={isHydrating}
      syncError={syncError}
      activeMode={activeMode}
      setActiveMode={setActiveMode}
      onNavigate={navigate}
      onLogout={async () => {
        await logout();
        navigate("home");
      }}
      onResendVerification={resendVerification}
    />
  );
}
