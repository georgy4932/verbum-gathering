import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SeriesForm from "@/components/studio/series-form";

export const metadata = { title: "New Series — Studio" };

export default async function NewSeriesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("id", user.id).maybeSingle();
  const role = roleRow?.role ?? "member";
  if (!["minister", "admin"].includes(role)) redirect("/studio");

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="movement-eyebrow" style={{ color: "var(--studio)" }}>
          Studio — New series
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: "2rem" }}>
          Start a series
        </h1>
        <SeriesForm />
      </div>
    </main>
  );
}
