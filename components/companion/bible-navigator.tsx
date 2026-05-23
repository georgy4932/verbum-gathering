'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS, type BibleBook } from '@/lib/bible/books';
import type { BibleVersion } from '@/lib/bible/api-bible';

const OT = BIBLE_BOOKS.filter((b) => b.testament === 'old');
const NT = BIBLE_BOOKS.filter((b) => b.testament === 'new');

interface BibleNavigatorProps {
  currentBook: string;
  currentChapter: number;
  currentVersion: BibleVersion;
  onClose: () => void;
}

export function BibleNavigator({ currentBook, currentChapter, currentVersion, onClose }: BibleNavigatorProps) {
  const router = useRouter();
  const [step, setStep] = useState<'book' | 'chapter'>('book');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (step === 'chapter') setStep('book');
      else onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  // Focus the sheet on mount for keyboard users
  useEffect(() => { sheetRef.current?.focus(); }, []);

  function pickBook(book: BibleBook) {
    setSelectedBook(book);
    setStep('chapter');
  }

  function pickChapter(ch: number) {
    router.push(`/companion/read/${selectedBook!.slug}/${ch}?v=${currentVersion}`);
    onClose();
  }

  return (
    <>
      <style>{`@keyframes nav-sheet-in { from { transform: translateX(-50%) translateY(16px); opacity:0.7; } to { transform: translateX(-50%) translateY(0); opacity:1; } }`}</style>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 490, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(3px)' }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={step === 'book' ? 'Choose a book of the Bible' : `Choose chapter — ${selectedBook?.name}`}
        tabIndex={-1}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 700,
          maxHeight: '84vh',
          zIndex: 491,
          background: 'var(--bg2)',
          borderRadius: '18px 18px 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -12px 64px rgba(0,0,0,0.7)',
          animation: 'nav-sheet-in 0.22s ease',
          outline: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14, paddingBottom: 4 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--faint2)' }} aria-hidden="true" />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 14px', borderBottom: '1px solid var(--faint)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {step === 'chapter' && (
              <button
                onClick={() => setStep('book')}
                aria-label="Back to book selection"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--companion)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                Books
              </button>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif" }}>
              {step === 'book' ? 'Go to Passage' : selectedBook?.name}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigator"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stone)', fontSize: 20, lineHeight: 1, padding: '2px 4px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 36px', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {step === 'book' ? (
            <>
              <SectionLabel>Old Testament</SectionLabel>
              <BookGrid books={OT} currentBook={currentBook} onSelect={pickBook} />
              <SectionLabel style={{ marginTop: 22 }}>New Testament</SectionLabel>
              <BookGrid books={NT} currentBook={currentBook} onSelect={pickBook} />
            </>
          ) : (
            <ChapterGrid
              chapters={selectedBook!.chapters}
              currentChapter={selectedBook!.slug === currentBook ? currentChapter : 0}
              onSelect={pickChapter}
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
function BookGrid({ books, currentBook, onSelect }: { books: BibleBook[]; currentBook: string; onSelect: (b: BibleBook) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
      {books.map((book) => {
        const active = book.slug === currentBook;
        return (
          <button
            key={book.slug}
            onClick={() => onSelect(book)}
            style={{
              background: active ? 'rgba(200,169,106,0.12)' : 'var(--bg3)',
              border: `1px solid ${active ? 'var(--gold-lo)' : 'var(--faint)'}`,
              borderRadius: 8,
              padding: '9px 6px',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              color: active ? 'var(--gold)' : 'var(--muted)',
              fontWeight: active ? 600 : 400,
              textAlign: 'center',
              lineHeight: 1.3,
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(200,169,106,0.07)'; e.currentTarget.style.color = 'var(--cream)'; } }}
            onMouseOut={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--muted)'; } }}
          >
            {book.name}
          </button>
        );
      })}
    </div>
  );
}

// ── Chapter grid ──────────────────────────────────────────────────────────────
function ChapterGrid({ chapters, currentChapter, onSelect }: { chapters: number; currentChapter: number; onSelect: (ch: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 6 }}>
      {Array.from({ length: chapters }, (_, i) => i + 1).map((ch) => {
        const active = ch === currentChapter;
        return (
          <button
            key={ch}
            onClick={() => onSelect(ch)}
            style={{
              background: active ? 'rgba(200,169,106,0.14)' : 'var(--bg3)',
              border: `1px solid ${active ? 'var(--gold-lo)' : 'var(--faint)'}`,
              borderRadius: 8,
              padding: '11px 4px',
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              color: active ? 'var(--gold)' : 'var(--muted)',
              fontWeight: active ? 700 : 400,
              textAlign: 'center',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseOver={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(200,169,106,0.07)'; e.currentTarget.style.color = 'var(--cream)'; } }}
            onMouseOut={(e) => { if (!active) { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.color = 'var(--muted)'; } }}
          >
            {ch}
          </button>
        );
      })}
    </div>
  );
}
