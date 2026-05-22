"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorshipSet, updateWorshipSet } from "@/app/actions/worship";
import type { WorshipSet, WorshipSetKind } from "@/lib/types/domain";

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
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const KINDS: WorshipSetKind[] = ["curated", "liturgical", "seasonal"];

interface Props {
  mode: "create" | "edit";
  set?: WorshipSet;
}

export default function WorshipSetForm({ mode, set }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle]           = useState(set?.title ?? "");
  const [slug, setSlug]             = useState(set?.slug ?? "");
  const [kind, setKind]             = useState<WorshipSetKind>(set?.kind ?? "curated");
  const [passageRef, setPassageRef] = useState(set?.passage_ref ?? "");
  const [refsRaw, setRefsRaw]       = useState((set?.scripture_refs ?? []).join(", "));
  const [description, setDescription] = useState(set?.description ?? "");
  const [published, setPublished]   = useState(set?.is_published ?? false);
  const [notice, setNotice]         = useState("");
  const [isError, setIsError]       = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (mode === "create") setSlug(toSlug(v));
  }

  function submit() {
    setNotice("");
    const scriptureRefs = refsRaw.split(",").map((s) => s.trim()).filter(Boolean);

    startTransition(async () => {
      if (mode === "create") {
        const result = await createWorshipSet({ title, slug, kind, passageRef, scriptureRefs, description, isPublished: published });
        if (!result.success) { setIsError(true); setNotice(result.error); return; }
        router.push(`/worship/${result.data!.slug}/edit`);
      } else {
        const result = await updateWorshipSet({ id: set!.id, title, slug, kind, passageRef, scriptureRefs, description, isPublished: published });
        if (!result.success) { setIsError(true); setNotice(result.error); return; }
        setIsError(false);
        setNotice("Saved.");
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <label style={LABEL}>Title</label>
        <input style={INPUT} value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Evening Psalm" />
      </div>

      <div>
        <label style={LABEL}>Slug</label>
        <input style={{ ...INPUT, fontFamily: "monospace", fontSize: 13 }} value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={LABEL}>Kind</label>
          <select
            style={{ ...INPUT, cursor: "pointer" }}
            value={kind}
            onChange={(e) => setKind(e.target.value as WorshipSetKind)}
          >
            {KINDS.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>Anchor passage</label>
          <input style={INPUT} value={passageRef} onChange={(e) => setPassageRef(e.target.value)} placeholder="Psalm 46" />
        </div>
      </div>

      <div>
        <label style={LABEL}>Additional Scripture references (comma-separated)</label>
        <input style={INPUT} value={refsRaw} onChange={(e) => setRefsRaw(e.target.value)} placeholder="Isaiah 40:31, Romans 8:38" />
      </div>

      <div>
        <label style={LABEL}>Description (optional)</label>
        <textarea
          style={{ ...INPUT, minHeight: 100, padding: "0.75rem 0.9rem", resize: "vertical", lineHeight: 1.75 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A contemplative set for evening prayer…"
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
        <p style={{ fontSize: 14, color: isError ? "#e07070" : "var(--green-hi)", margin: 0 }}>{notice}</p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button className="button primary" onClick={submit} disabled={pending} style={{ minWidth: 160 }}>
          {pending ? "Saving…" : mode === "create" ? "Create & add moments →" : "Save changes"}
        </button>
        <button className="button secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </button>
      </div>
    </div>
  );
}
