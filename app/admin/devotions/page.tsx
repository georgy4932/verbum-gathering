"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminDevotionsPage() {
  const [title, setTitle] = useState("");
  const [scripture, setScripture] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveDevotion() {
    if (!title.trim() || !scripture.trim()) {
      setNotice("Title and scripture are required.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { error } = await supabaseBrowser.from("devotions").insert({
      title: title.trim(),
      scripture: scripture.trim(),
      reflection: reflection.trim() || null,
      prayer: prayer.trim() || null,
      published_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setNotice("Unable to save devotion.");
      return;
    }

    setTitle("");
    setScripture("");
    setReflection("");
    setPrayer("");
    setNotice("Devotion saved. It is now live on the Today page.");
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Admin
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0 32px", lineHeight: 1.05 }}>
          Add a devotion
        </h1>

        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Title</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Walk in the light you have"
              style={{
                width: "100%",
                minHeight: 46,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0 0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Scripture</p>
            <textarea
              value={scripture}
              onChange={(e) => setScripture(e.target.value)}
              placeholder={`"Your word is a lamp to my feet." — Psalm 119:105`}
              rows={3}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Reflection</p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write the reflection..."
              rows={6}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Prayer</p>
            <textarea
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              placeholder="Write the closing prayer..."
              rows={4}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="button"
            onClick={saveDevotion}
            disabled={saving}
            style={{
              minHeight: 46,
              padding: "0 1.2rem",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "inherit",
              cursor: "pointer",
              justifySelf: "start",
            }}
          >
            {saving ? "Saving..." : "Save devotion"}
          </button>

          {notice ? (
            <p style={{ opacity: 0.75, margin: 0, lineHeight: 1.6 }}>{notice}</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
