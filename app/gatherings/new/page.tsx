import Link from "next/link";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("trust_state")
    .eq("id", user.id)
    .single();

  // Gate at render time, not only on action submit.
  // Standard users see an explanation — not a form that silently fails.
  if (profile?.trust_state !== "trusted_user") {
    return (
      <main style={{ padding: "4rem 1.25rem" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 24 }}>
          <div>
            <p style={{ color: "var(--stone)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>
              Gatherings
            </p>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", margin: "0 0 16px", lineHeight: 1.15, color: "var(--cream)" }}>
              Gatherings are created by trusted members
            </h1>
          </div>

          <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.8 }}>
            Creating a Gathering requires trusted member status, which is reviewed
            by the team after consistent participation in the community.
          </p>

          <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.8 }}>
            To be considered: join existing Gatherings, contribute to discussions,
            and share prayer requests. Trusted members are those who have shown
            genuine participation over time — not a threshold to game.
          </p>

          <Link
            href="/gatherings"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 1.25rem",
              borderRadius: 999,
              border: "1px solid var(--faint2)",
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: 14,
              justifySelf: "start",
            }}
          >
            Browse gatherings
          </Link>
        </div>
      </main>
    );
  }

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
