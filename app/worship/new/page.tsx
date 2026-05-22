import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import WorshipSetForm from "@/components/worship/worship-set-form";

export const metadata = { title: "New Worship Set — Worship" };

export default async function NewWorshipSetPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: roleRow } = await supabase
    .from("user_roles").select("role").eq("id", user.id).maybeSingle();
  const role = roleRow?.role ?? "member";
  if (!["minister", "admin"].includes(role)) redirect("/worship");

  return (
    <main style={{ padding: "4rem 1.25rem 6rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="movement-eyebrow" style={{ color: "var(--worship)" }}>
          Worship — New set
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", marginBottom: 10 }}>
          Create a worship set
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--stone)", marginBottom: "2rem", lineHeight: 1.6 }}>
          After creating the set you will be taken to the editor to add individual moments.
        </p>
        <WorshipSetForm mode="create" />
      </div>
    </main>
  );
}
