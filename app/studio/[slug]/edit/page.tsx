import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTeachingBySlugForEdit, getMinisterSeries } from "@/lib/db/studio";
import TeachingForm from "@/components/studio/teaching-form";

export const metadata = { title: "Edit Teaching — Studio" };

export default async function EditTeachingPage({
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
  if (!["minister", "admin"].includes(role)) redirect("/studio");

  const [teaching, series] = await Promise.all([
    getTeachingBySlugForEdit(slug, user.id),
    getMinisterSeries(user.id),
  ]);
  if (!teaching) notFound();

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="movement-eyebrow" style={{ color: "var(--studio)" }}>
          Studio — Edit teaching
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: "2rem" }}>
          {teaching.title}
        </h1>
        <TeachingForm mode="edit" teaching={teaching} series={series} />
      </div>
    </main>
  );
}
