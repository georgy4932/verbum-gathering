"use client";

import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/components/supabase-browser";

type PrayerFormProps = {
  roomSlug: string;
};

export default function PrayerForm({ roomSlug }: PrayerFormProps) {
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!authorName.trim() || !message.trim()) {
      setNotice("Please enter your name and prayer message.");
      return;
    }

    setSending(true);

    const { error } = await supabaseBrowser.from("prayer_posts").insert({
      room_slug: roomSlug,
      author_name: authorName.trim(),
      message: message.trim(),
    });

    setSending(false);

    if (error) {
      setNotice("Unable to send prayer right now.");
      return;
    }

    setMessage("");
    setNotice("Prayer shared.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 12,
        padding: 18,
        borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h3 style={{ margin: 0 }}>Share a prayer</h3>

      <input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Your name"
        style={{
          minHeight: 46,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          color: "inherit",
          padding: "0 0.9rem",
        }}
      />

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your prayer request or praise..."
        rows={5}
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          color: "inherit",
          padding: "0.9rem",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        disabled={sending}
        style={{
          minHeight: 44,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {sending ? "Sharing..." : "Share prayer"}
      </button>

      {notice ? <p style={{ opacity: 0.75, margin: 0 }}>{notice}</p> : null}
    </form>
  );
}
