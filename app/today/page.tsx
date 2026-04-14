import { supabase } from "@/lib/supabase";
export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { data, error } = await supabase
    .from("devotions")
    .select("title, scripture, reflection, prayer")
    .order("published_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main style={{ padding: "4rem 1.25rem" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <h1>Today</h1>
          <p>Unable to load today's devotion.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <p style={{ opacity: 0.6, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Today
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 36, lineHeight: 1.05 }}>
          {data.title}
        </h1>

        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>

          <section style={{ padding: "28px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(94,167,115,0.04)", borderLeft: "3px solid rgba(94,167,115,0.4)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5ea773", marginBottom: 14 }}>
              Scripture
            </p>
            <p style={{ fontFamily: "'IM Fell English', serif", fontStyle: "italic", fontSize: "1.2rem", lineHeight: 1.9, opacity: 0.92 }}>
              {data.scripture}
            </p>
          </section>

          <section style={{ padding: "28px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, marginBottom: 14 }}>
              Reflection
            </p>
            <p style={{ opacity: 0.86, lineHeight: 1.85, fontSize: "1.05rem" }}>
              {data.reflection}
            </p>
          </section>

          <section style={{ padding: "28px 32px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, marginBottom: 14 }}>
              Prayer
            </p>
            <p style={{ opacity: 0.86, lineHeight: 1.85, fontSize: "1.05rem" }}>
              {data.prayer}
            </p>
          </section>

        </div>
              <div style={{
          marginTop: 40,
          padding: 24,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)"
        }}>
          <p style={{ opacity: 0.7, marginBottom: 12 }}>
            Pray this with others
          </p>
          <a href="/live/evening-prayer" style={{ color: "#c8a96a", fontSize: 15, fontWeight: 500 }}>
            Enter a live gathering →
          </a>
        </div>

      </div>
    </main>
  );
}

  );
}
