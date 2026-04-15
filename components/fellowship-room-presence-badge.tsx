"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  roomSlug: string;
};

export default function FellowshipRoomPresenceBadge({ roomSlug }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`fellowship-presence:${roomSlug}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const total = Object.keys(state).length;
        setCount(total);
      })
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [roomSlug]);

  let label = "No one is here yet";

  if (count === 1) {
    label = "1 here now";
  } else if (count > 1) {
    label = `${count} here now`;
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#86efac",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#86efac",
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}
