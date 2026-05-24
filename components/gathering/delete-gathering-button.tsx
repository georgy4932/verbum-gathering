"use client";

import { useState } from "react";

type Props = {
  gatheringName: string;
  deleteAction: () => Promise<void>;
};

export default function DeleteGatheringButton({ gatheringName, deleteAction }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={dangerBtnStyle}
      >
        Close gathering
      </button>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <p style={{ margin: 0, fontSize: 13, color: "#c07060" }}>
        Close &ldquo;{gatheringName}&rdquo;? This cannot be undone.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={async () => {
            setLoading(true);
            await deleteAction();
          }}
          disabled={loading}
          style={{ ...dangerBtnStyle, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Closing…" : "Yes, close it"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={cancelBtnStyle}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const dangerBtnStyle: React.CSSProperties = {
  fontSize: 13, padding: "7px 16px", borderRadius: 999,
  border: "1px solid rgba(192,112,96,0.4)", background: "transparent",
  color: "#c07060", cursor: "pointer",
};
const cancelBtnStyle: React.CSSProperties = {
  fontSize: 13, padding: "7px 16px", borderRadius: 999,
  border: "1px solid var(--faint2)", background: "transparent",
  color: "var(--stone)", cursor: "pointer",
};
