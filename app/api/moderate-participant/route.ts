import { RoomServiceClient } from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomSlug, participantIdentity, action } = await request.json();

    if (!roomSlug || !participantIdentity || !action) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }

    const { data: moderator } = await supabase
      .from("room_moderators")
      .select("can_moderate_participants")
      .eq("room_slug", roomSlug)
      .eq("user_id", user.id)
      .single();

    if (!moderator?.can_moderate_participants) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const host = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss:\/\//, "https://");
    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;

    const roomService = new RoomServiceClient(host!, apiKey, apiSecret);

    if (action === "remove") {
      await roomService.removeParticipant(roomSlug, participantIdentity);
    }

    if (action === "mute-mic") {
      const participant = await roomService.getParticipant(roomSlug, participantIdentity);
      const micTrack = participant.tracks.find((track) => track.source === 2);
      if (!micTrack?.sid) {
        return Response.json({ error: "No microphone track found" }, { status: 404 });
      }
      await roomService.mutePublishedTrack(
        roomSlug,
        participantIdentity,
        micTrack.sid,
        true
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to moderate participant" }, { status: 500 });
  }
}
