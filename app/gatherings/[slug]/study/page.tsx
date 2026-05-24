import Link from "next/link";
import { notFound } from "next/navigation";
import { getGathering, getMyMembership, listStudyPosts } from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GatheringStudyPost } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function StudyPage({
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
  const isMod = membership?.role === "host" || membership?.role === "moderator";

  const posts = await listStudyPosts(gathering.id);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "var(--cream)" }}>Study</h2>
        {isMod && (
          <Link href={`/gatherings/${slug}/study/new`} style={btnStyle}>
            + New post
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            No study posts yet.{isMod ? " Share a teaching or study note." : ""}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {posts.map((post: GatheringStudyPost) => (
            <article key={post.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--cream)" }}>{post.title}</h3>
                {post.passage_ref && (
                  <span style={{ fontSize: 12, color: "var(--stone)", fontStyle: "italic", flexShrink: 0 }}>
                    {post.passage_ref}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {post.body}
              </p>
              <p style={{ margin: 0, color: "var(--stone)", fontSize: 11, opacity: 0.5 }}>
                {new Date(post.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "7px 16px",
  borderRadius: 999,
  border: "1px solid var(--faint2)",
  color: "var(--muted)",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

const emptyStyle: React.CSSProperties = {
  padding: "28px 24px",
  borderRadius: 20,
  border: "1px solid var(--faint)",
  background: "var(--card-surface)",
};

const cardStyle: React.CSSProperties = {
  padding: "20px 24px",
  borderRadius: 20,
  border: "1px solid var(--faint)",
  background: "var(--card-surface)",
  display: "grid",
  gap: 12,
};
