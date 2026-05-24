"use client";

import { useState } from "react";
import { removeMember, setMemberRole } from "@/app/actions/gatherings";
import type { GatheringMemberWithProfile } from "@/app/actions/gatherings";
import type { GatheringMemberRole } from "@/lib/types/domain";

type Props = {
  member: GatheringMemberWithProfile;
  gatheringId: string;
  gatheringSlug: string;
  currentUserId: string;
  canManage: boolean;
  isHost: boolean;
};

const roleLabel: Record<GatheringMemberRole, string> = {
  host: "Host",
  moderator: "Mod",
  member: "Member",
};

const roleColor: Record<GatheringMemberRole, string> = {
  host: "var(--gold)",
  moderator: "var(--companion)",
  member: "var(--stone)",
};

export default function MemberRow({
  member,
  gatheringId,
  gatheringSlug,
  currentUserId,
  canManage,
  isHost,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [role, setRole] = useState<GatheringMemberRole>(member.role as GatheringMemberRole);

  const isSelf = member.user_id === currentUserId;
  const isTargetHost = member.role === "host";
  const displayName = member.profile?.display_name ?? member.profile?.username ?? "Member";

  if (removed) return null;

  async function handleRemove() {
    if (!confirm(`Remove ${displayName} from this gathering?`)) return;
    setLoading(true);
    const res = await removeMember(member.user_id, gatheringId, gatheringSlug);
    if (res.success) setRemoved(true);
    setLoading(false);
  }

  async function handleToggleMod() {
    setLoading(true);
    const newRole: "moderator" | "member" = role === "moderator" ? "member" : "moderator";
    const res = await setMemberRole(member.user_id, gatheringId, gatheringSlug, newRole);
    if (res.success) setRole(newRole);
    setLoading(false);
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 16px",
      borderRadius: 14,
      border: "1px solid var(--faint)",
      background: "var(--card-surface)",
    }}>
      {/* Avatar placeholder */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "var(--faint2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, color: "var(--stone)", flexShrink: 0,
      }}>
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Name + role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--cream)", fontWeight: 500 }}>
          {displayName}{isSelf && <span style={{ color: "var(--stone)", fontSize: 12, marginLeft: 6 }}>you</span>}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: roleColor[role], letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {roleLabel[role]}
        </p>
      </div>

      {/* Host controls */}
      {canManage && !isSelf && !isTargetHost && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {isHost && (
            <button
              type="button"
              onClick={handleToggleMod}
              disabled={loading}
              style={ghostBtnStyle}
              title={role === "moderator" ? "Remove mod" : "Make moderator"}
            >
              {role === "moderator" ? "Demote" : "Mod"}
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            style={{ ...ghostBtnStyle, color: "#c07060", borderColor: "rgba(192,112,96,0.3)" }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

const ghostBtnStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid var(--faint2)",
  background: "transparent",
  color: "var(--stone)",
  cursor: "pointer",
};
