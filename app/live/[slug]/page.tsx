import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LivekitRoomShell from "@/components/livekit-room-shell";
import LiveRoomRealtime from "@/components/live-room-realtime";
import HostSessionPanel from "@/components/host-session-panel";
import ContinueFromHere from "@/components/continue-from-here";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LiveRoomPage({ params }: PageProps) {
  const { slug } = await params;
  const supabaseServer = await createSupabaseServerClient();

  const [
    { data: room, error: roomError },
    { data: prayers },
    { data: latestNote },
    { data: authUserResult },
    { data: nextGatherings },
  ] = await Promise.all([
    supabase
      .from("live_rooms")
      .select("slug, title, description, status, time_label, host, kind")
      .eq("slug", slug)
      .single(),
    supabase
      .from("prayer_posts")
      .select("id, author_name, message, created_at")
      .eq("room_slug", slug)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("room_session_notes")
      .select("summary, key_scripture, closing_prayer, created_at")
      .eq("room_slug", slug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseServer.auth.getUser(),
    supabase
      .from("live_rooms")
      .select("slug, title, time_label, starts_at, is_live")
      .neq("slug", slug)
      .or("is_live.eq.true,starts_at.not.is.null")
      .order("is_live", { ascending: false })
      .order("starts_at", { ascending: true })
      .limit(3),
  ]);

  if (roomError || !room) {
    notFound();
  }

  const user = authUserResult.user;
  let canWriteSessionNotes = false;

  if (user) {
    const [{ data: moderator }, { data: hostProfile }] = await Promise.all([
      supabaseServer
        .from("room_moderators")
        .select("room_slug")
        .eq("room_slug", slug)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabaseServer
        .from("host_profiles")
        .select("is_host")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    canWriteSessionNotes = Boolean(moderator) || Boolean(hostProfile?.is_host);
  }

  const nextGathering =
    nextGatherings?.find((item) => item.slug !== slug) ?? null;

  return (
    <main style={{ padding: "4rem 1.25rem 5rem" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/live" style={{ opacity: 0.68, textDecoration: "none" }}>
          ← Back to gatherings
        </Link>

        <div
          style={{
            marginTop: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 32,
            padding: 32,
            background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <p style={{ opacity: 0.58, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.82rem" }}>
            {room.time_label}
          </p>

          <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3.6rem)", margin: "0 0 14px", lineHeight: 1.08 }}>
            {room.title}
          </h1>

          <p style={{ opacity: 0.82, lineHeight: 1.8, maxWidth: 760, marginBottom: 12 }}>
            {room.description}
          </p>

          <p style={{ opacity: 0.7, marginBottom: 20, fontSize: "1.05rem" }}>
            Remain here a while.
          </p>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 28, opacity: 0.85 }}>
            <div style={{ minWidth: 160 }}>
              <p style={{ opacity: 0.6, margin: "0 0 4px", fontSize: "0.85rem" }}>Led by</p>
              <p style={{ margin: 0 }}>{room.host}</p>
            </div>
            <div style={{ minWidth: 160 }}>
              <p style={{ opacity: 0.6, margin: "0 0 4px", fontSize: "0.85rem" }}>Gathering</p>
              <p style={{ margin: 0, textTransform: "capitalize" }}>{room.kind}</p>
            </div>
          </div>

          <div
            style={{
              marginBottom: 36,
              padding: "28px 24px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "center",
            }}
          >
            <p style={{ opacity: 0.5, marginBottom: 10, fontSize: "0.85rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Focus
            </p>
            <p style={{ fontSize: "1.2rem", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
              "Be still, and know that I am God."
            </p>
            <p style={{ opacity: 0.6, marginTop: 8 }}>Psalm 46:10</p>
          </div>

          {latestNote ? (
            <div
              style={{
                marginBottom: 36,
                padding: 24,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <p style={{ opacity: 0.58, margin: "0 0 8px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.82rem" }}>
                From a recent gathering
              </p>
              <p style={{ lineHeight: 1.8, marginTop: 0 }}>{latestNote.summary}</p>
              {latestNote.key_scripture ? (
                <p style={{ opacity: 0.78, marginBottom: 8 }}>
                  <strong>Scripture:</strong> {latestNote.key_scripture}
                </p>
              ) : null}
              {latestNote.closing_prayer ? (
                <p style={{ opacity: 0.78, marginBottom: 0 }}>
                  <strong>Closing prayer:</strong> {latestNote.closing_prayer}
                </p>
              ) : null}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 40,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <LivekitRoomShell roomName={slug} />

            <div style={{ marginTop: 32 }}>
              <LiveRoomRealtime roomSlug={slug} initialPosts={prayers ?? []} />
            </div>

            {canWriteSessionNotes ? (
              <details style={{ marginTop: 28 }}>
                <summary style={{ cursor: "pointer", opacity: 0.75 }}>
                  Host notes
                </summary>
                <HostSessionPanel roomSlug={slug} />
              </details>
            ) : null}

                      <ContinueFromHere
              currentRoomSlug={slug}
              nextGathering={
                nextGathering
                  ? {
                      slug: nextGathering.slug,
                      title: nextGathering.title,
                      timeLabel: nextGathering.time_label,
                    }
                  : null
              }
            />

            <p style={{ textAlign: "center", opacity: 0.5, marginTop: 40, fontSize: "0.9rem" }}>
              Go in peace.
            </p>
          </div>
        </div>
      </div>
    </main>

  );
}
