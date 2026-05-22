import { supabase } from "@/lib/supabase";
import type { LiveRoom, FellowshipRoom, Devotion } from "@/lib/types/domain";

// Re-export domain types so existing imports continue working.
export type { LiveRoom, FellowshipRoom, Devotion };

export async function getLiveRooms(): Promise<LiveRoom[]> {
  const { data, error } = await supabase
    .from("live_rooms")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getLiveRooms error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getLiveRoomBySlug(slug: string): Promise<LiveRoom | null> {
  const { data, error } = await supabase
    .from("live_rooms")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("getLiveRoomBySlug error:", error.message);
    return null;
  }

  return data;
}

export async function getFellowshipRooms(): Promise<FellowshipRoom[]> {
  const { data, error } = await supabase
    .from("fellowship_rooms")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getFellowshipRooms error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getTodayDevotion(): Promise<Devotion | null> {
  const { data, error } = await supabase
    .from("devotions")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("getTodayDevotion error:", error.message);
    return null;
  }

  return data;
}
