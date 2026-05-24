import { notFound, redirect } from "next/navigation";
import { getGathering, getMyMembership } from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import GatheringNav from "@/components/gathering/gathering-nav";
import JoinButton from "@/components/gathering/join-button";

export const dynamic = "force-dynamic";

export default async function GatheringLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [gathering, supabase] = await Promise.all([
    getGathering(slug),
    createSupabaseServerClient(),
  ]);

  if (!gathering) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let membership = null;
  if (user) {
    membership = await getMyMembership(gathering.id);
  }

  const isHost = membership?.role === "host";
  const isMember = !!membership;

  if (gathering.visibility === "private" && !isMember) {
    redirect("/gatherings");
  }

  return (
    <main style={{ padding: "3rem 1.25rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "var(--stone)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11, marginBottom: 6 }}>
                {gathering.visibility === "public" ? "Public gathering" : gathering.visibility === "community" ? "Community" : "Private"} · {gathering.member_count} {gathering.member_count === 1 ? "member" : "members"}
              </p>
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", margin: 0, lineHeight: 1.1, color: "var(--cream)" }}>
                {gathering.name}
              </h1>
              {gathering.passage_ref && (
                <p style={{ margin: "8px 0 0", color: "var(--stone)", fontSize: 13, fontStyle: "italic" }}>
                  {gathering.passage_ref}
                </p>
              )}
            </div>
            {user && (
              <JoinButton
                gatheringId={gathering.id}
                isMember={isMember}
                isHost={isHost}
              />
            )}
          </div>
        </div>

        <GatheringNav slug={slug} isHost={isHost} />

        {children}

      </div>
    </main>
  );
}
