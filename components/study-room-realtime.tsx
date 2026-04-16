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
  studySlug: string;
  initialMessages: Message[];
};

export default function StudyRoomRealtime({ studySlug, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`study-messages-${studySlug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "study_messages",
          filter: `study_slug=eq.${studySlug}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === incoming.id);
            if (exists) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [studySlug]);

  async function sendMessage() {
    if (!message.trim() || sending) return;

    const trimmed = message.trim();
    if (trimmed.length > 500) {
      setNotice("Please keep your message concise.");
      return;
    }

    setSending(true);
    setNotice("");

    try {
      const { data: { user } } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setNotice("Please sign in to participate in this study.");
        return;
      }

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const { data: inserted, error } = await supabaseBrowser
        .from("study_messages")
        .insert({
          study_slug: studySlug,
          user_id: user.id,
          author_name: profile?.display_name || user.email || "Someone",
          message: trimmed,
        })
        .select()
        .single();

      if (error) {
        setNotice("Unable to share right now.");
        return;
      }

      if (inserted) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === inserted.id);
          if (exists) return prev;
          return [inserted as Message, ...prev];
        });
      }

      setMessage("");
      setNotice("Shared with this study.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <p style={{ opacity: 0.5, marginBottom: 14, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Study discussion
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          {messages.length === 0 ? (
            <div style={{ padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
              <p style={{ margin: 0, opacity: 0.68, lineHeight: 1.7 }}>
                No reflections yet. Be the first to share what God is showing you.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <article
                key={msg.id}
                style={{ padding: "18px 18px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
              >
                <p style={{ fontWeight: 600, margin: "0 0 8px" }}>{msg.author_name}</p>
                <p style={{ margin: "0 0 10px", lineHeight: 1.8, opacity: 0.88 }}>{msg.message}</p>
                <p style={{ opacity: 0.35, margin: 0, fontSize: 12 }}>
                  {new Date(msg.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section style={{ display: "grid", gap: 12, padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
        <p style={{ opacity: 0.55, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Share a reflection
        </p>
        <p style={{ opacity: 0.68, fontSize: "0.92rem", lineHeight: 1.7, margin: 0 }}>
          What is God showing you through this study?
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share your reflection..."
          rows={4}
          style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0.9rem", resize: "vertical", lineHeight: 1.7 }}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !message.trim()}
          style={{ minHeight: 44, padding: "0 1rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "inherit", cursor: "pointer", justifySelf: "start" }}
        >
          {sending ? "Sharing..." : "Share reflection"}
        </button>
        {notice ? <p style={{ opacity: 0.68, margin: 0, lineHeight: 1.6 }}>{notice}</p> : null}
      </section>
    </div>
  );
}
