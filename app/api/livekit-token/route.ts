import { AccessToken } from "livekit-server-sdk";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomName, participantName, isHost } = await request.json();

    if (!roomName || !participantName) {
      return Response.json(
        { error: "roomName and participantName are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "Missing LiveKit server credentials" },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: `${participantName}-${crypto.randomUUID()}`,
      name: participantName,
      ttl: "1h",
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: Boolean(isHost),
      canSubscribe: true,
      canPublishData: true,
    });

    return Response.json({
      token: await token.toJwt(),
    });
  } catch {
    return Response.json(
      { error: "Unable to generate token" },
      { status: 500 }
    );
  }
}
