import { ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import AuthShell from "./AuthShell";

function Notice({ tone = "neutral", children }) {
  const toneClass =
    tone === "error"
      ? "border-[#f0c9c9] bg-[#fff4f4] text-[#8a2f2f]"
      : tone === "success"
        ? "border-[#cde7d8] bg-[#eff9f3] text-[#1d6d47]"
        : "border-[#e2d6b7] bg-[#fff8ea] text-[#7b5b12]";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#173127]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-[20px] border border-[#d6ddd6] bg-[#fbfcfa] px-4 py-3 text-sm text-[#14261a] outline-none transition focus:border-[#1d6d47] focus:bg-white"
      />
    </label>
  );
}

export default function AuthPage({
  mode,
  onLogin,
  onRegister,
  onForgotPassword,
  navigate,
  defaultEmail = ""
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isForgot = mode === "forgot-password";

  const title = useMemo(() => {
    if (isSignup) {
      return "Create account";
    }
    if (isForgot) {
      return "Forgot password";
    }
    return "Welcome back";
  }, [isForgot, isSignup]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (isSignup) {
        const result = await onRegister({ name, email, password });
        setStatus({
          tone: result.emailDelivery?.previewOnly ? "neutral" : "success",
          text: result.emailDelivery?.previewOnly
            ? "Account created. Email delivery is not configured yet, so a preview verification link is shown below."
            : "Account created. Check your inbox to verify your email."
        });
        navigate("chat");
        return;
      }

      if (isForgot) {
        const result = await onForgotPassword({ email });
        setStatus({
          tone: result.emailDelivery?.previewOnly ? "neutral" : "success",
          text: result.emailDelivery?.previewOnly
            ? "Reset flow created. Email delivery is disabled, so a preview reset link is shown below."
            : result.message || "If that account exists, a reset email is on the way.",
          previewUrl: result.emailDelivery?.previewUrl
        });
        return;
      }

      await onLogin({ email, password });
      navigate("chat");
    } catch (error) {
      setStatus({
        tone: "error",
        text: error.message || "Request failed."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const footer = isSignup ? (
    <p>
      Already have an account?{" "}
      <button type="button" onClick={() => navigate("login")} className="font-semibold text-[#0f2f20]">
        Sign in
      </button>
    </p>
  ) : isForgot ? (
    <p>
      Remembered it?{" "}
      <button type="button" onClick={() => navigate("login")} className="font-semibold text-[#0f2f20]">
        Back to sign in
      </button>
    </p>
  ) : (
    <p>
      Need an account?{" "}
      <button type="button" onClick={() => navigate("signup")} className="font-semibold text-[#0f2f20]">
        Create one
      </button>
    </p>
  );

  return (
    <AuthShell mode={mode} footer={footer}>
      <p className="text-xs uppercase tracking-[0.24em] text-[#6a7e73]">{isSignup ? "New user" : isForgot ? "Recovery" : "Sign in"}</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-[#10261b]">{title}</h2>
      <p className="mt-2 text-sm text-[#4d6357]">
        {isSignup
          ? "Create a real account so chats stay separate for every user."
          : isForgot
            ? "Enter your account email and Energy AI will prepare a reset link."
            : "Sign in to your account and continue with your own private history."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isSignup ? (
          <Field
            label="Full name"
            value={name}
            onChange={setName}
            placeholder="Your name"
            autoComplete="name"
          />
        ) : null}

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />

        {!isForgot ? (
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        ) : null}

        {status ? (
          <Notice tone={status.tone}>
            <div>{status.text}</div>
            {status.previewUrl ? (
              <a href={status.previewUrl} className="mt-2 block break-all font-semibold text-[#0f2f20]">
                {status.previewUrl}
              </a>
            ) : null}
          </Notice>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#0f2f20] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#164a31] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {isSignup ? "Create account" : isForgot ? "Send reset link" : "Sign in"}
        </button>

        {!isForgot && !isSignup ? (
          <button
            type="button"
            onClick={() => navigate("forgot-password")}
            className="w-full text-sm font-semibold text-[#476154] transition hover:text-[#0f2f20]"
          >
            Forgot password?
          </button>
        ) : null}
      </form>
    </AuthShell>
  );
}
