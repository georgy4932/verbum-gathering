import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDevotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requirePlatformAdmin();

  const { saved, error } = await searchParams;

  async function saveDevotion(formData: FormData) {
    "use server";
    // Re-check inside the action — the page-level check is UX only.
    await requirePlatformAdmin();

    const title = formData.get("title")?.toString().trim() ?? "";
    const scripture = formData.get("scripture")?.toString().trim() ?? "";
    const reflection = formData.get("reflection")?.toString().trim() || null;
    const prayer = formData.get("prayer")?.toString().trim() || null;

    if (!title || !scripture) {
      redirect("/admin/devotions?error=missing_fields");
    }

    const supabase = await createSupabaseServerClient();
    const { error: dbError } = await supabase.from("devotions").insert({
      title,
      scripture,
      reflection,
      prayer,
      published_at: new Date().toISOString(),
    });

    if (dbError) redirect("/admin/devotions?error=db");

    redirect("/admin/devotions?saved=1");
  }

  const notice =
    saved === "1"
      ? "Devotion saved. It is now live on the Today page."
      : error === "missing_fields"
        ? "Title and scripture are required."
        : error === "db"
          ? "Unable to save devotion. Please try again."
          : null;

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Admin
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0 32px", lineHeight: 1.05 }}>
          Add a devotion
        </h1>

        <form action={saveDevotion} style={{ display: "grid", gap: 16 }}>
          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Title</p>
            <input
              name="title"
              placeholder="Walk in the light you have"
              required
              style={{
                width: "100%",
                minHeight: 46,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0 0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Scripture</p>
            <textarea
              name="scripture"
              placeholder={`"Your word is a lamp to my feet." — Psalm 119:105`}
              rows={3}
              required
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Reflection</p>
            <textarea
              name="reflection"
              placeholder="Write the reflection..."
              rows={6}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <p style={{ opacity: 0.6, margin: "0 0 6px", fontSize: "0.85rem" }}>Prayer</p>
            <textarea
              name="prayer"
              placeholder="Write the closing prayer..."
              rows={4}
              style={{
                width: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.02)",
                color: "inherit",
                padding: "0.9rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              minHeight: 46,
              padding: "0 1.2rem",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "inherit",
              cursor: "pointer",
              justifySelf: "start",
            }}
          >
            Save devotion
          </button>

          {notice && (
            <p style={{ opacity: 0.75, margin: 0, lineHeight: 1.6 }}>{notice}</p>
          )}
        </form>
      </div>
    </main>
  );
}
