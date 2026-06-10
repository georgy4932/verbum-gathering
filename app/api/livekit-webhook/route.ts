import { WebhookReceiver } from "livekit-server-sdk";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const authHeader = request.headers.get("Authorization");

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!apiKey || !apiSecret || !authHeader) {
    return new Response("Missing webhook configuration", { status: 400 });
  }

  const receiver = new WebhookReceiver(apiKey, apiSecret);
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const event = await receiver.receive(rawBody, authHeader);

    if (event.event === "room_started") {
      await fetch(
        `${supabaseUrl}/rest/v1/live_rooms?livekit_room_name=eq.${event.room?.name}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ is_live: true }),
        }
      );

      await supabaseAdmin.from("room_sessions").insert({
        room_slug: event.room?.name,
        started_at: new Date().toISOString(),
      });
    }

    if (event.event === "room_finished") {
      await fetch(
        `${supabaseUrl}/rest/v1/live_rooms?livekit_room_name=eq.${event.room?.name}`,
        {
          method: "PATCH",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ is_live: false }),
        }
      );

      await supabaseAdmin
        .from("room_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("room_slug", event.room?.name)
        .is("ended_at", null);
    }

    if (event.event === "participant_joined") {
      await fetch(`${supabaseUrl}/rest/v1/attendance_events`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          room_slug: event.room?.name,
          participant_identity: event.participant?.identity,
          participant_name: event.participant?.name ?? null,
          event_type: "joined",
        }),
      });

      const { data: session } = await supabaseAdmin
        .from("room_sessions")
        .select("id, joins_count, peak_attendance")
        .eq("room_slug", event.room?.name)
        .is("ended_at", null)
        .single();

      if (session) {
        const newJoins = (session.joins_count ?? 0) + 1;
        const { count: currentCount } = await supabaseAdmin
          .from("attendance_events")
          .select("*", { count: "exact", head: true })
          .eq("room_slug", event.room?.name)
          .eq("event_type", "joined");

        await supabaseAdmin
          .from("room_sessions")
          .update({
            joins_count: newJoins,
            peak_attendance: Math.max(session.peak_attendance ?? 0, currentCount ?? 0),
          })
          .eq("id", session.id);
      }
    }

    if (event.event === "participant_left") {
      await fetch(`${supabaseUrl}/rest/v1/attendance_events`, {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          room_slug: event.room?.name,
          participant_identity: event.participant?.identity,
          participant_name: event.participant?.name ?? null,
          event_type: "left",
        }),
      });

      const { data: session } = await supabaseAdmin
        .from("room_sessions")
        .select("id, leaves_count")
        .eq("room_slug", event.room?.name)
        .is("ended_at", null)
        .single();

      if (session) {
        await supabaseAdmin
          .from("room_sessions")
          .update({ leaves_count: (session.leaves_count ?? 0) + 1 })
          .eq("id", session.id);
      }
    }

    return Response.json({ ok: true });
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }
}
