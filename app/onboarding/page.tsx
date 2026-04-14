"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function OnboardingPage() {
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  async function saveProfile() {
    setSaving(true);
    setNotice("");

    const {
      data: { user },
      error: userError,
    } = await supabaseBrowser.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setNotice("You need to sign in first.");
      return;
    }

    const { error } = await supabaseBrowser.from("profiles").upsert({
      id: user.id,
      display_name: displayName.trim(),
    });

    setSaving(false);

    if (error) {
      setNotice("Unable to save your profile.");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1>Welcome</h1>
        <p>What should we call you in the gathering?</p>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
            style={{
              minHeight: 46,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.02)",
              color: "inherit",
              padding: "0 0.9rem",
            }}
          />

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || displayName.trim().length < 2}
            style={{
              minHeight: 44,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>

          {notice ? <p>{notice}</p> : null}
        </div>
      </div>
    </main>
  );
}
