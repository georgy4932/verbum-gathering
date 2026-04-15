"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type HostGuidancePanelProps = {
  roomSlug: string;
  initialGuidance?: {
    focus_text?: string | null;
    pinned_scripture?: string | null;
    pinned_prayer?: string | null;
    closing_text?: string | null;
    is_closing?: boolean;
  } | null;
};

export default function HostGuidancePanel({
  roomSlug,
  initialGuidance,
}: HostGuidancePanelProps) {
  const [focusText, setFocusText] = useState(initialGuidance?.focus_text ?? "");
  const [pinnedScripture, setPinnedScripture] = useState(initialGuidance?.pinned_scripture ?? "");
  const [pinnedPrayer, setPinnedPrayer] = useState(initialGuidance?.pinned_prayer ?? "");
  const [closingText, setClosingText] = useState(initialGuidance?.closing_text ?? "");
  const [isClosing, setIsClosing] = useState(Boolean(initialGuidance?.is_closing));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveGuidance() {
    setSaving(true);
    setNotice("");

    const payload = {
      roomSlug,
      focusText,
      pinnedScripture,
      pinnedPrayer,
      closingText,
      isClosing,
    };

    const response = await fetch("/api/room-guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setNotice(data.error || "Unable to update guidance.");
      return;
    }

    const channel = supabaseBrowser.channel(`guidance:${roomSlug}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "guidance:update",
      payload: {
        focus_text: focusText || null,
        pinned_scripture: pinnedScripture || null,
        pinned_prayer: pinnedPrayer || null,
        closing_text: closingText || null,
        is_closing: isClosing,
      },
    });
    supabaseBrowser.removeChannel(channel);

    setNotice("Guidance updated.");
  }

  return (
    <details style={{ marginTop: 28 }}>
           <summary style={{ cursor: "pointer", opacity: 0.76 }}>
        Lead this gathering
      </summary>


      <div
        style={{
          marginTop: 14,
          padding: 22,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 12,
        }}
      >
        <textarea
          value={focusText}
          onChange={(e) => setFocusText(e.target.value)}
          placeholder="Current focus"
          rows={3}
          style={fieldStyle}
        />

        <textarea
          value={pinnedScripture}
          onChange={(e) => setPinnedScripture(e.target.value)}
          placeholder="Pinned scripture"
          rows={3}
          style={fieldStyle}
        />

        <textarea
          value={pinnedPrayer}
          onChange={(e) => setPinnedPrayer(e.target.value)}
          placeholder="Pinned prayer"
          rows={3}
          style={fieldStyle}
        />

        <textarea
          value={closingText}
          onChange={(e) => setClosingText(e.target.value)}
          placeholder="Closing blessing"
          rows={3}
          style={fieldStyle}
        />

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={isClosing}
            onChange={(e) => setIsClosing(e.target.checked)}
          />
          Show as closing moment
        </label>

        <button
          type="button"
          onClick={saveGuidance}
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? "Updating..." : "Update guidance"}
        </button>

        {notice ? <p style={{ opacity: 0.75, margin: 0 }}>{notice}</p> : null}
      </div>
    </details>
  );
}

const fieldStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.02)",
  color: "inherit",
  padding: "0.95rem",
  resize: "vertical",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 44,
  padding: "0 1rem",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "inherit",
  cursor: "pointer",
  justifySelf: "start",
};
