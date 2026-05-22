import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_BY_SLUG, slugToApiParam, formatPassageRef } from "@/lib/bible/books";
import { getCurrentUserProfile } from "@/lib/profile";
import { getNotesForPassage, getPassageSavedStatus, getThreadForPassage } from "@/lib/db/companion";
import NoteEditor from "@/components/companion/note-editor";
import AICompanion from "@/components/companion/ai-companion";
import SavePassageButton from "./save-passage-button";

export const dynamic = "force-dynamic";

interface BibleApiVerse {
  verse: number;
  text: string;
}

interface BibleApiResponse {
  reference: string;
  verses: BibleApiVerse[];
  text: string;
  error?: string;
}

async function fetchChapter(bookSlug: string, chapter: number): Promise<BibleApiResponse | null> {
  const apiParam = `${slugToApiParam(bookSlug)}+${chapter}`;
  try {
    const res = await fetch(`https://bible-api.com/${apiParam}?translation=kjv`, {
      next: { revalidate: 86400 }, // cache for 24h — KJV text never changes
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data as BibleApiResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book, chapter } = await params;
  const bookData = BOOK_BY_SLUG.get(book);
  if (!bookData) return { title: "Companion" };
  return { title: `${bookData.name} ${chapter} — Companion` };
}

export default async function PassagePage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book: bookSlug, chapter: chapterStr } = await params;
  const chapter = parseInt(chapterStr, 10);

  const bookData = BOOK_BY_SLUG.get(bookSlug);
  if (!bookData || isNaN(chapter) || chapter < 1 || chapter > bookData.chapters) {
    notFound();
  }

  const passageRef = formatPassageRef(bookSlug, chapter);
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < bookData.chapters ? chapter + 1 : null;

  const [bibleData, { user }] = await Promise.all([
    fetchChapter(bookSlug, chapter),
    getCurrentUserProfile(),
  ]);

  const [notes, isSaved, thread] = user
    ? await Promise.all([
        getNotesForPassage(user.id, passageRef),
        getPassageSavedStatus(user.id, passageRef),
        getThreadForPassage(user.id, passageRef),
      ])
    : [[], false, null];

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ padding: "2rem 0 2.5rem", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/companion" style={{ fontSize: 12, color: "var(--stone)" }}>Companion</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <Link href="/companion/read" style={{ fontSize: 12, color: "var(--stone)" }}>Scripture</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <Link href={`/companion/read/${bookSlug}/1`} style={{ fontSize: 12, color: "var(--stone)" }}>{bookData.name}</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Chapter {chapter}</span>
        </div>

        {/* Passage heading */}
        <h1 style={{
          fontFamily: "'IM Fell English', serif",
          fontSize: "clamp(2rem, 5vw, 3.4rem)",
          lineHeight: 1.05,
          marginBottom: 36,
          letterSpacing: "0.01em",
        }}>
          {passageRef}
        </h1>

        {/* Bible text — Scripture is the primary voice */}
        <div style={{ marginBottom: 48 }}>
          {bibleData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {bibleData.verses.map((v) => (
                <p key={v.verse} style={{
                  fontFamily: "'IM Fell English', serif",
                  fontSize: "1.2rem",
                  lineHeight: 2.1,
                  color: "var(--cream)",
                  margin: 0,
                }}>
                  <sup style={{
                    fontSize: "0.65rem",
                    color: "var(--stone)",
                    fontFamily: "'DM Sans', sans-serif",
                    verticalAlign: "super",
                    marginRight: 4,
                    letterSpacing: "0.04em",
                  }}>
                    {v.verse}
                  </sup>
                  {v.text.trim()}
                </p>
              ))}
            </div>
          ) : (
            <div style={{ padding: "32px 0" }}>
              <p style={{ color: "var(--stone)", fontStyle: "italic" }}>
                Unable to load this passage. Check your connection and try again.
              </p>
            </div>
          )}
        </div>

        {/* Chapter navigation + save */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 0",
          borderTop: "1px solid var(--faint)",
          borderBottom: "1px solid var(--faint)",
          marginBottom: 48,
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            {prevChapter ? (
              <Link
                href={`/companion/read/${bookSlug}/${prevChapter}`}
                style={navButtonStyle}
              >
                ← Ch {prevChapter}
              </Link>
            ) : (
              <span style={{ ...navButtonStyle, opacity: 0.3, cursor: "default" }}>← Previous</span>
            )}
            {nextChapter ? (
              <Link
                href={`/companion/read/${bookSlug}/${nextChapter}`}
                style={navButtonStyle}
              >
                Ch {nextChapter} →
              </Link>
            ) : (
              <span style={{ ...navButtonStyle, opacity: 0.3, cursor: "default" }}>Next →</span>
            )}
          </div>

          {user ? (
            <SavePassageButton passageRef={passageRef} initialSaved={isSaved} />
          ) : (
            <Link href="/sign-in" style={{ fontSize: 12, color: "var(--stone)" }}>
              Sign in to save →
            </Link>
          )}
        </div>

        {/* Notes — private formation record */}
        {user ? (
          <NoteEditor passageRef={passageRef} existingNotes={notes} />
        ) : (
          <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 32 }}>
            <p style={{ fontSize: 14, color: "var(--stone)", lineHeight: 1.7 }}>
              <Link href="/sign-in" style={{ color: "var(--companion)" }}>Sign in</Link>
              {" "}to write reflections on this passage.
            </p>
          </div>
        )}

        {/* AI Companion — always visually subordinate to the text */}
        {user && bibleData && (
          <div style={{ marginTop: 48 }}>
            <AICompanion
              passageRef={passageRef}
              passageText={bibleData.text}
              initialMessages={thread?.messages ?? []}
              initialThreadId={thread?.id ?? null}
            />
          </div>
        )}

      </div>
    </main>
  );
}

const navButtonStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid var(--faint)",
  textDecoration: "none",
  letterSpacing: "0.04em",
};
