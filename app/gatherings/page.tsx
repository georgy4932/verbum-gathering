import Link from "next/link";
import { listGatherings } from "@/app/actions/gatherings";
import type { Gathering } from "@/lib/types/domain";

export const dynamic = "force-dynamic";

export default async function GatheringsPage() {
  const gatherings = await listGatherings("public");

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--stone)", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12, marginBottom: 8 }}>
              Gatherings
            </p>
            <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", margin: 0, lineHeight: 1.1, color: "var(--cream)" }}>
              Gather with others
            </h1>
          </div>
          <Link href="/gatherings/new" style={{
            minHeight: 40,
            padding: "0 1.2rem",
            borderRadius: 999,
            border: "1px solid var(--companion)",
            color: "var(--companion)",
            textDecoration: "none",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
          }}>
            + New gathering
          </Link>
        </div>

        {gatherings.length === 0 ? (
          <div style={{
            padding: "40px 32px",
            borderRadius: 20,
            border: "1px solid var(--faint)",
            background: "var(--card-surface)",
            textAlign: "center",
          }}>
            <p style={{ color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
              No gatherings yet. Be the first to create one.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {gatherings.map((g: Gathering) => (
              <Link
                key={g.id}
                href={`/gatherings/${g.slug}`}
                style={{
                  display: "block",
                  padding: "20px 24px",
                  borderRadius: 20,
                  border: "1px solid var(--faint)",
                  background: "var(--card-surface)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "var(--cream)" }}>{g.name}</h2>
                    {g.description && (
                      <p style={{ margin: "0 0 10px", color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                        {g.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      {g.passage_ref && (
                        <span style={{ fontSize: 12, color: "var(--stone)", fontStyle: "italic" }}>{g.passage_ref}</span>
                      )}
                      <span style={{ fontSize: 12, color: "var(--stone)", opacity: 0.5 }}>
                        {g.member_count} {g.member_count === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--stone)", whiteSpace: "nowrap", opacity: 0.5, flexShrink: 0 }}>
                    {g.visibility}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
