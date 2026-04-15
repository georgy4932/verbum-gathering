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

export default function FellowshipRoomRealtime({ roomSlug, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

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
          setMessages((prev) => [payload.new as Message, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomSlug]);

  async function sendMessage() {
    if (!message.trim() || sending) return;
    setSending(true);

    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) { setSending(false); return; }

    const { data: profile } = await supabaseBrowser
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    await supabaseBrowser.from("fellowship_messages").insert({
      room_slug: roomSlug,
      user_id: user.id,
      author_name: profile?.display_name || user.email || "Someone",
      message: message.trim(),
    });

    setMessage("");
    setSending(false);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <p style={{ opacity: 0.55, marginBottom: 14, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Shared in this space
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          {messages.length === 0 ? (
            <p style={{ opacity: 0.6 }}>Nothing shared yet. Be the first to encourage.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: 16,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <p style={{ fontWeight: 600, margin: "0 0 6px" }}>{msg.author_name}</p>
                <p style={{ margin: "0 0 8px", lineHeight: 1.7, opacity: 0.88 }}>{msg.message}</p>
                <p style={{ opacity: 0.45, margin: 0, fontSize: "0.8rem" }}>
                  {new Date(msg.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 18,
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share something with this space..."
          rows={4}
          style={{
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.02)",
            color: "inherit",
            padding: "0.9rem",
            resize: "vertical",
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
      </div>
    </div>
  );
}
