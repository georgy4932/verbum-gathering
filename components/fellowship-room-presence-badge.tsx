"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = { roomSlug: string };

export default function FellowshipRoomPresenceBadge({ roomSlug }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`fellowship-presence:${roomSlug}`);

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe();

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [roomSlug]);

  const label =
    count === 0 ? "No one here yet" :
    count === 1 ? "1 here now" :
    `${count} here now`;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--stone)" }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: count > 0 ? "#86efac" : "var(--faint2)",
        display: "inline-block",
        transition: "background 0.3s",
      }} />
      {label}
    </div>
  );
}
