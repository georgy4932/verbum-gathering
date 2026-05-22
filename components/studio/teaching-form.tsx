"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTeaching, updateTeaching } from "@/app/actions/studio";
import type { Teaching, TeachingSeries, TeachingKind } from "@/lib/types/domain";

const INPUT: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  color: "inherit",
  padding: "0 0.9rem",
  fontSize: 14,
  fontFamily: "inherit",
};

const TEXTAREA: React.CSSProperties = {
  ...INPUT,
  minHeight: 320,
  padding: "0.75rem 0.9rem",
  resize: "vertical",
  lineHeight: 1.75,
};

const SELECT: React.CSSProperties = {
  ...INPUT,
  cursor: "pointer",
};

const LABEL: React.CSSProperties = {
  opacity: 0.6,
  marginBottom: 6,
  fontSize: "0.83rem",
  display: "block",
};

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const KINDS: TeachingKind[] = ["sermon", "devotion", "study", "lecture"];

interface Props {
  mode: "create" | "edit";
  teaching?: Teaching;
  series: TeachingSeries[];
}

export default function TeachingForm({ mode, teaching, series }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle]           = useState(teaching?.title ?? "");
  const [slug, setSlug]             = useState(teaching?.slug ?? "");
  const [kind, setKind]             = useState<TeachingKind>(teaching?.kind ?? "sermon");
  const [passageRef, setPassageRef] = useState(teaching?.passage_ref ?? "");
  const [refsRaw, setRefsRaw]       = useState((teaching?.scripture_refs ?? []).join(", "));
  const [body, setBody]             = useState(teaching?.body ?? "");
  const [seriesId, setSeriesId]     = useState(teaching?.series_id ?? "");
  const [published, setPublished]   = useState(teaching?.is_published ?? false);
  const [notice, setNotice]         = useState("");
  const [isError, setIsError]       = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (mode === "create") setSlug(toSlug(v));
  }

  function submit() {
    setNotice("");
    const scriptureRefs = refsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createTeaching({ title, slug, kind, passageRef, scriptureRefs, body, seriesId: seriesId || null, isPublished: published })
          : await updateTeaching({
              id: teaching!.id,
              title, slug, kind, passageRef, scriptureRefs, body,
              seriesId: seriesId || null,
              isPublished: published,
              existingPublishedAt: teaching?.published_at ?? null,
            });

      if (!result.success) {
        setIsError(true);
        setNotice(result.error);
        return;
      }

      setIsError(false);
      const target = `/studio/${result.data?.slug ?? slug}`;
      router.push(target);
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Title */}
      <div>
        <label style={LABEL}>Title</label>
        <input
          style={INPUT}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="The Peace That Passes Understanding"
        />
      </div>

      {/* Slug */}
      <div>
        <label style={LABEL}>Slug</label>
        <input
          style={{ ...INPUT, fontFamily: "monospace", fontSize: 13 }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="the-peace-that-passes-understanding"
        />
      </div>

      {/* Kind + Series row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={LABEL}>Kind</label>
          <select style={SELECT} value={kind} onChange={(e) => setKind(e.target.value as TeachingKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL}>Series (optional)</label>
          <select style={SELECT} value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
            <option value="">— None —</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Passage ref */}
      <div>
        <label style={LABEL}>Primary passage</label>
        <input
          style={INPUT}
          value={passageRef}
          onChange={(e) => setPassageRef(e.target.value)}
          placeholder="Philippians 4:6–7"
        />
      </div>

      {/* Scripture refs */}
      <div>
        <label style={LABEL}>Additional references (comma-separated)</label>
        <input
          style={INPUT}
          value={refsRaw}
          onChange={(e) => setRefsRaw(e.target.value)}
          placeholder="Romans 5:1, Isaiah 26:3"
        />
      </div>

      {/* Body */}
      <div>
        <label style={LABEL}>Body</label>
        <textarea
          style={TEXTAREA}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the teaching here…"
        />
      </div>

      {/* Publish toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          style={{ accentColor: "var(--gold)", width: 16, height: 16 }}
        />
        <span style={{ color: published ? "var(--gold)" : "var(--stone)" }}>
          {published ? "Published" : "Save as draft"}
        </span>
      </label>

      {notice && (
        <p style={{ fontSize: 14, color: isError ? "#e07070" : "var(--green-hi)", margin: 0 }}>
          {notice}
        </p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          className="button primary"
          onClick={submit}
          disabled={pending}
          style={{ minWidth: 140 }}
        >
          {pending ? "Saving…" : mode === "create" ? "Create teaching" : "Save changes"}
        </button>
        <button
          className="button secondary"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
