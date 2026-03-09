const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

function getAppBaseUrl() {
  return String(
    process.env.APP_BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.ALLOWED_ORIGIN ||
      "http://localhost:5173"
  ).replace(/\/$/, "");
}

function senderConfig() {
  const email = process.env.EMAIL_FROM || "";
  const name = process.env.EMAIL_FROM_NAME || "Energy AI";
  return email ? { email, name } : null;
}

async function sendBrevoEmail({ to, subject, htmlContent, textContent }) {
  const sender = senderConfig();
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || !sender) {
    return {
      delivered: false,
      previewOnly: true
    };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      sender,
      to: [
        {
          email: to.email,
          name: to.name || to.email
        }
      ],
      subject,
      htmlContent,
      textContent
    })
  });

  if (!response.ok) {
    const details = await response.text();
    const error = new Error(`Brevo send failed: ${details || response.statusText}`);
    error.statusCode = 502;
    throw error;
  }

  return {
    delivered: true,
    previewOnly: false
  };
}

export function buildVerifyUrl(token) {
  return `${getAppBaseUrl()}/#/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildResetUrl(token) {
  return `${getAppBaseUrl()}/#/reset-password?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail({ user, token }) {
  const verifyUrl = buildVerifyUrl(token);
  let result;

  try {
    result = await sendBrevoEmail({
      to: user,
      subject: "Verify your Energy AI email",
      textContent: `Verify your email for Energy AI: ${verifyUrl}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;color:#14261a;line-height:1.6">
          <h2 style="margin:0 0 12px">Verify your Energy AI email</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Confirm your email to finish setting up your account.</p>
          <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f2f20;color:#ffffff;text-decoration:none">Verify email</a></p>
          <p>If the button does not work, open this link:</p>
          <p>${verifyUrl}</p>
        </div>
      `
    });
  } catch (error) {
    result = {
      delivered: false,
      previewOnly: true,
      error: error instanceof Error ? error.message : "Brevo delivery failed."
    };
  }

  return {
    ...result,
    previewUrl: verifyUrl
  };
}

export async function sendPasswordResetEmail({ user, token }) {
  const resetUrl = buildResetUrl(token);
  let result;

  try {
    result = await sendBrevoEmail({
      to: user,
      subject: "Reset your Energy AI password",
      textContent: `Reset your Energy AI password: ${resetUrl}`,
      htmlContent: `
        <div style="font-family:Arial,sans-serif;color:#14261a;line-height:1.6">
          <h2 style="margin:0 0 12px">Reset your Energy AI password</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>Use this link to choose a new password. It expires in 30 minutes.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0f2f20;color:#ffffff;text-decoration:none">Reset password</a></p>
          <p>If the button does not work, open this link:</p>
          <p>${resetUrl}</p>
        </div>
      `
    });
  } catch (error) {
    result = {
      delivered: false,
      previewOnly: true,
      error: error instanceof Error ? error.message : "Brevo delivery failed."
    };
  }

  return {
    ...result,
    previewUrl: resetUrl
  };
}
