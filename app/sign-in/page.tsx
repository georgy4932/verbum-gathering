"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");

  async function signIn() {
    setNotice("");

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    setNotice("Check your email for the sign-in link.");
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1>Sign in</h1>
        <p>Hosts must sign in before starting a broadcast.</p>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
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
            onClick={signIn}
            style={{
              minHeight: 44,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            Send magic link
          </button>

          {notice ? <p>{notice}</p> : null}
        </div>
      </div>
    </main>
  );
}
