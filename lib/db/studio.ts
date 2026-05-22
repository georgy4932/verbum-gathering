import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Teaching, TeachingSeries, TeachingWithSeries } from "@/lib/types/domain";

export async function getPublishedTeachings(): Promise<Teaching[]> {
  const { data } = await supabase
    .from("teachings")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return (data ?? []) as Teaching[];
}

export async function getTeachingBySlug(slug: string): Promise<TeachingWithSeries | null> {
  const { data } = await supabase
    .from("teachings")
    .select("*, series:teaching_series(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  const raw = data as unknown as Teaching & { series: TeachingSeries | null };
  return { ...raw, series: raw.series ?? null };
}

export async function getPublishedSeries(): Promise<TeachingSeries[]> {
  const { data } = await supabase
    .from("teaching_series")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  return (data ?? []) as TeachingSeries[];
}

// Returns the teaching regardless of published state (for minister editing their own drafts).
// Must be called from a server context with a user-aware client.
export async function getTeachingBySlugForEdit(
  slug: string,
  userId: string
): Promise<TeachingWithSeries | null> {
  const serverSupabase = await createSupabaseServerClient();
  const { data } = await serverSupabase
    .from("teachings")
    .select("*, series:teaching_series(*)")
    .eq("slug", slug)
    .eq("minister_id", userId)
    .maybeSingle();
  if (!data) return null;
  const raw = data as unknown as Teaching & { series: TeachingSeries | null };
  return { ...raw, series: raw.series ?? null };
}

export async function getMinisterSeries(userId: string): Promise<TeachingSeries[]> {
  const serverSupabase = await createSupabaseServerClient();
  const { data } = await serverSupabase
    .from("teaching_series")
    .select("*")
    .eq("minister_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as TeachingSeries[];
}

export async function getSeriesBySlug(slug: string): Promise<
  (TeachingSeries & { teachings: Teaching[] }) | null
> {
  const { data: series } = await supabase
    .from("teaching_series")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!series) return null;

  const { data: teachings } = await supabase
    .from("teachings")
    .select("*")
    .eq("series_id", series.id)
    .eq("is_published", true)
    .order("published_at", { ascending: true });

  return { ...(series as TeachingSeries), teachings: (teachings ?? []) as Teaching[] };
}
