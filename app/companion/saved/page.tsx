import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { getSavedPassagesByUser } from "@/lib/db/companion";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Saved Passages — Companion",
};

export default async function CompanionSavedPage() {
  const { user } = await getCurrentUserProfile();
  if (!user) redirect("/sign-in");

  const saved = await getSavedPassagesByUser(user.id);

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ padding: "3rem 0 2.5rem" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--companion)", display: "block", marginBottom: 14 }}>
            Companion — Saved Passages
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: 14 }}>
            Passages you have returned to.
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--stone)", lineHeight: 1.75 }}>
            A quiet library, built through reading — not curation.
          </p>
        </div>

        {saved.length === 0 ? (
          <div style={{
            padding: "48px 32px",
            textAlign: "center",
            border: "1px solid var(--faint)",
            borderRadius: 16,
            background: "var(--bg1)",
          }}>
            <p style={{
              fontFamily: "'IM Fell English', serif",
              fontStyle: "italic",
              fontSize: "1.1rem",
              color: "var(--muted)",
              lineHeight: 1.85,
              marginBottom: 20,
            }}>
              "Your word is a lamp to my feet and a light to my path."
            </p>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 24 }}>
              Psalm 119:105
            </span>
            <Link href="/companion/read" style={{ fontSize: 13, color: "var(--companion)" }}>
              Open Scripture to begin →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 16, overflow: "hidden", border: "1px solid var(--faint)" }}>
            {saved.map((p) => {
              const date = new Date(p.saved_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              const route = passageRefToRoute(p.passage_ref);
              return (
                <Link
                  key={p.id}
                  href={`/companion/read/${route}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    padding: "18px 24px",
                    background: "var(--bg1)",
                    textDecoration: "none",
                    color: "inherit",
                    borderBottom: "1px solid var(--faint)",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{ fontFamily: "'IM Fell English', serif", fontSize: "1rem", color: "var(--companion)" }}>
                    {p.passage_ref}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--stone)", whiteSpace: "nowrap" }}>
                    {date}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function passageRefToRoute(ref: string): string {
  const parts = ref.split(" ");
  const chapter = parts.pop() ?? "1";
  const bookName = parts.join(" ");
  const bookSlug = bookName.toLowerCase().replace(/\s+/g, "-");
  return `${bookSlug}/${chapter}`;
}
