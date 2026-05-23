'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS, type BibleBook } from '@/lib/bible/books';
import { getVerseCount } from '@/lib/bible/verse-counts';
import type { BibleVersion } from '@/lib/bible/api-bible';

const OT = BIBLE_BOOKS.filter((b) => b.testament === 'old');
const NT = BIBLE_BOOKS.filter((b) => b.testament === 'new');

type Step = 'book' | 'chapter' | 'verse';

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
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sheetRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (step === 'verse') { setStep('chapter'); return; }
      if (step === 'chapter') { setStep('book'); return; }
      onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  function pickBook(book: BibleBook) {
    setSelectedBook(book);
    setSelectedChapter(null);
    setStep('chapter');
  }

  function pickChapter(ch: number) {
    setSelectedChapter(ch);
    setStep('verse');
  }

  function pickVerse(v: number) {
    const slug = selectedBook!.slug;
    const ch = selectedChapter!;
    router.push(`/companion/read/${slug}/${ch}?v=${currentVersion}#verse-${v}`);
    onClose();
  }

  function goBack() {
    if (step === 'verse') { setStep('chapter'); return; }
    if (step === 'chapter') { setStep('book'); return; }
    onClose();
  }

  const headingLabel =
    step === 'book'    ? 'Go to Passage' :
    step === 'chapter' ? selectedBook!.name :
                         `${selectedBook!.name} ${selectedChapter}`;

  const verseCount = selectedBook && selectedChapter
    ? getVerseCount(selectedBook.slug, selectedChapter)
    : 30;

  // Highlight active verse only when we're on the same book+chapter
  const activeVerse =
    selectedBook?.slug === currentBook && selectedChapter === currentChapter
      ? currentVerse
      : undefined;

  return (
    <>
      <style>{`
        @keyframes nav-sheet-in {
          from { transform: translateX(-50%) translateY(20px); opacity: 0.6; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1;   }
        }
      `}</style>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={headingLabel}
        tabIndex={-1}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 700,
          maxHeight: '88vh',
          zIndex: 491,
          background: 'var(--bg2)',
          borderRadius: '20px 20px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -16px 64px rgba(0,0,0,0.75)',
          animation: 'nav-sheet-in 0.22s ease',
          outline: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--faint2)' }} aria-hidden="true" />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 14px', borderBottom: '1px solid var(--faint)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {step !== 'book' && (
              <button
                onClick={goBack}
                aria-label="Go back"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--companion)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                {step === 'verse' ? `Ch ${selectedChapter}` : 'Books'}
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif" }}>
              {headingLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigator"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', flexShrink: 0 }}>
          {(['book', 'chapter', 'verse'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                background: i <= ['book','chapter','verse'].indexOf(step)
                  ? 'var(--gold)'
                  : 'var(--faint2)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 40px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {step === 'book' && (
            <>
              <SectionLabel>Old Testament</SectionLabel>
              <BookGrid books={OT} currentBook={currentBook} onSelect={pickBook} />
              <SectionLabel style={{ marginTop: 22 }}>New Testament</SectionLabel>
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

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--stone)', marginBottom: 10, marginTop: 0, ...style }}>
      {children}
    </p>
  );
}

// ── Book grid ─────────────────────────────────────────────────────────────────
function BookGrid({
  books, currentBook, onSelect,
}: { books: BibleBook[]; currentBook: string; onSelect: (b: BibleBook) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 6 }}>
      {books.map((book) => {
        const active = book.slug === currentBook;
        return (
          <NavButton key={book.slug} active={active} onClick={() => onSelect(book)}>
            {book.name}
          </NavButton>
        );
      })}
    </div>
  );
}

// ── Chapter grid ──────────────────────────────────────────────────────────────
function ChapterGrid({
  chapters, currentChapter, onSelect,
}: { chapters: number; currentChapter: number; onSelect: (ch: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: 6 }}>
      {Array.from({ length: chapters }, (_, i) => i + 1).map((ch) => (
        <NavButton key={ch} active={ch === currentChapter} onClick={() => onSelect(ch)} numeric>
          {ch}
        </NavButton>
      ))}
    </div>
  );
}

// ── Verse grid ────────────────────────────────────────────────────────────────
function VerseGrid({
  count, currentVerse, onSelect,
}: { count: number; currentVerse?: number; onSelect: (v: number) => void }) {
  return (
    <>
      <p style={{ fontSize: 11, color: 'var(--stone)', margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif" }}>
        Select a verse to jump directly to it
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))', gap: 6 }}>
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
function NavButton({
  children, active, onClick, numeric = false,
}: { children: React.ReactNode; active: boolean; onClick: () => void; numeric?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(200,169,106,0.14)' : 'var(--bg3)',
        border: `1px solid ${active ? 'var(--gold-lo)' : 'var(--faint)'}`,
        borderRadius: 8,
        padding: numeric ? '12px 4px' : '9px 6px',
        cursor: 'pointer',
        fontSize: numeric ? 14 : 12,
        fontFamily: "'DM Sans', sans-serif",
        color: active ? 'var(--gold)' : 'var(--muted)',
        fontWeight: active ? 700 : 400,
        textAlign: 'center',
        lineHeight: 1.3,
        transition: 'background 0.1s, color 0.1s',
        minHeight: 44,
      }}
      onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(200,169,106,0.07)'; e.currentTarget.style.color = 'var(--cream)'; } }}
      onMouseOut={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--muted)'; } }}
    >
      {children}
    </button>
  );
}
