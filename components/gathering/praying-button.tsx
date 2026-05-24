"use client";

import { useState } from "react";
import { acknowledgePrayer } from "@/app/actions/gatherings";

type Props = {
  requestId: string;
  gatheringId: string;
  gatheringSlug: string;
  initialCount: number;
  initialPraying: boolean;
};

export default function PrayingButton({
  requestId,
  gatheringId,
  gatheringSlug,
  initialCount,
  initialPraying,
}: Props) {
  const [praying, setPraying] = useState(initialPraying);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (praying || loading) return;
    setLoading(true);
    try {
      const res = await acknowledgePrayer(requestId, gatheringId, gatheringSlug);
      if (res.success) {
        setPraying(true);
        setCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={praying || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        padding: "5px 12px",
        borderRadius: 999,
        border: "1px solid var(--faint)",
        background: praying ? "rgba(134,239,172,0.06)" : "transparent",
        color: praying ? "#86efac" : "var(--stone)",
        cursor: praying || loading ? "default" : "pointer",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: 14 }}>🙏</span>
      {praying ? "Praying" : "I'm praying"}
      {count > 0 && (
        <span style={{ opacity: 0.6 }}>· {count}</span>
      )}
    </button>
  );
}
