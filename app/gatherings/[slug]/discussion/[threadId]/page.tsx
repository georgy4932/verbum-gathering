import { notFound, redirect } from "next/navigation";
import {
  getGathering,
  getMyMembership,
  getThread,
  listReplies,
  createReply,
} from "@/app/actions/gatherings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GatheringDiscussionReply } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const [gathering, thread] = await Promise.all([getGathering(slug), getThread(threadId)]);
  if (!gathering || !thread) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const membership = user ? await getMyMembership(gathering.id) : null;
  const isMember = !!membership;

  const replies = await listReplies(threadId);

  async function handleReply(formData: FormData) {
    "use server";
    await createReply(threadId, slug, formData);
    redirect(`/gatherings/${slug}/discussion/${threadId}`);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>

      {/* Thread header */}
      <div style={{ display: "grid", gap: 12 }}>
        <a href={`/gatherings/${slug}/discussion`} style={{ fontSize: 13, color: "var(--stone)", textDecoration: "none", opacity: 0.6 }}>
          ← Discussion
        </a>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: "var(--cream)", lineHeight: 1.2 }}>{thread.title}</h2>
        {thread.body && (
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {thread.body}
          </p>
        )}
        <p style={{ margin: 0, color: "var(--stone)", fontSize: 11, opacity: 0.5 }}>
          {new Date(thread.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      {/* Replies */}
      <section>
        <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", marginBottom: 14 }}>
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {replies.map((reply: GatheringDiscussionReply) => (
            <article key={reply.id} style={cardStyle}>
              <p style={{ margin: 0, color: "var(--cream)", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {reply.body}
              </p>
              <p style={{ margin: 0, color: "var(--stone)", fontSize: 11, opacity: 0.5 }}>
                {new Date(reply.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Reply form */}
      {isMember ? (
        <section style={{ ...cardStyle, border: "1px solid var(--faint)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--stone)", margin: 0 }}>
            Reply
          </p>
          <form action={handleReply} style={{ display: "grid", gap: 14 }}>
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Share your thoughts…"
              style={textareaStyle}
            />
            <button type="submit" style={submitStyle}>Reply</button>
          </form>
        </section>
      ) : (
        <p style={{ color: "var(--stone)", fontSize: 13, opacity: 0.6 }}>
          Join this gathering to participate in discussion.
        </p>
      )}

    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "16px 20px", borderRadius: 16,
  border: "1px solid var(--faint)", background: "var(--card-surface)",
  display: "grid", gap: 10,
};
const textareaStyle: React.CSSProperties = {
  borderRadius: 12, border: "1px solid var(--faint2)", background: "var(--bg2)",
  color: "var(--cream)", padding: "0.75rem 1rem", fontSize: 14,
  fontFamily: "'DM Sans', sans-serif", outline: "none",
  caretColor: "var(--companion)", width: "100%", boxSizing: "border-box",
  resize: "vertical", lineHeight: 1.75,
};
const submitStyle: React.CSSProperties = {
  minHeight: 40, padding: "0 1.2rem", borderRadius: 999,
  border: "1px solid var(--faint2)", background: "transparent",
  color: "var(--muted)", fontSize: 13, cursor: "pointer",
  justifySelf: "start",
};
