"use client";

import { useState, useTransition } from "react";
import { addCompanionNote, updateCompanionNote, deleteCompanionNote } from "@/app/actions/companion";
import type { CompanionNote, CompanionNoteKind } from "@/lib/types/domain";

// ── Note list entry ────────────────────────────────────────────────────────

function NoteEntry({ note }: { note: CompanionNote }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [isPending, startTransition] = useTransition();

  const dateStr = new Date(note.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function handleSave() {
    if (!body.trim()) return;
    startTransition(async () => {
      await updateCompanionNote(note.id, body);
      setEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCompanionNote(note.id);
    });
  }

  return (
    <div style={{
      padding: "20px 24px",
      borderRadius: 14,
      border: "1px solid var(--faint)",
      background: "var(--bg1)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {note.kind === "prayer" && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: "var(--companion)",
            }}>
              🙏 Prayer Point
            </span>
          )}
          <span style={{ fontSize: 11, color: "var(--stone)", letterSpacing: "0.06em" }}>
            {dateStr}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setEditing((e) => !e)}
            style={{ fontSize: 12, color: "var(--stone)", background: "none", border: "none", cursor: "pointer" }}
          >
            {editing ? "cancel" : "edit"}
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{ fontSize: 12, color: "var(--stone)", background: "none", border: "none", cursor: "pointer", opacity: isPending ? 0.5 : 1 }}
          >
            remove
          </button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={textareaStyle}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isPending || !body.trim()}
            style={saveButtonStyle}
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "var(--muted)", margin: 0 }}>
          {note.body}
        </p>
      )}
    </div>
  );
}

// ── New note / prayer point form ─────────────────────────────────────────────

const ADD_FORM_COPY: Record<CompanionNoteKind, {
  buttonLabel: string;
  placeholder: string;
  saveLabel: string;
  savingLabel: string;
}> = {
  note: {
    buttonLabel: "+ Add a reflection",
    placeholder: "Write a reflection on this passage…",
    saveLabel: "Save reflection",
    savingLabel: "Saving…",
  },
  prayer: {
    buttonLabel: "🙏 Raise a Prayer Point",
    placeholder: "Write a prayer point for this passage…",
    saveLabel: "Save prayer point",
    savingLabel: "Saving…",
  },
};

function AddNoteForm({ passageRef, kind }: { passageRef: string; kind: CompanionNoteKind }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const copy = ADD_FORM_COPY[kind];

  function handleSubmit() {
    if (!body.trim()) return;
    startTransition(async () => {
      await addCompanionNote(passageRef, body, kind);
      setBody("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: 13,
          color: "var(--companion)",
          background: "none",
          border: "1px solid var(--companion-lo)",
          borderRadius: 8,
          padding: "10px 20px",
          cursor: "pointer",
          letterSpacing: "0.04em",
          alignSelf: "flex-start",
        }}
      >
        {copy.buttonLabel}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={copy.placeholder}
        rows={5}
        style={textareaStyle}
        autoFocus
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={isPending || !body.trim()}
          style={saveButtonStyle}
        >
          {isPending ? copy.savingLabel : copy.saveLabel}
        </button>
        <button
          onClick={() => { setOpen(false); setBody(""); }}
          style={{ ...saveButtonStyle, background: "transparent", color: "var(--stone)", border: "1px solid var(--faint)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Exported component ─────────────────────────────────────────────────────

interface NoteEditorProps {
  passageRef: string;
  existingNotes: CompanionNote[];
}

export default function NoteEditor({ passageRef, existingNotes }: NoteEditorProps) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 32 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--companion-lo)", display: "block", marginBottom: 16 }}>
          My reflections
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {existingNotes.map((note) => (
            <NoteEntry key={note.id} note={note} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AddNoteForm passageRef={passageRef} kind="note" />
          <AddNoteForm passageRef={passageRef} kind="prayer" />
        </div>
      </div>
    </section>
  );
}

const textareaStyle: React.CSSProperties = {
  background: "var(--bg2)",
  border: "1px solid var(--faint)",
  borderRadius: 10,
  color: "var(--cream)",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.95rem",
  lineHeight: 1.7,
  padding: "14px 16px",
  resize: "vertical",
  width: "100%",
  outline: "none",
};

const saveButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--bg)",
  background: "var(--companion)",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  cursor: "pointer",
  letterSpacing: "0.04em",
};
