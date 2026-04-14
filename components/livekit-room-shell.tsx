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
  return <p style={{ opacity: 0.75 }}>Connection: {state}</p>;
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
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
      <button
        type="button"
        onClick={toggleMic}
        style={{
          minHeight: 44,
          padding: "0 1rem",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        {micEnabled ? "Mute microphone" : "Unmute microphone"}
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
    <div
      style={{
        marginTop: 20,
        padding: 18,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>In the room</h3>
      {names.length === 0 ? (
        <p style={{ opacity: 0.75, marginBottom: 0 }}>No one connected yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {names.map((name) => (
            <div key={name} style={{ opacity: 0.9 }}>
              {name}
            </div>
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
      setError(data.error || "Unable to join room");
      return;
    }

    setToken(data.token);
  }

  if (!token) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 24,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "grid",
          gap: 14,
        }}
      >
        <h2 style={{ margin: 0 }}>Join broadcast</h2>
        <p style={{ opacity: 0.78, margin: 0 }}>
          Enter this live room with your saved profile name.
        </p>

        <button
          type="button"
          onClick={joinRoom}
          disabled={!serverUrl || joining}
          style={{
            minHeight: 44,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          {joining ? "Joining..." : "Enter live room"}
        </button>

        {error ? <p style={{ color: "#fca5a5", margin: 0 }}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24 }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Live broadcast</h2>
          <RoomStatus />
          <RoomAudioRenderer />
          <HostControls />
          <ParticipantList />
        </div>
      </LiveKitRoom>
    </div>
  );
}
