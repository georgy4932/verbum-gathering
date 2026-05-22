"use client";

import { useState, useTransition } from "react";
import { addWorshipMoment, deleteWorshipMoment } from "@/app/actions/worship";
import type { WorshipMoment, WorshipMomentKind } from "@/lib/types/domain";

const INPUT: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "inherit",
  padding: "0 0.85rem",
  fontSize: 13,
  fontFamily: "inherit",
};

const LABEL: React.CSSProperties = {
  opacity: 0.55,
  marginBottom: 5,
  fontSize: "0.78rem",
  display: "block",
};

const KINDS: WorshipMomentKind[] = ["song", "reading", "prayer", "silence", "reflection"];

const KIND_LABEL: Record<WorshipMomentKind, string> = {
  song: "Song",
  reading: "Scripture reading",
  prayer: "Prayer",
  silence: "Silence",
  reflection: "Reflection",
};

// Which fields are relevant for each kind
const SHOWS_BODY: WorshipMomentKind[]     = ["song", "reading", "prayer", "reflection"];
const SHOWS_PASSAGE: WorshipMomentKind[]  = ["reading", "reflection"];
const SHOWS_MEDIA: WorshipMomentKind[]    = ["song"];
const SHOWS_DURATION: WorshipMomentKind[] = ["song", "silence"];

interface MomentCardProps {
  moment: WorshipMoment;
  setSlug: string;
  index: number;
}

function MomentCard({ moment, setSlug, index }: MomentCardProps) {
  const [pending, startTransition] = useTransition();

  const kindColors: Record<WorshipMomentKind, string> = {
    song:       "var(--worship)",
    reading:    "var(--companion)",
    prayer:     "var(--gold)",
    silence:    "var(--stone)",
    reflection: "var(--gathering)",
  };

  return (
    <div style={{
      padding: "18px 22px",
      borderRadius: 12,
      border: "1px solid var(--faint)",
      background: "var(--bg1)",
      display: "flex",
      gap: 16,
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 12, color: "var(--stone)", paddingTop: 2, minWidth: 20, textAlign: "right" }}>
        {index + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: kindColors[moment.kind] }}>
            {KIND_LABEL[moment.kind]}
          </span>
          {moment.passage_ref && (
            <span style={{ fontSize: 12, color: "var(--gold-lo)", fontFamily: "'IM Fell English', serif" }}>
              {moment.passage_ref}
            </span>
          )}
        </div>
        {moment.title && (
          <p style={{ fontSize: "0.95rem", color: "var(--cream)", margin: "0 0 4px", fontFamily: "'IM Fell English', serif" }}>
            {moment.title}
          </p>
        )}
        {moment.body && (
          <p style={{ fontSize: "0.83rem", color: "var(--stone)", margin: 0, lineHeight: 1.6,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {moment.body}
          </p>
        )}
        {moment.duration_seconds && (
          <p style={{ fontSize: "0.78rem", color: "var(--stone)", margin: "4px 0 0" }}>
            {Math.floor(moment.duration_seconds / 60)}:{String(moment.duration_seconds % 60).padStart(2, "0")}
          </p>
        )}
      </div>
      <button
        onClick={() => startTransition(async () => { await deleteWorshipMoment(moment.id, setSlug); })}
        disabled={pending}
        style={{ fontSize: 12, color: "var(--stone)", background: "none", border: "none", cursor: pending ? "default" : "pointer", opacity: pending ? 0.4 : 0.7, paddingTop: 2 }}
      >
        {pending ? "…" : "remove"}
      </button>
    </div>
  );
}

interface AddMomentFormProps {
  setId: string;
  setSlug: string;
  nextPosition: number;
}

function AddMomentForm({ setId, setSlug, nextPosition }: AddMomentFormProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [kind, setKind]             = useState<WorshipMomentKind>("song");
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [passageRef, setPassageRef] = useState("");
  const [mediaUrl, setMediaUrl]     = useState("");
  const [duration, setDuration]     = useState("");
  const [notice, setNotice]         = useState("");

  function reset() { setTitle(""); setBody(""); setPassageRef(""); setMediaUrl(""); setDuration(""); setNotice(""); }

  function handleKindChange(k: WorshipMomentKind) {
    setKind(k);
    setNotice("");
  }

  function submit() {
    setNotice("");
    const durSec = duration ? parseInt(duration, 10) * 60 : null;

    startTransition(async () => {
      const result = await addWorshipMoment({
        setId, setSlug, kind, title, body, passageRef, mediaUrl,
        durationSeconds: durSec && !isNaN(durSec) ? durSec : null,
        position: nextPosition,
      });
      if (!result.success) { setNotice(result.error); return; }
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: 13, color: "var(--worship)",
          background: "none", border: "1px solid var(--worship-lo)",
          borderRadius: 8, padding: "10px 20px",
          cursor: "pointer", letterSpacing: "0.04em", alignSelf: "flex-start",
        }}
      >
        + Add moment
      </button>
    );
  }

  return (
    <div style={{
      padding: "22px 24px",
      borderRadius: 14,
      border: "1px solid var(--worship-lo)",
      background: "rgba(155,124,200,0.04)",
      display: "grid",
      gap: 14,
    }}>
      <div>
        <label style={LABEL}>Kind</label>
        <select
          style={{ ...INPUT, cursor: "pointer" }}
          value={kind}
          onChange={(e) => handleKindChange(e.target.value as WorshipMomentKind)}
        >
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
      </div>

      {/* Title — always shown */}
      <div>
        <label style={LABEL}>Title (optional for prayer/silence)</label>
        <input style={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "song" ? "Be Still My Soul" : kind === "silence" ? "A time of quiet" : ""} />
      </div>

      {SHOWS_PASSAGE.includes(kind) && (
        <div>
          <label style={LABEL}>Scripture passage</label>
          <input style={INPUT} value={passageRef} onChange={(e) => setPassageRef(e.target.value)} placeholder="Psalm 46:10" />
        </div>
      )}

      {SHOWS_BODY.includes(kind) && (
        <div>
          <label style={LABEL}>{kind === "song" ? "Lyrics / description" : kind === "reading" ? "Text" : kind === "prayer" ? "Prayer text" : "Reflection"}</label>
          <textarea
            style={{ ...INPUT, minHeight: 100, padding: "0.7rem 0.85rem", resize: "vertical", lineHeight: 1.75 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      )}

      {SHOWS_MEDIA.includes(kind) && (
        <div>
          <label style={LABEL}>Media URL (YouTube, SoundCloud, etc.)</label>
          <input style={INPUT} value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://…" />
        </div>
      )}

      {SHOWS_DURATION.includes(kind) && (
        <div>
          <label style={LABEL}>Duration (minutes)</label>
          <input style={{ ...INPUT, maxWidth: 120 }} type="number" min="1" max="60" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3" />
        </div>
      )}

      {notice && <p style={{ fontSize: 13, color: "#e07070", margin: 0 }}>{notice}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="button primary" onClick={submit} disabled={pending} style={{ minWidth: 120 }}>
          {pending ? "Adding…" : "Add moment"}
        </button>
        <button className="button secondary" onClick={() => { setOpen(false); reset(); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

interface Props {
  setId: string;
  setSlug: string;
  initialMoments: WorshipMoment[];
}

export default function MomentsEditor({ setId, setSlug, initialMoments }: Props) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--worship-lo)" }}>
          Moments — {initialMoments.length} {initialMoments.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {initialMoments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {initialMoments.map((m, i) => (
            <MomentCard key={m.id} moment={m} setSlug={setSlug} index={i} />
          ))}
        </div>
      )}

      <AddMomentForm setId={setId} setSlug={setSlug} nextPosition={initialMoments.length} />
    </section>
  );
}
