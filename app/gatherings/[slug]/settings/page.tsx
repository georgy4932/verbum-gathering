import { notFound, redirect } from "next/navigation";
import {
  getGathering,
  getMyMembership,
  updateGathering,
  deleteGathering,
} from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeleteGatheringButton from "@/components/gathering/delete-gathering-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { slug } = await params;
  const { error: formError, saved } = await searchParams;
  const gathering = await getGathering(slug);
  if (!gathering) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const membership = await getMyMembership(gathering.id);
  if (membership?.role !== "host") redirect(`/gatherings/${slug}`);

  async function handleUpdate(formData: FormData) {
    "use server";
    const res = await updateGathering(gathering!.id, slug, formData);
    if (!res.success) {
      redirect(`/gatherings/${slug}/settings?error=${encodeURIComponent(res.error)}`);
    }
    redirect(`/gatherings/${slug}/settings?saved=1`);
  }

  async function handleDelete() {
    "use server";
    const res = await deleteGathering(gathering!.id);
    if (res.success) redirect("/gatherings");
    redirect(`/gatherings/${slug}/settings?error=${encodeURIComponent(res.error ?? "Could not delete gathering.")}`);
  }

  return (
    <div style={{ maxWidth: 560, display: "grid", gap: 36 }}>

      {/* Edit form */}
      <section>
        <h2 style={{ margin: "0 0 24px", fontSize: "1.2rem", color: "var(--cream)" }}>Edit gathering</h2>

        {saved && (
          <p style={{ fontSize: 13, color: "#86efac", marginBottom: 16 }}>Changes saved.</p>
        )}
        {formError && (
          <p style={{ fontSize: 13, color: "#c07060", marginBottom: 16 }}>{formError}</p>
        )}

        <form action={handleUpdate} style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Name *</label>
            <input
              name="name"
              required
              defaultValue={gathering.name}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={gathering.description ?? ""}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Visibility</label>
            <select name="visibility" defaultValue={gathering.visibility} style={inputStyle}>
              <option value="public">Public — anyone can see and join</option>
              <option value="community">Community — signed-in users only</option>
              <option value="private">Private — invitation only</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label style={labelStyle}>Scripture focus (optional)</label>
            <input
              name="passage_ref"
              placeholder="e.g. Romans 8"
              defaultValue={gathering.passage_ref ?? ""}
              style={inputStyle}
            />
          </div>

          <button type="submit" style={submitStyle}>Save changes</button>
        </form>
      </section>

      {/* Danger zone */}
      <section style={{
        padding: "20px 24px", borderRadius: 20,
        border: "1px solid rgba(192,112,96,0.2)",
        background: "rgba(192,112,96,0.03)",
        display: "grid", gap: 12,
      }}>
        <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c07060" }}>
          Danger zone
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
          Closing this gathering will remove it from the list. Members will lose access. This cannot be undone.
        </p>
        <DeleteGatheringButton gatheringName={gathering.name} deleteAction={handleDelete} />
      </section>

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
  fontSize: 14, cursor: "pointer", justifySelf: "start",
};
