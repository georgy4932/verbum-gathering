import { supabase } from "@/lib/supabase";

export type LiveRoom = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: "live" | "soon" | "scheduled";
  time_label: string;
  host: string;
  kind: "prayer" | "worship" | "study";
  sort_order: number;
};

export type FellowshipRoom = {
  id: string;
  slug: string;
  name: string;
  description: string;
  members_label: string;
  sort_order: number;
};

export type Devotion = {
  id: string;
  title: string;
  scripture: string;
  reflection: string;
  prayer: string;
  published_at: string;
};

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
