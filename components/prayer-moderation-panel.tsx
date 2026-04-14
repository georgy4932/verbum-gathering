"use client";

import { useState } from "react";

type PrayerPost = {
  id: string;
  author_name: string;
  message: string;
};

type PrayerModerationPanelProps = {
  roomSlug: string;
  posts: PrayerPost[];
};

export default function PrayerModerationPanel({
  roomSlug,
  posts,
}: PrayerModerationPanelProps) {
  const [notice, setNotice] = useState("");

  async function hidePost(prayerPostId: string) {
    setNotice("");

    const response = await fetch("/api/moderate-prayer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prayerPostId,
        roomSlug,
        action: "hidden",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setNotice(data.error || "Unable to moderate post");
      return;
    }

    setNotice("Post hidden. Refresh the page to confirm.");
  }

  return (
    <div
      style={{
        marginTop: 24,
        padding: 20,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Prayer moderation</h3>

      <div style={{ display: "grid", gap: 12 }}>
        {posts.map((post) => (
          <article
            key={post.id}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p style={{ fontWeight: 700, marginBottom: 8 }}>{post.author_name}</p>
            <p style={{ marginBottom: 12 }}>{post.message}</p>
            <button
              type="button"
              onClick={() => hidePost(post.id)}
              style={{
                minHeight: 40,
                padding: "0 0.9rem",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              Hide post
            </button>
          </article>
        ))}
      </div>

      {notice ? <p style={{ marginTop: 12 }}>{notice}</p> : null}
    </div>
  );
}
