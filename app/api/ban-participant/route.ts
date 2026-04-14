import { RoomServiceClient } from "livekit-server-sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { roomSlug, participantIdentity, targetUserId, reason, bannedUntil } =
      await request.json();

    if (!roomSlug || !participantIdentity) {
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

    await supabaseAdmin.from("room_bans").insert({
      room_slug: roomSlug,
      user_id: targetUserId ?? null,
      participant_identity: participantIdentity,
      reason: reason ?? null,
      banned_until: bannedUntil ?? null,
      created_by: user.id,
    });

    const host = process.env.NEXT_PUBLIC_LIVEKIT_URL?.replace(/^wss:\/\//, "https://");
    const roomService = new RoomServiceClient(
      host!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    await roomService.removeParticipant(roomSlug, participantIdentity);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unable to ban participant" }, { status: 500 });
  }
}
