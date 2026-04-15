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
    <div
      style={{
        marginTop: 22,
        padding: 18,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
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

  if (!token) {
    return (
      <div
        style={{
          marginTop: 28,
          padding: 32,
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          textAlign: "center",
        }}
      >
        <p style={{ opacity: 0.58, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.82rem" }}>
          Live gathering
        </p>

        <h2 style={{ margin: "0 0 14px", fontSize: "clamp(1.6rem, 3vw, 2.3rem)" }}>
          Take a moment. Be still.
        </h2>

        <p style={{ opacity: 0.78, maxWidth: 460, margin: "0 auto 22px", lineHeight: 1.75 }}>
          Others may already be here — praying, listening, waiting before God.
        </p>

        <div style={{ maxWidth: 460, margin: "0 auto 24px", padding: 16, borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.92rem" }}>Enter gently</p>
          <p style={{ opacity: 0.82, margin: 0, lineHeight: 1.65 }}>
            This space is for prayer, Scripture, and quiet attention.
          </p>
        </div>

        <button
          type="button"
          onClick={joinRoom}
          disabled={!serverUrl || joining}
          style={{
            minHeight: 46,
            padding: "0 1.2rem",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "inherit",
            cursor: "pointer",
          }}
        >
          {joining ? "Entering..." : "Enter gathering"}
        </button>

        {error ? <p style={{ color: "#fca5a5", marginTop: 14, marginBottom: 0 }}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 28 }}>
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={false}
      >
        <div
          style={{
            padding: 26,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <p style={{ opacity: 0.6, margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.8rem" }}>
            Live audio
          </p>

          <h2 style={{ marginTop: 0, marginBottom: 12 }}>Remain here a while.</h2>

          <RoomStatus />
          <RoomAudioRenderer />
          <HostControls />
          <ParticipantList />
        </div>
      </LiveKitRoom>
    </div>
  );
}
