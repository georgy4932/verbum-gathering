"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSeries } from "@/app/actions/studio";
import type { TeachingSeries } from "@/lib/types/domain";

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

interface Props {
  existing?: TeachingSeries;
}

export default function SeriesForm({ existing }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle]           = useState(existing?.title ?? "");
  const [slug, setSlug]             = useState(existing?.slug ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [published, setPublished]   = useState(existing?.is_published ?? false);
  const [notice, setNotice]         = useState("");
  const [isError, setIsError]       = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!existing) setSlug(toSlug(v));
  }

  function submit() {
    setNotice("");
    startTransition(async () => {
      const result = await createSeries({ title, slug, description, isPublished: published });

      if (!result.success) {
        setIsError(true);
        setNotice(result.error);
        return;
      }

      setIsError(false);
      router.push(`/studio/series/${result.data?.slug ?? slug}`);
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <label style={LABEL}>Title</label>
        <input
          style={INPUT}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Letters to the Early Church"
        />
      </div>

      <div>
        <label style={LABEL}>Slug</label>
        <input
          style={{ ...INPUT, fontFamily: "monospace", fontSize: 13 }}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="letters-to-the-early-church"
        />
      </div>

      <div>
        <label style={LABEL}>Description (optional)</label>
        <textarea
          style={{ ...INPUT, minHeight: 120, padding: "0.75rem 0.9rem", resize: "vertical", lineHeight: 1.75 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A walk through Paul's letters to the early church…"
        />
      </div>

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
          {pending ? "Saving…" : existing ? "Save changes" : "Create series"}
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
