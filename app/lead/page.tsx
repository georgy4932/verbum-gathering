"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LeadPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ministry, setMinistry] = useState("");
  const [requestType, setRequestType] = useState("bible_study");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitRequest() {
    if (!fullName.trim() || !email.trim()) {
      setNotice("Please provide your name and email.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { error } = await supabaseBrowser.from("leader_requests").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      ministry: ministry.trim() || null,
      request_type: requestType,
      message: message.trim() || null,
    });

    setSaving(false);

    if (error) {
      setNotice("Unable to submit request. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main style={{ padding: "4rem 1.25rem" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, marginBottom: 16 }}>
            Request received
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: 20, lineHeight: 1.05 }}>
            Thank you.
          </h1>
          <p style={{ opacity: 0.78, lineHeight: 1.8, marginBottom: 12 }}>
            Your request has been received. We will review it and be in touch.
          </p>
          <p style={{ opacity: 0.55, lineHeight: 1.7 }}>
            In the meantime, you are welcome to explore the gathering spaces and today's devotion.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Leadership
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0", lineHeight: 1.05 }}>
          Lead a gathering.
        </h1>

        <p style={{ opacity: 0.78, lineHeight: 1.8, marginBottom: 36, maxWidth: 560 }}>
          If you are a pastor, Bible study leader, or ministry leader who wants to bring your group into Verbum Gathering, we would love to hear from you.
        </p>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Your name</p>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="George Odeh"
              style={{ width: "100%", minHeight: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0 0.9rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Email address</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              style={{ width: "100%", minHeight: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0 0.9rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Ministry or church (optional)</p>
            <input
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              placeholder="Your church or ministry name"
              style={{ width: "100%", minHeight: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0 0.9rem", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>What kind of space do you want to lead?</p>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              style={{ width: "100%", minHeight: 46, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0 0.9rem", boxSizing: "border-box" }}
            >
              <option value="bible_study">Bible study</option>
              <option value="prayer_group">Prayer group</option>
              <option value="worship">Worship space</option>
              <option value="fellowship">Fellowship space</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Tell us a little more (optional)</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What is your vision for this gathering space?"
              rows={4}
              style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)", color: "inherit", padding: "0.9rem", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="button"
            onClick={submitRequest}
            disabled={saving}
            style={{ minHeight: 46, padding: "0 1.2rem", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "inherit", cursor: "pointer", justifySelf: "start" }}
          >
            {saving ? "Submitting..." : "Submit request"}
          </button>

          {notice ? <p style={{ opacity: 0.75, margin: 0, lineHeight: 1.6 }}>{notice}</p> : null}
        </div>
      </div>
    </main>
  );
}
