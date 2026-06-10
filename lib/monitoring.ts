import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GatheringEventType =
  | "gathering_created"
  | "gathering_joined"
  | "gathering_left"
  | "prayer_request_created"
  | "prayer_acknowledged"
  | "private_access_denied"
  | "study_post_created"
  | "discussion_thread_created"
  | "live_session_scheduled"
  | "companion_note_published";

/**
 * Fire-and-forget audit log. Never await — never block the action response.
 * Requires the caller to already have an authenticated server context (cookie session).
 */
export function logGatheringEvent(
  type: GatheringEventType,
  userId: string,
  gatheringId: string | null,
  metadata?: Record<string, unknown>,
): void {
  void (async () => {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.from("gathering_events").insert({
        event_type: type,
        user_id: userId,
        gathering_id: gatheringId,
        metadata: metadata ?? null,
      });
    } catch {
      // Monitoring must never crash the action
    }
  })();
}

/**
 * Check whether a user has a feature flag granted.
 * Returns false if the user is not authenticated or the flag is absent.
 */
export async function hasFeatureFlag(
  userId: string,
  flag: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("flag")
      .eq("user_id", userId)
      .eq("flag", flag)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Whether the gatherings-create feature is currently gated.
 * Set GATHERINGS_CREATE_GATED=true in env to enable the gate.
 */
export function isGatheringsCreateGated(): boolean {
  return process.env.GATHERINGS_CREATE_GATED === "true";
}
