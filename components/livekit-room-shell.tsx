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
        {micEnabled ? "Mute" : "Unmute microphone"}
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
      <h3 style={{ marginTop: 0 }}>Present</h3>
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
      setError(data.error || "Unable to enter gathering");
      return;
    }

    setToken(data.token);
  }

  if (!token) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: 28,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          textAlign: "center",
        }}
      >
        <p style={{ opacity: 0.6, marginBottom: 12 }}>
          You are entering a live gathering
        </p>
        <h2 style={{ marginBottom: 16 }}>Take a moment. Be still.</h2>
        <p style={{ opacity: 0.75, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
          Others are already here — praying, listening, waiting.
        </p>
        <button
          type="button"
          onClick={joinRoom}
          disabled={!serverUrl || joining}
          style={{
            minHeight: 44,
            padding: "0 2rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "inherit",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {joining ? "Entering..." : "Enter quietly"}
        </button>

        {error ? <p style={{ color: "#fca5a5", margin: "16px 0 0" }}>{error}</p> : null}
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
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            You are here with others.
          </p>
          <h2 style={{ marginTop: 0 }}>Live gathering</h2>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p style={{ opacity: 0.6, marginBottom: 6 }}>Focus</p>
            <p style={{ margin: 0 }}>
              "Be still, and know that I am God." — Psalm 46:10
            </p>
          </div>
          <RoomStatus />
          <RoomAudioRenderer />
          <HostControls />
          <ParticipantList />
        </div>
      </LiveKitRoom>
    </div>
  );
}
