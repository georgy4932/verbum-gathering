"use client";

import { useState } from "react";
import { reportContent, type ReportContentType } from "@/app/actions/reports";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "harassment",       label: "Harassment" },
  { value: "abuse_or_hate",    label: "Abuse or hate" },
  { value: "sexual_misconduct",label: "Sexual misconduct" },
  { value: "exploitation",     label: "Exploitation" },
  { value: "scam",             label: "Scam or deception" },
  { value: "spam",             label: "Spam" },
  { value: "occult_or_harmful",label: "Harmful content" },
  { value: "divisive_teaching",label: "Divisive teaching" },
  { value: "other",            label: "Other" },
];

type State = "idle" | "open" | "submitting" | "done" | "already_reported";

export default function ReportButton({
  contentType,
  contentId,
}: {
  contentType: ReportContentType;
  contentId: string;
}) {
  const [state, setState] = useState<State>("idle");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setState("submitting");

    const result = await reportContent(contentType, contentId, category, note.trim() || null);

    if (result.success) {
      setState("done");
    } else if (result.error === "already_reported") {
      setState("already_reported");
    } else {
      setState("open");
    }
  }

  if (state === "done") {
    return (
      <p style={confirmStyle}>Report submitted. Thank you.</p>
    );
  }

  if (state === "already_reported") {
    return (
      <p style={confirmStyle}>You have already reported this content.</p>
    );
  }

  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={() => setState("open")}
        aria-label="Report this content"
        style={triggerStyle}
      >
        Report
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <p style={formHeading}>Report this content</p>

      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 2 }}>
        <legend style={legendStyle}>Category</legend>
        {CATEGORIES.map(({ value, label }) => (
          <label key={value} style={radioLabelStyle}>
            <input
              type="radio"
              name="category"
              value={value}
              checked={category === value}
              onChange={() => setCategory(value)}
              disabled={state === "submitting"}
              style={{ accentColor: "var(--companion)", flexShrink: 0 }}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div style={{ display: "grid", gap: 6 }}>
        <label style={legendStyle} htmlFor={`report-note-${contentId}`}>
          Additional context (optional)
        </label>
        <textarea
          id={`report-note-${contentId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={state === "submitting"}
          rows={2}
          placeholder="Describe what you observed…"
          style={textareaStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <button
          type="submit"
          disabled={!category || state === "submitting"}
          style={{
            ...submitStyle,
            opacity: !category || state === "submitting" ? 0.5 : 1,
            cursor: !category || state === "submitting" ? "default" : "pointer",
          }}
        >
          {state === "submitting" ? "Submitting…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => { setState("idle"); setCategory(""); setNote(""); }}
          disabled={state === "submitting"}
          style={cancelStyle}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

const triggerStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--stone)",
  fontSize: 11,
  opacity: 0.4,
  cursor: "pointer",
  padding: "4px 0",
  textAlign: "left",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
  marginTop: 8,
  padding: "16px 0 4px",
  borderTop: "1px solid var(--faint)",
};

const formHeading: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--stone)",
  opacity: 0.6,
};

const legendStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--stone)",
  opacity: 0.6,
  marginBottom: 6,
  display: "block",
};

const radioLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  color: "var(--muted)",
  minHeight: 44,
  cursor: "pointer",
  padding: "0 4px",
};

const textareaStyle: React.CSSProperties = {
  borderRadius: 10,
  border: "1px solid var(--faint2)",
  background: "var(--bg2)",
  color: "var(--cream)",
  padding: "0.6rem 0.8rem",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  lineHeight: 1.6,
};

const submitStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  border: "1px solid var(--faint2)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 13,
  padding: "0 1rem",
  width: "100%",
  textAlign: "center",
};

const cancelStyle: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  border: "none",
  background: "none",
  color: "var(--stone)",
  fontSize: 12,
  opacity: 0.4,
  cursor: "pointer",
  width: "100%",
  textAlign: "center",
};

const confirmStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--stone)",
  opacity: 0.5,
  paddingTop: 4,
};
