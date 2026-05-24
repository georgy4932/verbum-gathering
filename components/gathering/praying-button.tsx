"use client";

import { useState } from "react";
import { acknowledgePrayer } from "@/app/actions/gatherings";

type Props = {
  requestId: string;
  gatheringSlug: string;
  initialCount: number;
  initialPraying: boolean;
};

export default function PrayingButton({
  requestId,
  gatheringSlug,
  initialCount,
  initialPraying,
}: Props) {
  const [praying, setPraying] = useState(initialPraying);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    if (praying || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await acknowledgePrayer(requestId, gatheringSlug);
      if (res.success) {
        setPraying(true);
        setCount((c) => c + 1);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
          border: `1px solid ${failed ? "rgba(192,112,96,0.4)" : "var(--faint)"}`,
          background: praying ? "rgba(134,239,172,0.06)" : "transparent",
          color: praying ? "#86efac" : failed ? "#c07060" : "var(--stone)",
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
      {failed && (
        <span style={{ fontSize: 11, color: "#c07060", opacity: 0.8 }}>
          Couldn&apos;t record — try again
        </span>
      )}
    </div>
  );
}
