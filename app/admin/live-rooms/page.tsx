import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLiveRoomsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("host_profiles")
    .select("is_host")
    .eq("id", user.id)
    .single();

  if (!profile?.is_host) {
    redirect("/");
  }

  const { data: rooms } = await supabase
    .from("live_rooms")
    .select("slug, title, starts_at, ends_at, is_live, host_user_id")
    .order("starts_at", { ascending: true });

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1>Broadcast operations</h1>

        <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
          {(rooms ?? []).map((room) => (
            <article
              key={room.slug}
              style={{
                padding: 20,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>{room.title}</h2>
              <p>Slug: {room.slug}</p>
              <p>Starts: {room.starts_at ?? "Not scheduled"}</p>
              <p>Ends: {room.ends_at ?? "Not scheduled"}</p>
              <p>Status: {room.is_live ? "Live now" : "Offline"}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
