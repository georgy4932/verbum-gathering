import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMinisterSeries } from "@/lib/db/studio";
import TeachingForm from "@/components/studio/teaching-form";

export const metadata = { title: "New Teaching — Studio" };

export default async function NewTeachingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = roleRow?.role ?? "member";
  if (!["minister", "admin"].includes(role)) {
    redirect("/studio");
  }

  const series = await getMinisterSeries(user.id);

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="movement-eyebrow" style={{ color: "var(--studio)" }}>
          Studio — New teaching
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: "2rem" }}>
          Write a teaching
        </h1>
        <TeachingForm mode="create" series={series} />
      </div>
    </main>
  );
}
