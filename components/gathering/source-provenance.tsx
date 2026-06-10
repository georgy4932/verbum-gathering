import type { GatheringSourceContext, ScriptureRef } from "@/lib/types/domain";

// Phase 4A — read-only provenance line for Companion-origin Gathering items.
// Renders nothing for manual content or unrecognised source contexts.
const SOURCE_LABELS: Partial<Record<GatheringSourceContext, string>> = {
  companion_note: "Shared from Companion reflection",
  companion_prayer: "Shared from Companion prayer",
};

export default function SourceProvenance({
  sourceContext,
  passageRef,
  translationVersion,
}: {
  sourceContext: GatheringSourceContext | null;
  passageRef: ScriptureRef | null;
  translationVersion: string | null;
}) {
  if (!sourceContext) return null;
  const label = SOURCE_LABELS[sourceContext];
  if (!label) return null;

  let text = label;
  if (passageRef) {
    text += ` · ${passageRef}`;
    if (translationVersion) {
      text += ` (${translationVersion})`;
    }
  }

  return <p style={style}>{text}</p>;
}

const style: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "var(--stone)",
  opacity: 0.5,
  fontStyle: "italic",
  lineHeight: 1.5,
};
