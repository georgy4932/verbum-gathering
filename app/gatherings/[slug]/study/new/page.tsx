import { notFound, redirect } from "next/navigation";
import { getGathering, getMyMembership, createStudyPost } from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewStudyPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gathering = await getGathering(slug);
  if (!gathering) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const membership = await getMyMembership(gathering.id);
  if (!membership || (membership.role !== "host" && membership.role !== "moderator")) {
    redirect(`/gatherings/${slug}/study`);
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const res = await createStudyPost(gathering!.id, slug, formData);
    if (res.success) redirect(`/gatherings/${slug}/study`);
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 28px", fontSize: "1.2rem", color: "var(--cream)" }}>New study post</h2>

      <form action={handleCreate} style={{ display: "grid", gap: 20 }}>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={labelStyle}>Title *</label>
          <input name="title" required placeholder="e.g. Walking in the Spirit" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={labelStyle}>Scripture reference (optional)</label>
          <input name="passage_ref" placeholder="e.g. Galatians 5:16–25" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <label style={labelStyle}>Content *</label>
          <textarea
            name="body"
            required
            rows={10}
            placeholder="Share teaching, notes, or reflection…"
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.75 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" style={submitStyle}>Publish post</button>
          <a href={`/gatherings/${slug}/study`} style={cancelStyle}>Cancel</a>
        </div>

      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--stone)",
};
const inputStyle: React.CSSProperties = {
  borderRadius: 12, border: "1px solid var(--faint2)", background: "var(--bg2)",
  color: "var(--cream)", padding: "0.75rem 1rem", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  caretColor: "var(--companion)", width: "100%", boxSizing: "border-box",
};
const submitStyle: React.CSSProperties = {
  minHeight: 42, padding: "0 1.4rem", borderRadius: 999,
  border: "none", background: "var(--companion)", color: "var(--bg)",
  fontSize: 14, cursor: "pointer",
};
const cancelStyle: React.CSSProperties = {
  minHeight: 42, padding: "0 1.2rem", borderRadius: 999,
  border: "1px solid var(--faint2)", color: "var(--muted)",
  fontSize: 14, display: "inline-flex", alignItems: "center", textDecoration: "none",
};
