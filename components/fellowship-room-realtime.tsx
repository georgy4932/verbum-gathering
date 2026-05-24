"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

const MAX_CHARS = 280;

type Message = {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
};

type Props = {
  roomSlug: string;
  initialMessages: Message[];
};

export default function FellowshipRoomRealtime({ roomSlug, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft]       = useState("");
  const [sending, setSending]   = useState(false);
  const [notice, setNotice]     = useState("");

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`fellowship-messages-${roomSlug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fellowship_messages",
          filter: `room_slug=eq.${roomSlug}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [roomSlug]);

  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;

    if (trimmed.length > MAX_CHARS) {
      setNotice("Keep it brief and thoughtful.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const { data: { user } } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setNotice("Please sign in before sharing.");
        return;
      }

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const authorName = profile?.display_name || user.email || "Someone";

      const { data: inserted, error } = await supabaseBrowser
        .from("fellowship_messages")
        .insert({ room_slug: roomSlug, user_id: user.id, author_name: authorName, message: trimmed })
        .select()
        .single();

      if (error) {
        setNotice("Unable to share right now.");
        return;
      }

      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) return prev;
          return [inserted as Message, ...prev];
        });
      }

      setDraft("");
      setNotice("Shared quietly with this space.");
    } finally {
      setSending(false);
    }
  }

  const charsLeft = MAX_CHARS - draft.length;
  const isOverLimit = charsLeft < 0;

  return (
    <div style={{ display: "grid", gap: 32 }}>

      {/* Message list */}
      <section>
        <p style={{
          color: "var(--stone)", marginBottom: 14,
          fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          Shared in this space
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          {messages.length === 0 ? (
            <div style={{
              padding: "20px 22px",
              borderRadius: 16,
              border: "1px solid var(--faint)",
              background: "var(--bg1)",
            }}>
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}>
                Nothing has been shared yet. You can begin gently.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  border: "1px solid var(--faint)",
                  background: "var(--bg1)",
                }}
              >
                <p style={{ fontWeight: 600, margin: "0 0 6px", color: "var(--cream)", fontSize: 14 }}>
                  {msg.author_name}
                </p>
                <p style={{ margin: "0 0 10px", lineHeight: 1.8, color: "var(--cream)", fontSize: 15 }}>
                  {msg.message}
                </p>
                <p style={{ color: "var(--stone)", margin: 0, fontSize: 11, opacity: 0.55 }}>
                  {new Date(msg.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Compose area */}
      <section style={{
        display: "grid",
        gap: 12,
        padding: "20px 22px",
        borderRadius: 16,
        border: "1px solid var(--faint)",
        background: "var(--bg1)",
      }}>
        <p style={{
          color: "var(--stone)", fontSize: 12,
          letterSpacing: "0.08em", textTransform: "uppercase", margin: 0,
        }}>
          Share quietly
        </p>

        <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>
          Speak with care. Let your words build others up.
        </p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share what is on your heart…"
          rows={4}
          style={{
            borderRadius: 12,
            border: `1px solid ${isOverLimit ? "var(--live)" : "var(--faint2)"}`,
            background: "var(--bg2)",
            color: "var(--cream)",
            padding: "0.85rem 1rem",
            resize: "vertical",
            lineHeight: 1.75,
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
            caretColor: "var(--companion)",
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !draft.trim() || isOverLimit}
            style={{
              minHeight: 40,
              padding: "0 1.2rem",
              borderRadius: 999,
              border: "1px solid var(--faint2)",
              background: "transparent",
              color: "var(--muted)",
              cursor: sending || !draft.trim() || isOverLimit ? "default" : "pointer",
              fontSize: 13,
              opacity: sending || !draft.trim() || isOverLimit ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
            {sending ? "Sharing…" : "Share quietly"}
          </button>

          <span style={{
            fontSize: 11,
            color: isOverLimit ? "var(--live)" : "var(--stone)",
            opacity: isOverLimit ? 1 : 0.5,
            transition: "color 0.15s",
          }}>
            {charsLeft}
          </span>
        </div>

        {notice ? (
          <p style={{ color: "var(--stone)", margin: 0, lineHeight: 1.6, fontSize: 13 }}>
            {notice}
          </p>
        ) : null}
      </section>

    </div>
  );
}
