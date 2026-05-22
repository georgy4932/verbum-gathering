"use client";

import { useState, useRef, useTransition } from "react";
import { getOrCreateCompanionThread } from "@/app/actions/companion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICompanionProps {
  passageRef: string;
  passageText: string;
  initialMessages?: Message[];
  initialThreadId?: string | null;
}

export default function AICompanion({
  passageRef,
  passageText,
  initialMessages = [],
  initialThreadId = null,
}: AICompanionProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    let activeThreadId = threadId;

    // Create thread on first message
    if (!activeThreadId) {
      const result = await getOrCreateCompanionThread(passageRef);
      if (!result.success || !result.data) return;
      activeThreadId = result.data.threadId;
      setThreadId(activeThreadId);
    }

    setInput("");
    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/companion-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThreadId,
          passageRef,
          passageText,
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();

      if (res.status === 503 && data.error === "companion_unavailable") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "The AI companion is not available in this environment. You can still read, reflect, and write notes on this passage." },
        ]);
      } else if (!res.ok) {
        throw new Error(data.error ?? "Response error");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something prevented a response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 32 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--companion-lo)", display: "block", marginBottom: 12 }}>
          Ask about this passage
        </span>
        <p style={{ fontSize: 13, color: "var(--stone)", lineHeight: 1.7, marginBottom: 16, maxWidth: 480 }}>
          Ask a quiet question about this chapter. The text remains primary — the companion only serves it.
        </p>
        <button
          onClick={() => setOpen(true)}
          style={{
            fontSize: 13,
            color: "var(--companion)",
            background: "none",
            border: "1px solid var(--companion-lo)",
            borderRadius: 8,
            padding: "10px 20px",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Open companion
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--companion-lo)" }}>
          Companion — {passageRef}
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{ fontSize: 12, color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
        >
          close
        </button>
      </div>

      {/* Message thread */}
      <div style={{
        background: "var(--bg1)",
        borderRadius: 14,
        border: "1px solid var(--faint)",
        padding: "20px 24px",
        minHeight: 120,
        maxHeight: 420,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginBottom: 14,
      }}>
        {messages.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--stone)", fontStyle: "italic", margin: 0 }}>
            Ask a question about {passageRef}. The companion will serve the text, not replace it.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            {msg.role === "assistant" && (
              <span style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--companion-lo)", display: "block", marginBottom: 4 }}>
                Companion
              </span>
            )}
            <p style={{
              fontSize: msg.role === "assistant" ? "0.88rem" : "0.92rem",
              color: msg.role === "assistant" ? "var(--stone)" : "var(--muted)",
              lineHeight: 1.75,
              margin: 0,
              padding: "10px 14px",
              background: msg.role === "user" ? "var(--bg2)" : "transparent",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : 0,
              border: msg.role === "assistant" ? "none" : "1px solid var(--faint)",
            }}>
              {msg.content}
            </p>
          </div>
        ))}
        {loading && (
          <p style={{ fontSize: "0.85rem", color: "var(--stone)", fontStyle: "italic" }}>
            Reflecting…
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask a question about this passage…"
          disabled={loading}
          style={{
            flex: 1,
            background: "var(--bg2)",
            border: "1px solid var(--faint)",
            borderRadius: 8,
            color: "var(--cream)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            padding: "10px 14px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            fontSize: 13,
            color: "var(--bg)",
            background: loading || !input.trim() ? "var(--faint)" : "var(--companion)",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            cursor: loading || !input.trim() ? "default" : "pointer",
            transition: "background 0.2s",
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
