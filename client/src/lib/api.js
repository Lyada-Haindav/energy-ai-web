function defaultApiBase() {
  if (typeof window === "undefined") {
    return "http://localhost:8787";
  }

  if (window.location.hostname === "localhost" && window.location.port === "5173") {
    return "http://localhost:8787";
  }

  return window.location.origin;
}

const API_BASE = import.meta.env.VITE_API_BASE || defaultApiBase();

let authToken = "";

function authHeaders() {
  return authToken
    ? {
        Authorization: `Bearer ${authToken}`
      }
    : {};
}

async function readError(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    if (data?.error) {
      return data.error;
    }
  }

  const text = await response.text().catch(() => "");
  return text || "Request failed.";
}

async function request(path, { method = "GET", body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders()
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  if (!response.ok) {
    const error = new Error(await readError(response));
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function setAuthToken(token) {
  authToken = String(token || "");
}

export function register(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: payload
  });
}

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: payload
  });
}

export function logout() {
  return request("/api/auth/logout", {
    method: "POST"
  });
}

export function whoAmI() {
  return request("/api/auth/me");
}

export function verifyEmail(payload) {
  return request("/api/auth/verify-email", {
    method: "POST",
    body: payload
  });
}

export function resendVerification(payload) {
  return request("/api/auth/resend-verification", {
    method: "POST",
    body: payload
  });
}

export function forgotPassword(payload) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: payload
  });
}

export function resetPassword(payload) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: payload
  });
}

export function fetchChats() {
  return request("/api/chats");
}

export function saveChats(sessions) {
  return request("/api/chats", {
    method: "PUT",
    body: {
      sessions
    }
  });
}

export async function streamChat({ messages, mode, signal, onEvent }) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: JSON.stringify({ messages, mode }),
    signal
  });

  if (!response.ok || !response.body) {
    const error = new Error(await readError(response));
    error.status = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    lines.forEach((line) => {
      if (!line.trim()) {
        return;
      }

      try {
        onEvent(JSON.parse(line));
      } catch {
        // Ignore malformed chunks from partial output.
      }
    });
  }

  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer));
    } catch {
      // Ignore final malformed chunk.
    }
  }
}
