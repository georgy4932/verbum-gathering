import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function StudiesPage() {
  const { data } = await supabase
    .from("studies")
    .select("slug, title, description, host_name");

  const studies = data ?? [];

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em" }}>
          Studies
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: 16, lineHeight: 1.05 }}>
          Bible studies
        </h1>

        <p style={{ opacity: 0.75, marginBottom: 40, lineHeight: 1.7, maxWidth: 720 }}>
          Follow structured studies led by trusted voices. Return regularly and grow deeper in Scripture.
        </p>

        <div style={{ display: "grid", gap: 20 }}>
          {studies.length === 0 ? (
            <p style={{ opacity: 0.6 }}>No studies available yet.</p>
          ) : (
            studies.map((study) => (
              <Link
                key={study.slug}
                href={`/gathering/studies/${study.slug}`}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20,
                  padding: 24,
                  textDecoration: "none",
                  color: "inherit",
                  background: "rgba(255,255,255,0.03)",
                  display: "block",
                }}
              >
                <h2 style={{ margin: "0 0 10px", fontSize: "1.3rem" }}>{study.title}</h2>
                <p style={{ opacity: 0.75, margin: "0 0 12px", lineHeight: 1.7 }}>{study.description}</p>
                <small style={{ opacity: 0.5 }}>Led by {study.host_name}</small>
              </Link>
            ))
          )}
        </div>

        <p style={{ textAlign: "center", opacity: 0.45, marginTop: 40, fontSize: "0.9rem" }}>
          Return regularly. Grow deeper in Scripture.
        </p>

      </div>
    </main>
  );
}
