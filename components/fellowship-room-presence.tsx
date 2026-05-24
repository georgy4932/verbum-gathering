"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = { roomSlug: string };

export default function FellowshipRoomPresence({ roomSlug }: Props) {
  const [count, setCount] = useState(0);
  const presenceKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const channel = supabaseBrowser.channel(`fellowship-presence:${roomSlug}`, {
      config: { presence: { key: presenceKey } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ room_slug: roomSlug, joined_at: new Date().toISOString() });
        }
      });

    return () => { supabaseBrowser.removeChannel(channel); };
  }, [roomSlug, presenceKey]);

  const label =
    count === 0 ? "No one else is here yet." :
    count === 1 ? "1 person is here." :
    `${count} people are here.`;

  return (
    <p style={{ color: "var(--stone)", marginBottom: 0, lineHeight: 1.7, fontSize: 14 }}>
      {label}
    </p>
  );
}
