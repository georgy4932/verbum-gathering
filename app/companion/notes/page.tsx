import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/profile";
import { getAllNotesByUser } from "@/lib/db/companion";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Reflections — Companion",
};

export default async function CompanionNotesPage() {
  const { user } = await getCurrentUserProfile();
  if (!user) redirect("/sign-in");

  const notes = await getAllNotesByUser(user.id);

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ padding: "3rem 0 2.5rem" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--companion)", display: "block", marginBottom: 14 }}>
            Companion — My Reflections
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", marginBottom: 14 }}>
            Your private formation record.
          </h1>
          <p style={{ fontSize: "0.95rem", color: "var(--stone)", lineHeight: 1.75 }}>
            Notes written during reading. Anchored to passages. Visible only to you.
          </p>
        </div>

        {notes.length === 0 ? (
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
              "I have stored up your word in my heart."
            </p>
            <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--stone)", display: "block", marginBottom: 24 }}>
              Psalm 119:11
            </span>
            <Link href="/companion/read" style={{ fontSize: 13, color: "var(--companion)" }}>
              Open a passage to begin →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {notes.map((note) => {
              const date = new Date(note.created_at).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              });
              return (
                <Link
                  key={note.id}
                  href={`/companion/read/${passageRefToRoute(note.passage_ref)}`}
                  style={{
                    display: "block",
                    padding: "22px 26px",
                    borderRadius: 14,
                    border: "1px solid var(--faint)",
                    background: "var(--bg1)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{
                      fontFamily: "'IM Fell English', serif",
                      fontSize: "1rem",
                      color: "var(--companion)",
                      letterSpacing: "0.02em",
                    }}>
                      {note.passage_ref}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--stone)", whiteSpace: "nowrap" }}>
                      {date}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "0.92rem",
                    color: "var(--muted)",
                    lineHeight: 1.75,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {note.body}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// Convert "John 3" → "john/3", "1 Corinthians 13" → "1-corinthians/13"
function passageRefToRoute(ref: string): string {
  const parts = ref.split(" ");
  const chapter = parts.pop() ?? "1";
  const bookName = parts.join(" ");
  const bookSlug = bookName
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `${bookSlug}/${chapter}`;
}
