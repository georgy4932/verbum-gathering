"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReportContentType = "thread" | "reply" | "prayer_request";

export type ReportResult =
  | { success: true }
  | { success: false; error: "not_authenticated" | "already_reported" | "not_found" | "self_report" | "failed" };

export async function reportContent(
  contentType: ReportContentType,
  contentId: string,
  category: string,
  note: string | null,
): Promise<ReportResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  // file_content_report() is SECURITY DEFINER and derives reported_user_id
  // and gathering_id from the content itself. No caller-supplied context.
  const { error } = await supabase.rpc("file_content_report", {
    p_content_type: contentType,
    p_content_id: contentId,
    p_category: category,
    p_note: note || null,
  });

  if (error) {
    // Unique constraint violation: partial index on (reporter_id, content_id)
    // where status IN ('open', 'under_review')
    if (error.code === "23505") return { success: false, error: "already_reported" };
    if (error.message?.includes("not found")) return { success: false, error: "not_found" };
    if (error.message?.includes("own content")) return { success: false, error: "self_report" };
    return { success: false, error: "failed" };
  }

  return { success: true };
}
