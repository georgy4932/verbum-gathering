"use client";

import { useState, useTransition } from "react";
import { publishCompanionNoteToGathering, type ShareableGathering } from "@/app/actions/gatherings";
import type { CompanionNote } from "@/lib/types/domain";
import { GATHERING_AUDIENCE_COPY } from "@/lib/gathering/audience-copy";

interface ShareToGatheringProps {
  note: CompanionNote;
  gatherings: ShareableGathering[];
  scriptureContext?: {
    translationVersion?: string;
    scriptureTextSnapshot?: string;
  };
}

type Step = "closed" | "picking" | "confirming" | "success" | "error";

const ITEM_LABEL: Record<CompanionNote["kind"], string> = {
  note: "note",
  prayer: "prayer point",
};

export function ShareToGathering({ note, gatherings, scriptureContext }: ShareToGatheringProps) {
  const [step, setStep] = useState<Step>("closed");
  const [selectedId, setSelectedId] = useState("");
  const [titleOverride, setTitleOverride] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sharedGatheringName, setSharedGatheringName] = useState("");
  const [isPending, startTransition] = useTransition();

  if (gatherings.length === 0) return null;

  const selected = gatherings.find((g) => g.id === selectedId) ?? null;
  const itemLabel = ITEM_LABEL[note.kind];

  function reset() {
    setStep("closed");
    setSelectedId("");
    setTitleOverride("");
    setErrorMsg("");
  }

  function handleConfirm() {
    if (!selected) return;
    startTransition(async () => {
      const result = await publishCompanionNoteToGathering(note.id, selected.id, {
        titleOverride: note.kind === "note" ? (titleOverride.trim() || undefined) : undefined,
        scriptureContext,
      });
      if (result.success) {
        setSharedGatheringName(result.data?.gatheringName ?? selected.name);
        setStep("success");
      } else {
        setErrorMsg(result.error);
        setStep("error");
      }
    });
  }

  if (step === "closed") {
    return (
      <button onClick={() => setStep("picking")} style={linkButtonStyle}>
        share to gathering
      </button>
    );
  }

  if (step === "picking") {
    return (
      <div style={panelStyle}>
        <label style={labelStyle}>
          Share this {itemLabel} to:
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={selectStyle}
          >
            <option value="">Choose a Gathering…</option>
            {gatherings.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {GATHERING_AUDIENCE_COPY[g.visibility].pickerLabel}
              </option>
            ))}
          </select>
        </label>

        {note.kind === "note" && (
          <label style={labelStyle}>
            Title (optional)
            <input
              type="text"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder={`Reflection on ${note.passage_ref}`}
              maxLength={200}
              style={selectStyle}
            />
          </label>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep("confirming")} disabled={!selected} style={saveButtonStyle}>
            Continue
          </button>
          <button onClick={reset} style={cancelButtonStyle}>Cancel</button>
        </div>
      </div>
    );
  }

  if (step === "confirming" && selected) {
    return (
      <div style={panelStyle}>
        <p style={copyStyle}>This will share a separate copy in {selected.name}.</p>
        <p style={copyStyle}>{GATHERING_AUDIENCE_COPY[selected.visibility].confirmCopy}</p>
        <p style={copyStyle}>
          Your private {itemLabel} will remain private. Later edits here will not change the shared copy.
        </p>
        <p style={copyStyle}>Sharing again will create another separate copy.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleConfirm} disabled={isPending} style={saveButtonStyle}>
            {isPending ? "Sharing…" : `Share to ${selected.name}`}
          </button>
          <button onClick={reset} disabled={isPending} style={cancelButtonStyle}>Cancel</button>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={panelStyle}>
        <p style={copyStyle}>Shared as a new copy in {sharedGatheringName}.</p>
        <button onClick={reset} style={cancelButtonStyle}>Done</button>
      </div>
    );
  }

  // step === "error"
  return (
    <div style={panelStyle}>
      <p style={{ ...copyStyle, color: "var(--companion)" }}>{errorMsg}</p>
      <button onClick={reset} style={cancelButtonStyle}>Close</button>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--stone)",
  background: "none",
  border: "none",
  cursor: "pointer",
  alignSelf: "flex-start",
};

const panelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid var(--faint)",
  background: "var(--bg2)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  color: "var(--stone)",
};

const selectStyle: React.CSSProperties = {
  background: "var(--bg1)",
  border: "1px solid var(--faint)",
  borderRadius: 8,
  color: "var(--cream)",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.9rem",
  padding: "10px 12px",
  outline: "none",
};

const copyStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  lineHeight: 1.6,
  color: "var(--muted)",
  margin: 0,
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

const cancelButtonStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--stone)",
  background: "transparent",
  border: "1px solid var(--faint)",
  borderRadius: 8,
  padding: "10px 20px",
  cursor: "pointer",
  letterSpacing: "0.04em",
};
