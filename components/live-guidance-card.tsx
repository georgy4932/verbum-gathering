"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Guidance = {
  focus_text?: string | null;
  pinned_scripture?: string | null;
  pinned_prayer?: string | null;
  closing_text?: string | null;
  is_closing?: boolean;
};

type LiveGuidanceCardProps = {
  roomSlug: string;
  initialGuidance: Guidance | null;
};

export default function LiveGuidanceCard({
  roomSlug,
  initialGuidance,
}: LiveGuidanceCardProps) {
  const [guidance, setGuidance] = useState<Guidance | null>(initialGuidance);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`guidance:${roomSlug}`);

    channel
      .on("broadcast", { event: "guidance:update" }, ({ payload }) => {
        setGuidance(payload as Guidance);
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomSlug]);

  if (!guidance) return null;

  const hasContent =
    guidance.focus_text ||
    guidance.pinned_scripture ||
    guidance.pinned_prayer ||
    guidance.closing_text;

  if (!hasContent) return null;

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 24,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <p style={{ opacity: 0.55, margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.82rem" }}>
        {guidance.is_closing ? "Closing moment" : "Held in this gathering"}
      </p>

      {guidance.focus_text ? (
        <div style={{ marginBottom: 14 }}>
          <p style={{ opacity: 0.58, margin: "0 0 4px", fontSize: "0.9rem" }}>Focus</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{guidance.focus_text}</p>
        </div>
      ) : null}

      {guidance.pinned_scripture ? (
        <div style={{ marginBottom: 14 }}>
          <p style={{ opacity: 0.58, margin: "0 0 4px", fontSize: "0.9rem" }}>Scripture</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{guidance.pinned_scripture}</p>
        </div>
      ) : null}

      {guidance.pinned_prayer ? (
        <div style={{ marginBottom: 14 }}>
          <p style={{ opacity: 0.58, margin: "0 0 4px", fontSize: "0.9rem" }}>Prayer</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{guidance.pinned_prayer}</p>
        </div>
      ) : null}

      {guidance.closing_text ? (
        <div>
          <p style={{ opacity: 0.58, margin: "0 0 4px", fontSize: "0.9rem" }}>Blessing</p>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{guidance.closing_text}</p>
        </div>
      ) : null}
    </div>
  );
}
