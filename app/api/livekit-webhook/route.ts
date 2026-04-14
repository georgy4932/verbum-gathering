import { WebhookReceiver } from "livekit-server-sdk";

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
    }

    return Response.json({ ok: true });
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }
}
