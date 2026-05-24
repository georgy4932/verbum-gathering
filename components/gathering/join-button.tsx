"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinGathering, leaveGathering } from "@/app/actions/gatherings";

type Props = {
  gatheringId: string;
  isMember: boolean;
  isHost: boolean;
};

export default function JoinButton({ gatheringId, isMember, isHost }: Props) {
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(isMember);
  const router = useRouter();

  if (isHost) return null;

  async function handleClick() {
    setLoading(true);
    try {
      if (member) {
        const res = await leaveGathering(gatheringId);
        if (res.success) setMember(false);
      } else {
        const res = await joinGathering(gatheringId);
        if (res.success) {
          setMember(true);
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        minHeight: 38,
        padding: "0 1.2rem",
        borderRadius: 999,
        border: member ? "1px solid var(--faint2)" : "1px solid var(--companion)",
        background: member ? "transparent" : "var(--companion)",
        color: member ? "var(--muted)" : "var(--bg)",
        cursor: loading ? "default" : "pointer",
        fontSize: 13,
        opacity: loading ? 0.6 : 1,
        transition: "all 0.15s",
      }}
    >
      {loading ? "…" : member ? "Leave" : "Join gathering"}
    </button>
  );
}
