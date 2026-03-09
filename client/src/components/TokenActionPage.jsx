import { CheckCircle2, Loader2, Mail, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function TokenActionPage({
  mode,
  token,
  email = "",
  onVerifyEmail,
  onResetPassword,
  onResendVerification,
  navigate
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [isBusy, setIsBusy] = useState(mode === "verify-email" && Boolean(token));
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (mode !== "verify-email" || !token) {
      return undefined;
    }

    let ignore = false;

    async function runVerification() {
      if (!token) {
        setStatus({
          tone: "error",
          text: "This verification link is missing its token."
        });
        setIsBusy(false);
        return;
      }

      try {
        await onVerifyEmail(token);
        if (!ignore) {
          setStatus({
            tone: "success",
            text: "Email verified. You can continue to the app now."
          });
        }
      } catch (error) {
        if (!ignore) {
          setStatus({
            tone: "error",
            text: error.message || "Verification failed."
          });
        }
      } finally {
        if (!ignore) {
          setIsBusy(false);
        }
      }
    }

    void runVerification();

    return () => {
      ignore = true;
    };
  }, [mode, onVerifyEmail, token]);

  async function submitReset(event) {
    event.preventDefault();

    if (!token) {
      setStatus({
        tone: "error",
        text: "This reset link is missing its token."
      });
      return;
    }
    if (password.length < 8) {
      setStatus({
        tone: "error",
        text: "Password must be at least 8 characters."
      });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({
        tone: "error",
        text: "Passwords do not match."
      });
      return;
    }

    setStatus(null);
    setIsBusy(true);

    try {
      const result = await onResetPassword({ token, password });
      setStatus({
        tone: "success",
        text: result.message || "Password updated."
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error.message || "Reset failed."
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function resendVerification() {
    setIsResending(true);
    setStatus(null);

    try {
      const result = await onResendVerification({ email });
      setStatus({
        tone: result.emailDelivery?.previewOnly ? "neutral" : "success",
        text: result.emailDelivery?.previewOnly
          ? "Verification email prepared. Delivery is disabled, so a preview link is shown below."
          : result.message || "Verification email sent.",
        previewUrl: result.emailDelivery?.previewUrl
      });
    } catch (error) {
      setStatus({
        tone: "error",
        text: error.message || "Could not resend verification email."
      });
    } finally {
      setIsResending(false);
    }
  }

  if (mode === "verify-email") {
    return (
      <AuthShell
        mode={mode}
        footer={
          <p>
            Need to sign in first?{" "}
            <button type="button" onClick={() => navigate("login")} className="font-semibold text-[#0f2f20]">
              Go to login
            </button>
          </p>
        }
      >
        <p className="text-xs uppercase tracking-[0.24em] text-[#6a7e73]">Verification</p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-[#10261b]">
          {token ? "Confirming your email" : "Check your email"}
        </h2>
        <p className="mt-2 text-sm text-[#4d6357]">
          {token
            ? "Energy AI is validating the token from your verification link."
            : email
              ? `Use the verification link sent to ${email}. If it expired, resend it below.`
              : "Open the verification link from your inbox. If you need a new one, go back and resend it from sign in."}
        </p>

        <div className="mt-6 space-y-4">
          {isBusy ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#d8dfd8] bg-[#fbfcfa] px-4 py-3 text-sm text-[#365041]">
              <Loader2 size={16} className="animate-spin" />
              Verifying email
            </div>
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

          <div className="flex flex-col gap-3 sm:flex-row">
            {status?.tone === "success" ? (
              <button
                type="button"
                onClick={() => navigate("login")}
                className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-[#0f2f20] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#164a31]"
              >
                <CheckCircle2 size={16} />
                Go to sign in
              </button>
            ) : null}
            {email ? (
              <button
                type="button"
                onClick={resendVerification}
                disabled={isResending}
                className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-[#cad6cf] bg-white px-4 py-3 text-sm font-semibold text-[#173127] transition hover:bg-[#f4f8f4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Resend verification
              </button>
            ) : null}
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      mode={mode}
      footer={
        <p>
          Back to account access?{" "}
          <button type="button" onClick={() => navigate("login")} className="font-semibold text-[#0f2f20]">
            Sign in
          </button>
        </p>
      }
    >
      <p className="text-xs uppercase tracking-[0.24em] text-[#6a7e73]">Reset password</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] text-[#10261b]">Choose a new password</h2>
      <p className="mt-2 text-sm text-[#4d6357]">Enter a new password for this account. Old sessions are removed after reset.</p>

      <form onSubmit={submitReset} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#173127]">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className="w-full rounded-[20px] border border-[#d6ddd6] bg-[#fbfcfa] px-4 py-3 text-sm text-[#14261a] outline-none transition focus:border-[#1d6d47] focus:bg-white"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#173127]">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Repeat the password"
            className="w-full rounded-[20px] border border-[#d6ddd6] bg-[#fbfcfa] px-4 py-3 text-sm text-[#14261a] outline-none transition focus:border-[#1d6d47] focus:bg-white"
          />
        </label>

        {status ? (
          <Notice tone={status.tone}>
            <div>{status.text}</div>
          </Notice>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-[#0f2f20] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#164a31] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          Save new password
        </button>
      </form>
    </AuthShell>
  );
}
