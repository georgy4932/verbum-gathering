"use client";

import { useState } from "react";

type HostSessionPanelProps = {
  roomSlug: string;
};

export default function HostSessionPanel({ roomSlug }: HostSessionPanelProps) {
  const [summary, setSummary] = useState("");
  const [keyScripture, setKeyScripture] = useState("");
  const [closingPrayer, setClosingPrayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveNotes() {
    setSaving(true);
    setNotice("");

    const response = await fetch("/api/session-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomSlug,
        summary,
        keyScripture,
        closingPrayer,
        sessionStartedAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setNotice(data.error || "Unable to save session note.");
      return;
    }

    setSummary("");
    setKeyScripture("");
    setClosingPrayer("");
    setNotice("Session note saved.");
  }

  return (
    <div
      style={{
        marginTop: 28,
        padding: 22,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <p style={{ opacity: 0.58, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.82rem" }}>
        Host notes
      </p>

      <h3 style={{ marginTop: 0, marginBottom: 10 }}>Hold what happened here</h3>

      <p style={{ opacity: 0.72, lineHeight: 1.7, marginTop: 0 }}>
        Save a short summary, the key Scripture, and a closing prayer for this gathering.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary of this gathering..."
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

        <input
          value={keyScripture}
          onChange={(e) => setKeyScripture(e.target.value)}
          placeholder="Key Scripture"
          style={{
            minHeight: 46,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.02)",
            color: "inherit",
            padding: "0 0.95rem",
          }}
        />

        <textarea
          value={closingPrayer}
          onChange={(e) => setClosingPrayer(e.target.value)}
          placeholder="Closing prayer"
          rows={4}
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
          type="button"
          onClick={saveNotes}
          disabled={saving || summary.trim().length < 10}
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
          {saving ? "Saving..." : "Save session note"}
        </button>

        {notice ? <p style={{ opacity: 0.75, margin: 0 }}>{notice}</p> : null}
      </div>
    </div>
  );
}
