"use client";

import { useTransition } from "react";
import { createGathering } from "@/app/actions/gatherings";

export default function CreateGatheringForm() {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => createGathering(formData));
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={labelStyle}>Name *</label>
        <input
          name="name"
          required
          minLength={3}
          maxLength={80}
          placeholder="A name for your gathering"
          style={inputStyle}
          autoFocus
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          placeholder="What is this gathering about?"
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={labelStyle}>Scripture focus (optional)</label>
        <input
          name="passage_ref"
          maxLength={100}
          placeholder="e.g. Romans 8"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={labelStyle}>Visibility</label>
        <select name="visibility" defaultValue="community" style={inputStyle}>
          <option value="public">Public — visible to everyone</option>
          <option value="community">Community — visible to signed-in members</option>
          <option value="private">Private — invite only</option>
        </select>
        <p style={{ margin: 0, fontSize: 13, color: "var(--stone)" }}>
          Community is recommended for most new gatherings.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        style={{
          minHeight: 44,
          borderRadius: 999,
          border: "none",
          background: "var(--companion)",
          color: "var(--bg)",
          fontSize: 14,
          cursor: pending ? "default" : "pointer",
          opacity: pending ? 0.6 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {pending ? "Creating…" : "Create gathering"}
      </button>

    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--stone)",
};

const inputStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--faint2)",
  background: "var(--bg2)",
  color: "var(--cream)",
  padding: "0.75rem 1rem",
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  caretColor: "var(--companion)",
  width: "100%",
  boxSizing: "border-box",
};
