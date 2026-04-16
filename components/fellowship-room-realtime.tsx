"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

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

export default function FellowshipRoomRealtime({
  roomSlug,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`fellowship-${roomSlug}`)
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
            const exists = prev.some((msg) => msg.id === incoming.id);
            if (exists) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomSlug]);

  async function sendMessage() {
    if (!message.trim() || sending) return;

    const trimmed = message.trim();
    if (trimmed.length > 280) {
      setNotice("Keep it brief and thoughtful.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setNotice("Please sign in before sharing.");
        return;
      }

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const { error } = await supabaseBrowser.from("fellowship_messages").insert({
        room_slug: roomSlug,
        user_id: user.id,
        author_name: profile?.display_name || user.email || "Someone",
        message: trimmed,
      });

      if (error) {
        setNotice("Unable to share right now.");
        return;
      }

      setMessage("");
      setNotice("Shared quietly with this space.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <p
          style={{
            opacity: 0.5,
            marginBottom: 14,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Shared in this space
        </p>

        <div
          style={{
            display: "grid",
            gap: 18,
            scrollBehavior: "smooth",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                padding: 20,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  opacity: 0.68,
                  lineHeight: 1.7,
                }}
              >
                Nothing has been shared yet. You can begin gently.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                style={{
                  padding: "18px 18px 16px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <p
                  style={{
                    fontWeight: 600,
                    margin: "0 0 8px",
                  }}
                >
                  {msg.author_name}
                </p>

                <p
                  style={{
                    margin: "0 0 10px",
                    lineHeight: 1.8,
                    opacity: 0.88,
                  }}
                >
                  {msg.message}
                </p>

                <p
                  style={{
                    opacity: 0.35,
                    margin: 0,
                    fontSize: 12,
                  }}
                >
                  {new Date(msg.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gap: 12,
          padding: 20,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <p
          style={{
            opacity: 0.55,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Share quietly
        </p>

        <p
          style={{
            opacity: 0.72,
            fontSize: "0.95rem",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Speak with care. Let your words build others up.
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share what is on your heart..."
          rows={4}
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.02)",
            color: "inherit",
            padding: "0.9rem",
            resize: "vertical",
            lineHeight: 1.7,
          }}
        />

        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !message.trim()}
          style={{
            minHeight: 44,
            padding: "0 1rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "inherit",
            cursor: "pointer",
            justifySelf: "start",
          }}
        >
          {sending ? "Sharing..." : "Share quietly"}
        </button>

        {notice ? (
          <p
            style={{
              opacity: 0.68,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {notice}
          </p>
        ) : null}
      </section>
    </div>
  );
}
