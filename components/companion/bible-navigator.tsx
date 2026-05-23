'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS, type BibleBook } from '@/lib/bible/books';
import { getVerseCount } from '@/lib/bible/verse-counts';
import type { BibleVersion } from '@/lib/bible/api-bible';

const OT = BIBLE_BOOKS.filter((b) => b.testament === 'old');
const NT = BIBLE_BOOKS.filter((b) => b.testament === 'new');

type Step = 'book' | 'chapter' | 'verse';
const STEP_IDX: Record<Step, number> = { book: 0, chapter: 1, verse: 2 };

interface BibleNavigatorProps {
  currentBook: string;
  currentChapter: number;
  currentVerse?: number;
  currentVersion: BibleVersion;
  onClose: () => void;
}

export function BibleNavigator({
  currentBook,
  currentChapter,
  currentVerse,
  currentVersion,
  onClose,
}: BibleNavigatorProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('book');
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
  const [animKey, setAnimKey] = useState(0);
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sheetRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      goBack();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function go(nextStep: Step, forward: boolean) {
    setDir(forward ? 'fwd' : 'back');
    setAnimKey((k) => k + 1);
    setStep(nextStep);
  }

  function pickBook(book: BibleBook) {
    setSelectedBook(book);
    setSelectedChapter(null);
    go('chapter', true);
  }

  function pickChapter(ch: number) {
    setSelectedChapter(ch);
    go('verse', true);
  }

  function pickVerse(v: number) {
    const slug = selectedBook!.slug;
    const ch = selectedChapter!;
    onClose();

    if (slug === currentBook && ch === currentChapter) {
      // Same page — smooth scroll without a full navigation
      requestAnimationFrame(() => {
        const el = document.getElementById(`verse-${v}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            history.pushState(null, '', `#verse-${v}`);
            window.dispatchEvent(new CustomEvent('verse-navigate', { detail: { verse: v } }));
            el.classList.add('verse-arrived');
            setTimeout(() => el.classList.remove('verse-arrived'), 2400);
          }, 180);
        }
      });
    } else {
      router.push(`/companion/read/${slug}/${ch}?v=${currentVersion}#verse-${v}`);
    }
  }

  function goBack() {
    if (step === 'verse') { go('chapter', false); return; }
    if (step === 'chapter') { go('book', false); return; }
    onClose();
  }

  const verseCount = selectedBook && selectedChapter
    ? getVerseCount(selectedBook.slug, selectedChapter)
    : 30;

  const activeVerse =
    selectedBook?.slug === currentBook && selectedChapter === currentChapter
      ? currentVerse
      : undefined;

  return (
    <>
      <style>{`
        @keyframes nav-sheet-in  { from { transform:translateX(-50%) translateY(24px); opacity:.65; } to { transform:translateX(-50%) translateY(0); opacity:1; } }
        @keyframes step-slide-fwd  { from { opacity:.5; transform:translateX(22px); } to { opacity:1; transform:translateX(0); } }
        @keyframes step-slide-back { from { opacity:.5; transform:translateX(-22px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)' }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Go to passage"
        tabIndex={-1}
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 700, maxHeight: '88vh',
          zIndex: 491,
          background: 'var(--bg2)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -20px 80px rgba(0,0,0,0.8)',
          animation: 'nav-sheet-in 0.24s cubic-bezier(0.32,0,0.2,1)',
          outline: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 2, flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--faint2)' }} aria-hidden="true" />
        </div>

        {/* Header with breadcrumb */}
        <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: "'DM Sans', sans-serif", flexWrap: 'wrap' }}>
              <BreadcrumbItem
                label="Books"
                active={step === 'book'}
                clickable={step !== 'book'}
                onClick={() => go('book', false)}
              />
              {(step === 'chapter' || step === 'verse') && selectedBook && (
                <>
                  <Chevron />
                  <BreadcrumbItem
                    label={selectedBook.name}
                    active={step === 'chapter'}
                    clickable={step === 'verse'}
                    onClick={() => go('chapter', false)}
                  />
                </>
              )}
              {step === 'verse' && selectedChapter && (
                <>
                  <Chevron />
                  <BreadcrumbItem
                    label={`Ch ${selectedChapter}`}
                    active={true}
                    clickable={false}
                    onClick={() => {}}
                  />
                </>
              )}
            </div>

            <button
              onClick={onClose}
              aria-label="Close navigator"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Progress track */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
            {(['book', 'chapter', 'verse'] as Step[]).map((s) => (
              <div
                key={s}
                style={{
                  height: 2,
                  flex: 1,
                  borderRadius: 2,
                  background: STEP_IDX[s] <= STEP_IDX[step] ? 'var(--gold)' : 'var(--faint2)',
                  transition: 'background 0.25s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Animated content */}
        <div
          key={animKey}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 20px 44px',
            animation: `step-slide-${dir === 'fwd' ? 'fwd' : 'back'} 0.22s ease`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            WebkitOverflowScrolling: 'touch' as any,
          }}
        >
          {step === 'book' && (
            <>
              <SectionLabel>Old Testament</SectionLabel>
              <BookGrid books={OT} currentBook={currentBook} onSelect={pickBook} />
              <SectionLabel style={{ marginTop: 24 }}>New Testament</SectionLabel>
              <BookGrid books={NT} currentBook={currentBook} onSelect={pickBook} />
            </>
          )}

          {step === 'chapter' && selectedBook && (
            <ChapterGrid
              chapters={selectedBook.chapters}
              currentChapter={selectedBook.slug === currentBook ? currentChapter : 0}
              onSelect={pickChapter}
            />
          )}

          {step === 'verse' && selectedBook && selectedChapter && (
            <VerseGrid
              count={verseCount}
              currentVerse={activeVerse}
              onSelect={pickVerse}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ── Breadcrumb pieces ─────────────────────────────────────────────────────────
function BreadcrumbItem({ label, active, clickable, onClick }: { label: string; active: boolean; clickable: boolean; onClick: () => void }) {
  return (
    <button
      onClick={clickable ? onClick : undefined}
      disabled={!clickable && !active}
      style={{
        background: 'none', border: 'none',
        padding: '2px 4px',
        cursor: clickable ? 'pointer' : 'default',
        fontSize: 13,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: active ? 700 : 400,
        color: active ? 'var(--cream)' : clickable ? 'var(--companion)' : 'var(--stone)',
        borderRadius: 4,
        transition: 'color 0.12s',
      }}
    >
      {label}
    </button>
  );
}

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--faint2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 10, marginTop: 0, ...style }}>
      {children}
    </p>
  );
}

// ── Book grid ─────────────────────────────────────────────────────────────────
function BookGrid({ books, currentBook, onSelect }: { books: BibleBook[]; currentBook: string; onSelect: (b: BibleBook) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 6 }}>
      {books.map((b) => (
        <NavButton key={b.slug} active={b.slug === currentBook} onClick={() => onSelect(b)}>
          {b.name}
        </NavButton>
      ))}
    </div>
  );
}

// ── Chapter grid ──────────────────────────────────────────────────────────────
function ChapterGrid({ chapters, currentChapter, onSelect }: { chapters: number; currentChapter: number; onSelect: (ch: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6 }}>
      {Array.from({ length: chapters }, (_, i) => i + 1).map((ch) => (
        <NavButton key={ch} active={ch === currentChapter} onClick={() => onSelect(ch)} numeric>
          {ch}
        </NavButton>
      ))}
    </div>
  );
}

// ── Verse grid ────────────────────────────────────────────────────────────────
function VerseGrid({ count, currentVerse, onSelect }: { count: number; currentVerse?: number; onSelect: (v: number) => void }) {
  return (
    <>
      <p style={{ fontSize: 11, color: 'var(--stone)', margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.02em' }}>
        Tap a verse to navigate there
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 6 }}>
        {Array.from({ length: count }, (_, i) => i + 1).map((v) => (
          <NavButton key={v} active={v === currentVerse} onClick={() => onSelect(v)} numeric>
            {v}
          </NavButton>
        ))}
      </div>
    </>
  );
}

// ── Shared grid button ────────────────────────────────────────────────────────
function NavButton({ children, active, onClick, numeric = false }: {
  children: React.ReactNode; active: boolean; onClick: () => void; numeric?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,169,106,0.15)' : 'var(--bg3)',
        border: `1px solid ${active ? 'rgba(200,169,106,0.45)' : 'var(--faint)'}`,
        borderRadius: 9,
        padding: numeric ? '11px 4px' : '9px 8px',
        cursor: 'pointer',
        fontSize: numeric ? 14 : 12,
        fontFamily: "'DM Sans', sans-serif",
        color: active ? 'var(--gold)' : 'var(--muted)',
        fontWeight: active ? 700 : 400,
        textAlign: 'center',
        lineHeight: 1.3,
        minHeight: 44,
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
      }}
      onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(200,169,106,0.07)'; e.currentTarget.style.color = 'var(--cream)'; e.currentTarget.style.borderColor = 'rgba(200,169,106,0.2)'; } }}
      onMouseOut={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--faint)'; } }}
    >
      {children}
    </button>
  );
}
