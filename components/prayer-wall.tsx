"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/components/supabase-browser";

type PrayerPost = {
  id?: string;
  author_name: string;
  message: string;
  created_at?: string;
};

type PrayerWallProps = {
  roomSlug: string;
  initialPosts: PrayerPost[];
};

export default function PrayerWall({ roomSlug, initialPosts }: PrayerWallProps) {
  const [posts, setPosts] = useState<PrayerPost[]>(initialPosts);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel(`prayer-wall-${roomSlug}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prayer_posts",
          filter: `room_slug=eq.${roomSlug}`,
        },
        (payload) => {
          const newPost = payload.new as PrayerPost;
          setPosts((current) => [newPost, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomSlug]);

  return (
   <div style={{ display: "grid", gap: 14 }}>
      <p style={{ opacity: 0.6, marginBottom: 10 }}>Shared quietly with others</p>

      {posts.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No prayer posts yet.</p>
      ) : null}

      {posts.map((post, index) => (
        <article
          key={post.id ?? `${post.author_name}-${index}`}
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 18,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <p style={{ fontWeight: 700, marginBottom: 8 }}>{post.author_name}</p>
          <p style={{ opacity: 0.86, lineHeight: 1.7, margin: 0 }}>{post.message}</p>
        </article>
      ))}
    </div>
  );
}
