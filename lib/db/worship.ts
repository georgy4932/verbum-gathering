import { supabase } from "@/lib/supabase";
import type { WorshipSet, WorshipSetWithMoments, DevotionalPractice } from "@/lib/types/domain";

export async function getPublishedWorshipSets(): Promise<WorshipSet[]> {
  const { data } = await supabase
    .from("worship_sets")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as WorshipSet[];
}

export async function getWorshipSetBySlug(slug: string): Promise<WorshipSetWithMoments | null> {
  const { data: set } = await supabase
    .from("worship_sets")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!set) return null;

  const { data: moments } = await supabase
    .from("worship_moments")
    .select("*")
    .eq("set_id", set.id)
    .order("position", { ascending: true });

  return { ...(set as WorshipSet), moments: moments ?? [] };
}

export async function getPublishedPractices(): Promise<DevotionalPractice[]> {
  const { data } = await supabase
    .from("devotional_practices")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as DevotionalPractice[];
}
