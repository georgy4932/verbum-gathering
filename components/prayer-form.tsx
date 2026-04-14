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
      setNotice("Please write a prayer message.");
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
      setNotice(data.error || "Unable to send prayer right now.");
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
