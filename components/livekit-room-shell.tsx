"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

type LivekitRoomShellProps = {
  roomName: string;
};

function RoomStatus() {
  const state = useConnectionState();
  return (
    <p style={{ opacity: 0.68, margin: "0 0 14px", fontSize: "0.95rem" }}>
      {state === "connected" ? "You are present in the gathering." : `Connection: ${state}`}
    </p>
  );
}

function HostControls() {
  const { localParticipant } = useLocalParticipant();
  const [micEnabled, setMicEnabled] = useState(false);

  async function toggleMic() {
    const nextValue = !micEnabled;
    await localParticipant.setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
      <button
        type="button"
        onClick={toggleMic}
        style={{
          minHeight: 44,
          padding: "0 1rem",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {micEnabled ? "Mute microphone" : "Open microphone"}
      </button>
    </div>
  );
}

function ParticipantList() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);

  const names = Array.from(
    new Set(
      tracks
        .map((item) => item.participant?.name || item.participant?.identity)
        .filter(Boolean)
    )
  );

  return (
    <div style={{ marginTop: 22, padding: 18, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <p style={{ opacity: 0.62, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.78rem" }}>
        Present
      </p>
      {names.length === 0 ? (
        <p style={{ opacity: 0.72, margin: 0 }}>No one has entered yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {names.map((name) => (
            <div key={name} style={{ opacity: 0.9 }}>{name}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LivekitRoomShell({ roomName }: LivekitRoomShellProps) {
  const [token, setToken] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    async function joinRoom() {
    setJoining(true);
    setError("");

    const response = await fetch("/api/livekit-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName }),
    });

    const data = await response.json();
    setJoining(false);

    if (!response.ok || !data.token) {
      setError(data.error || "Unable to enter the gathering");
      return;
    }

    setToken(data.token);
  }

  function leaveRoom() {
    setToken("");
    setError("");
  }

