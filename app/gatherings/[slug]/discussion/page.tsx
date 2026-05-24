import Link from "next/link";
import { notFound } from "next/navigation";
import { getGathering, getMyMembership, listThreads } from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GatheringDiscussionThread } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gathering = await getGathering(slug);
  if (!gathering) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const membership = user ? await getMyMembership(gathering.id) : null;
  const isMember = !!membership;

  const threads = await listThreads(gathering.id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cream)" }}>Discussion</h2>
        {isMember && (
          <Link href={`/gatherings/${slug}/discussion/new`} style={btnStyle}>
            + New thread
          </Link>
        )}
      </div>

      {threads.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            No threads yet.{isMember ? " Start the conversation." : ""}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {threads.map((thread: GatheringDiscussionThread) => (
            <Link
              key={thread.id}
              href={`/gatherings/${slug}/discussion/${thread.id}`}
              style={cardStyle}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--cream)" }}>{thread.title}</h3>
                <span style={{ fontSize: 12, color: "var(--stone)", opacity: 0.5, flexShrink: 0, marginTop: 2 }}>
                  {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
                </span>
              </div>
              {thread.body && (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>
                  {thread.body.slice(0, 160)}{thread.body.length > 160 ? "…" : ""}
                </p>
              )}
              <p style={{ margin: 0, color: "var(--stone)", fontSize: 11, opacity: 0.5 }}>
                {new Date(thread.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontSize: 13, padding: "7px 16px", borderRadius: 999,
  border: "1px solid var(--faint2)", color: "var(--muted)",
  textDecoration: "none", display: "inline-flex", alignItems: "center",
};
const emptyStyle: React.CSSProperties = {
  padding: "28px 24px", borderRadius: 20,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
};
const cardStyle: React.CSSProperties = {
  padding: "16px 20px", borderRadius: 16,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
  display: "grid", gap: 8, textDecoration: "none", color: "inherit",
};
