import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import WorshipSetForm from "@/components/worship/worship-set-form";
import MomentsEditor from "@/components/worship/moments-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Worship Set — Worship" };

export default async function EditWorshipSetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("id", user.id).maybeSingle();
  const role = roleRow?.role ?? "member";
  if (!["minister", "admin"].includes(role)) redirect("/worship");

  // Load the set (curator must own it)
  const { data: set } = await supabase
    .from("worship_sets")
    .select("*")
    .eq("slug", slug)
    .eq("curator_id", user.id)
    .maybeSingle();
  if (!set) notFound();

  const { data: moments } = await supabase
    .from("worship_moments")
    .select("*")
    .eq("set_id", set.id)
    .order("position", { ascending: true });

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 52 }}>

        {/* Set metadata */}
        <section>
          <span className="movement-eyebrow" style={{ color: "var(--worship)" }}>
            Worship — Edit set
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: "2rem" }}>
            {set.title}
          </h1>
          <WorshipSetForm mode="edit" set={set} />
        </section>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--faint)" }} />

        {/* Moments */}
        <section>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Moments</h2>
          <MomentsEditor
            setId={set.id}
            setSlug={set.slug}
            initialMoments={moments ?? []}
          />
        </section>

      </div>
    </main>
  );
}
