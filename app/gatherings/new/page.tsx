import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CreateGatheringForm from "@/components/gathering/create-gathering-form";

export const dynamic = "force-dynamic";

export default async function NewGatheringPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { error } = await searchParams;

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        <p style={{ color: "var(--stone)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>
          Gatherings
        </p>
        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", margin: "0 0 32px", lineHeight: 1.1, color: "var(--cream)" }}>
          Start a gathering
        </h1>

        {error && (
          <p style={{ color: "var(--live)", fontSize: 14, marginBottom: 20 }}>
            {decodeURIComponent(error)}
          </p>
        )}

        <CreateGatheringForm />

      </div>
    </main>
  );
}
