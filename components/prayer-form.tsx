"use client";

import { FormEvent, useState } from "react";

type PrayerFormProps = {
  roomSlug: string;
};

export default function PrayerForm({ roomSlug }: PrayerFormProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!message.trim()) {
      setNotice("Please write a prayer.");
      return;
    }

    setSending(true);

    const response = await fetch("/api/prayer-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomSlug, message }),
    });

    const data = await response.json();
    setSending(false);

    if (!response.ok) {
      setNotice(data.error || "Unable to share right now.");
      return;
    }

    setMessage("");
    setNotice("Shared quietly with others.");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: 12,
        padding: 20,
        borderRadius: 20,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 6px" }}>Share a prayer</h3>
        <p style={{ opacity: 0.68, margin: 0, lineHeight: 1.65 }}>
          Shared quietly with others in this gathering.
        </p>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your prayer or thanksgiving..."
        rows={5}
        style={{
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.02)",
          color: "inherit",
          padding: "0.95rem",
          resize: "vertical",
        }}
      />

      <button
        type="submit"
        disabled={sending}
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

      {notice ? <p style={{ opacity: 0.74, margin: 0 }}>{notice}</p> : null}
    </form>
  );
}
