"use client";

import { useState, useTransition } from "react";
import { savePassage, unsavePassage } from "@/app/actions/companion";

export default function SavePassageButton({
  passageRef,
  initialSaved,
}: {
  passageRef: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      if (saved) {
        await unsavePassage(passageRef);
        setSaved(false);
      } else {
        await savePassage(passageRef);
        setSaved(true);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        fontSize: 12,
        color: saved ? "var(--companion)" : "var(--stone)",
        background: "none",
        border: `1px solid ${saved ? "var(--companion-lo)" : "var(--faint)"}`,
        borderRadius: 8,
        padding: "8px 14px",
        cursor: isPending ? "default" : "pointer",
        letterSpacing: "0.04em",
        transition: "color 0.2s, border-color 0.2s",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {isPending ? "…" : saved ? "Passage saved" : "Save passage"}
    </button>
  );
}
