import { notFound, redirect } from "next/navigation";
import { getGathering, getMyMembership, listMembers } from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MemberRow from "@/components/gathering/member-row";

export const dynamic = "force-dynamic";

export default async function MembersPage({
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
  if (!membership) redirect(`/gatherings/${slug}`);

  const isHost = membership.role === "host";
  const isMod = membership.role === "moderator" || isHost;
  const members = await listMembers(gathering.id);

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cream)" }}>Members</h2>
        <span style={{ fontSize: 13, color: "var(--stone)" }}>{members.length}</span>
      </div>

      {members.map((m) => (
        <MemberRow
          key={m.user_id}
          member={m}
          gatheringId={gathering.id}
          gatheringSlug={slug}
          currentUserId={user.id}
          canManage={isMod}
          isHost={isHost}
        />
      ))}
    </div>
  );
}
