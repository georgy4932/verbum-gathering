"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function signIn() {
    if (!email.trim()) {
      setNotice("Please enter your email address.");
      return;
    }

    setSending(true);
    setNotice("");

    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setSending(false);

    if (error) {
      setNotice(error.message);
      return;
    }

    setSent(true);
  }

  async function resend() {
    setSent(false);
    setNotice("");
    await signIn();
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, marginBottom: 12 }}>
          Sign in
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", margin: "0 0 12px", lineHeight: 1.05 }}>
          Enter quietly.
        </h1>

        <p style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 28 }}>
          Sign in to share prayers, enter live gatherings, and participate in fellowship spaces.
        </p>

        {sent ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
              <p style={{ margin: "0 0 8px", opacity: 0.9, lineHeight: 1.7 }}>
                A sign-in link has been sent to <strong>{email}</strong>.
              </p>
              <p style={{ margin: 0, opacity: 0.65, lineHeight: 1.7 }}>
                Check your inbox and click the link to continue. The link expires after 1 hour.
              </p>
            </div>

            <p style={{ opacity: 0.6, margin: 0, fontSize: "0.9rem" }}>
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={resend}
                style={{ background: "none", border: "none", color: "#c8a96a", cursor: "pointer", fontSize: "0.9rem", padding: 0 }}
              >
                Send again
              </button>
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
              placeholder="Email address"
              type="email"
              style={{ minHeight: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0 0.9rem" }}
            />

            <button
              type="button"
              onClick={signIn}
              disabled={sending}
              style={{ minHeight: 44, borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "inherit", cursor: "pointer" }}
            >
              {sending ? "Sending..." : "Send magic link"}
            </button>

            {notice ? (
              <p style={{ opacity: 0.75, margin: 0, color: "#fca5a5" }}>{notice}</p>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
