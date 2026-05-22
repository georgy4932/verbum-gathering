import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_BY_SLUG, formatPassageRef } from "@/lib/bible/books";
import { getPassageText, isValidVersion, type BibleVersion } from "@/lib/bible/api-bible";
import { getCurrentUserProfile } from "@/lib/profile";
import { getNotesForPassage, getPassageSavedStatus, getThreadForPassage } from "@/lib/db/companion";
import NoteEditor from "@/components/companion/note-editor";
import AICompanion from "@/components/companion/ai-companion";
import SavePassageButton from "./save-passage-button";
import TranslationSelector from "@/components/companion/translation-selector";

export const dynamic = "force-dynamic";

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
  searchParams,
}: {
  params: Promise<{ book: string; chapter: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const [{ book: bookSlug, chapter: chapterStr }, sp] = await Promise.all([params, searchParams]);
  const chapter = parseInt(chapterStr, 10);

  const bookData = BOOK_BY_SLUG.get(bookSlug);
  if (!bookData || isNaN(chapter) || chapter < 1 || chapter > bookData.chapters) notFound();

  const passageRef = formatPassageRef(bookSlug, chapter);
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < bookData.chapters ? chapter + 1 : null;

  // Resolve translation: URL param ?v= > profile preference > KJV
  const { user, profile } = await getCurrentUserProfile();
  const profileVersion = (profile as { preferred_bible_version?: string } | null)?.preferred_bible_version ?? 'KJV';
  const requestedVersion: BibleVersion = isValidVersion(sp.v) ? sp.v : (isValidVersion(profileVersion) ? profileVersion : 'KJV');

  const passageData = await getPassageText(bookSlug, chapter, requestedVersion);

  const [notes, isSaved, thread] = user
    ? await Promise.all([
        getNotesForPassage(user.id, passageRef),
        getPassageSavedStatus(user.id, passageRef),
        getThreadForPassage(user.id, passageRef),
      ])
    : [[], false, null];

  const servedVersion: BibleVersion = passageData?.version ?? requestedVersion;
  const wasFallback = passageData !== null && servedVersion !== requestedVersion;
  const apiKeyMissing = !process.env.BIBLE_API_KEY;

  return (
    <main style={{ padding: "0 1.25rem 5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ padding: "2rem 0 2rem", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Link href="/companion" style={{ fontSize: 12, color: "var(--stone)" }}>Companion</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <Link href="/companion/read" style={{ fontSize: 12, color: "var(--stone)" }}>Scripture</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <Link href={`/companion/read/${bookSlug}/1`} style={{ fontSize: 12, color: "var(--stone)" }}>{bookData.name}</Link>
          <span style={{ color: "var(--faint2)" }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Chapter {chapter}</span>
        </div>

        {/* Title row + translation selector */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <h1 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: "clamp(2rem, 5vw, 3.4rem)",
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            margin: 0,
          }}>
            {passageRef}
          </h1>
          <div style={{ paddingTop: 10, flexShrink: 0 }}>
            <TranslationSelector current={servedVersion} isAuthenticated={!!user} />
          </div>
        </div>

        {/* Soft notices — never louder than the text */}
        {wasFallback && (
          <p style={{ fontSize: 12, color: "var(--stone)", marginBottom: 20, fontStyle: "italic", opacity: 0.75 }}>
            {requestedVersion} is not yet available — showing {servedVersion}.
          </p>
        )}
        {apiKeyMissing && requestedVersion === 'KJV' && (
          <p style={{ fontSize: 11, color: "var(--stone)", marginBottom: 20, opacity: 0.5 }}>
            Set BIBLE_API_KEY in .env.local to unlock all translations.
          </p>
        )}

        {/* Scripture — the primary voice, always */}
        <div style={{ marginBottom: 48 }}>
          {passageData ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {passageData.verses.map((v) => (
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
                  {v.text}
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

        {/* Chapter nav + save — version preserved across chapters */}
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
              <Link href={`/companion/read/${bookSlug}/${prevChapter}?v=${servedVersion}`} style={navButtonStyle}>
                ← Ch {prevChapter}
              </Link>
            ) : (
              <span style={{ ...navButtonStyle, opacity: 0.3, cursor: "default" }}>← Previous</span>
            )}
            {nextChapter ? (
              <Link href={`/companion/read/${bookSlug}/${nextChapter}?v=${servedVersion}`} style={navButtonStyle}>
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

        {/* Notes */}
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

        {/* AI Companion — always subordinate */}
        {user && passageData && (
          <div style={{ marginTop: 48 }}>
            <AICompanion
              passageRef={passageRef}
              passageText={passageData.fullText}
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
