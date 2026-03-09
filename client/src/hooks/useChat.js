import { useEffect, useMemo, useRef, useState } from "react";
import { fetchChats, saveChats, streamChat } from "../lib/api";

function bootstrapMessage() {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "I am Energy AI. Ask anything and I will balance low-energy speed with high-energy reasoning, plus show sources when reliable context is available.",
    meta: {
      model: "bootstrap",
      energyMode: "low"
    }
  };
}

function newSession() {
  const id = crypto.randomUUID();
  return {
    id,
    title: "Untitled Session",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [bootstrapMessage()]
  };
}

function deriveTitle(messages) {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) {
    return "Untitled Session";
  }
  const trimmed = firstUserMessage.content.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}...` : trimmed;
}

function normalizeSessions(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value.map((session) => ({
    ...session,
    messages: Array.isArray(session.messages)
      ? session.messages.map((message, index) => {
          if (message.meta?.model !== "bootstrap") {
            return message;
          }

          return {
            ...bootstrapMessage(),
            id: message.id || `bootstrap-${index}`
          };
        })
      : [bootstrapMessage()]
  }));
}

export function useChat({ enabled }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [activeMode, setActiveMode] = useState("auto");
  const sessionsRef = useRef([]);
  const saveQueueRef = useRef(Promise.resolve());

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    let ignore = false;

    async function loadChats() {
      if (!enabled) {
        setSessions([]);
        setActiveSessionId(null);
        setSyncError("");
        setIsHydrating(false);
        return;
      }

      setIsHydrating(true);
      setSyncError("");

      try {
        const result = await fetchChats();
        let nextSessions = normalizeSessions(result.sessions);

        if (nextSessions.length === 0) {
          nextSessions = [newSession()];
          void queuePersist(nextSessions);
        }

        if (!ignore) {
          sessionsRef.current = nextSessions;
          setSessions(nextSessions);
          setActiveSessionId((current) => nextSessions.find((session) => session.id === current)?.id || nextSessions[0]?.id || null);
        }
      } catch (error) {
        const fallback = [newSession()];
        if (!ignore) {
          sessionsRef.current = fallback;
          setSessions(fallback);
          setActiveSessionId(fallback[0].id);
          setSyncError(error.message || "Could not load chats.");
        }
      } finally {
        if (!ignore) {
          setIsHydrating(false);
        }
      }
    }

    void loadChats();

    return () => {
      ignore = true;
    };
  }, [enabled]);

  function queuePersist(nextSessions) {
    if (!enabled) {
      return Promise.resolve();
    }

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await saveChats(nextSessions);
        setSyncError("");
      })
      .catch((error) => {
        setSyncError(error.message || "Could not sync chats.");
      });

    return saveQueueRef.current;
  }

  function replaceSessions(nextSessions) {
    sessionsRef.current = nextSessions;
    setSessions(nextSessions);
    return nextSessions;
  }

  function mutateSession(sessionId, mutate) {
    const next = sessionsRef.current.map((session) => {
      if (session.id !== sessionId) {
        return session;
      }

      const updated = mutate(session);
      return {
        ...updated,
        title: deriveTitle(updated.messages),
        updatedAt: Date.now()
      };
    });

    return replaceSessions(next);
  }

  function createChat() {
    const created = newSession();
    const next = replaceSessions([created, ...sessionsRef.current]);
    setActiveSessionId(created.id);
    void queuePersist(next);
  }

  function removeChat(chatId) {
    const remaining = sessionsRef.current.filter((session) => session.id !== chatId);
    const next = remaining.length > 0 ? remaining : [newSession()];

    replaceSessions(next);
    void queuePersist(next);

    if (activeSessionId === chatId) {
      setActiveSessionId(next[0].id);
    }
  }

  async function sendMessage(content) {
    const trimmed = content.trim();
    const currentSession = sessionsRef.current.find((session) => session.id === activeSessionId) || sessionsRef.current[0];
    if (!trimmed || !currentSession) {
      return;
    }

    const sessionId = currentSession.id;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed
    };
    const assistantId = crypto.randomUUID();
    const assistantPlaceholder = {
      id: assistantId,
      role: "assistant",
      content: "",
      meta: {
        model: "energy-router",
        energyMode: "low",
        latencyMs: 0
      }
    };

    const payloadMessages = [...currentSession.messages, userMessage];

    mutateSession(sessionId, (session) => ({
      ...session,
      messages: [...session.messages, userMessage, assistantPlaceholder]
    }));

    setIsLoading(true);
    const startedAt = performance.now();
    const controller = new AbortController();

    try {
      await streamChat({
        messages: payloadMessages,
        mode: activeMode,
        signal: controller.signal,
        onEvent: (event) => {
          mutateSession(sessionId, (session) => {
            const nextMessages = session.messages.map((message) => {
              if (message.id !== assistantId) {
                return message;
              }

              if (event.type === "start") {
                return {
                  ...message,
                  meta: {
                    ...message.meta,
                    model: event.model,
                    role: event.role,
                    energyMode: event.energyMode,
                    routeReason: event.routeReason,
                    sources: Array.isArray(event.sources) ? event.sources : []
                  }
                };
              }

              if (event.type === "token") {
                return {
                  ...message,
                  content: message.content + event.token
                };
              }

              if (event.type === "final") {
                return {
                  ...message,
                  meta: {
                    ...message.meta,
                    latencyMs: Math.round(performance.now() - startedAt),
                    energyScore: event.energyScore,
                    model: event.model,
                    role: event.role,
                    energyMode: event.energyMode,
                    routeReason: event.routeReason,
                    sources: Array.isArray(event.sources) ? event.sources : message.meta?.sources || []
                  }
                };
              }

              return message;
            });

            return {
              ...session,
              messages: nextMessages
            };
          });
        }
      });
      await queuePersist(sessionsRef.current);
    } catch (error) {
      mutateSession(sessionId, (session) => ({
        ...session,
        messages: session.messages.map((message) => {
          if (message.id !== assistantId) {
            return message;
          }

          return {
            ...message,
            content:
              "I could not reach the Energy AI backend. Start the server and confirm the provider settings in `.env`."
          };
        })
      }));
      console.error(error);
      await queuePersist(sessionsRef.current);
    } finally {
      setIsLoading(false);
    }
  }

  return {
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
  };
}
