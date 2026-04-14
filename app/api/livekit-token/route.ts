import { AccessToken } from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomName } = await request.json();

    if (!roomName) {
      return Response.json({ error: "roomName is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("host_profiles")
      .select("is_host")
      .eq("id", user.id)
      .single();

    const { data: room } = await supabase
      .from("live_rooms")
      .select("livekit_room_name, host_user_id")
      .eq("slug", roomName)
      .single();

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    const isAssignedHost = profile?.is_host && room.host_user_id === user.id;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "Missing LiveKit credentials" },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: user.email ?? "User",
      ttl: "1h",
    });

    token.addGrant({
      roomJoin: true,
      room: room.livekit_room_name || roomName,
      canSubscribe: true,
      canPublish: Boolean(isAssignedHost),
      canPublishData: true,
    });

    return Response.json({
      token: await token.toJwt(),
      isHost: Boolean(isAssignedHost),
    });
  } catch {
    return Response.json(
      { error: "Unable to generate token" },
      { status: 500 }
    );
  }
}
