import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_BY_SLUG, formatPassageRef } from "@/lib/bible/books";
import { getPassageText, isValidVersion, type BibleVersion } from "@/lib/bible/api-bible";
import { getCurrentUserProfile } from "@/lib/profile";
import { getNotesForPassage, getPassageSavedStatus, getThreadForPassage } from "@/lib/db/companion";
import { getHighlightsForChapter } from "@/app/actions/companion";
import { listMyGatheringsForSharing } from "@/app/actions/gatherings";
import NoteEditor from "@/components/companion/note-editor";
import AICompanion from "@/components/companion/ai-companion";
import SavePassageButton from "./save-passage-button";
import { ReaderControls } from "@/components/companion/reader-controls";
import { RedLetterController } from "@/components/companion/red-letter-controller";
import PassageText from "@/components/companion/passage-text";

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
  const typedProfile = profile as { preferred_bible_version?: string; show_red_letter?: boolean } | null;
  const profileVersion = typedProfile?.preferred_bible_version ?? 'KJV';
  const showRedLetter = typedProfile?.show_red_letter ?? true;
  const requestedVersion: BibleVersion = isValidVersion(sp.v) ? sp.v : (isValidVersion(profileVersion) ? profileVersion : 'KJV');

  const passageData = await getPassageText(bookSlug, chapter, requestedVersion);

  const [notes, isSaved, thread, highlightMap, memberGatherings] = user
    ? await Promise.all([
        getNotesForPassage(user.id, passageRef),
        getPassageSavedStatus(user.id, passageRef),
        getThreadForPassage(user.id, passageRef),
        getHighlightsForChapter(bookData.name, chapter),
        listMyGatheringsForSharing(),
      ])
    : [[], false, null, new Map<number, string>(), []];

  const servedVersion: BibleVersion = passageData?.version ?? requestedVersion;
  const wasFallback = passageData !== null && servedVersion !== requestedVersion;
  if (process.env.NODE_ENV === 'development' && !process.env.BIBLE_API_KEY) {
    console.warn('[Companion] BIBLE_API_KEY not set — only KJV via bible-api.com is available.');
  }
  const hasRedLetterContent = passageData?.verses.some((v) => v.hasRedLetter) ?? false;

  // Merge highlight data and structural formatting into verse list
  const verses = passageData?.verses.map((v) => ({
    num: v.verse,
    text: v.text,
    lines: v.lines,
    isPoetry: v.isPoetry,
    isParagraphStart: v.isParagraphStart,
    isStanzaBreak: v.isStanzaBreak,
    highlightColor: highlightMap.get(v.verse),
  })) ?? [];

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

        {/* Reader controls — reference, verse picker, version, red letter */}
        <ReaderControls
          bookSlug={bookSlug}
          bookName={bookData.name}
          chapter={chapter}
          currentVersion={servedVersion}
          isAuthenticated={!!user}
          showRedLetter={showRedLetter}
          hasRedLetterContent={hasRedLetterContent}
        />

        {/* Soft notices */}
        {wasFallback && (
          <p style={{ fontSize: 12, color: "var(--stone)", marginBottom: 20, fontStyle: "italic", opacity: 0.75 }}>
            {requestedVersion} is not yet available — showing {servedVersion}.
          </p>
        )}

        {/* Scripture — primary voice */}
        <div style={{ marginBottom: 48 }}>
          {passageData ? (
            <RedLetterController initialEnabled={showRedLetter}>
              <PassageText
                bookSlug={bookSlug}
                bookName={bookData.name}
                chapter={chapter}
                verses={verses}
                translation={servedVersion}
                isAuthenticated={!!user}
              />
            </RedLetterController>
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
            <Link href="/auth/signin" style={{ fontSize: 12, color: "var(--stone)" }}>
              Sign in to save →
            </Link>
          )}
        </div>

        {/* Notes */}
        <div id="note-editor">
          {user ? (
            <NoteEditor
              passageRef={passageRef}
              existingNotes={notes}
              memberGatherings={memberGatherings}
              scriptureContext={passageData ? {
                translationVersion: servedVersion,
                scriptureTextSnapshot: passageData.fullText,
              } : undefined}
            />
          ) : (
            <div style={{ borderTop: "1px solid var(--faint)", paddingTop: 32 }}>
              <p style={{ fontSize: 14, color: "var(--stone)", lineHeight: 1.7 }}>
                <Link href="/auth/signin" style={{ color: "var(--companion)" }}>Sign in</Link>
                {" "}to write reflections on this passage.
              </p>
            </div>
          )}
        </div>

        {/* AI Companion */}
        {user && passageData && (
          <div id="ai-companion" style={{ marginTop: 48 }}>
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
