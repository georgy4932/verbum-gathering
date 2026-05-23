'use client';

import { useState, useEffect } from 'react';
import type { BibleVersion } from '@/lib/bible/api-bible';
import { VersionPopover } from './version-popover';
import { BibleNavigator } from './bible-navigator';
import { ChapterVersePicker } from './chapter-verse-picker';

interface ReaderControlsProps {
  bookSlug: string;
  bookName: string;
  chapter: number;
  currentVersion: BibleVersion;
  isAuthenticated: boolean;
  showRedLetter: boolean;
  hasRedLetterContent: boolean; // whether this passage has any wj segments
}

export function ReaderControls({
  bookSlug,
  bookName,
  chapter,
  currentVersion,
  isAuthenticated,
  showRedLetter: initialRedLetter,
  hasRedLetterContent,
}: ReaderControlsProps) {
  const [showNavigator, setShowNavigator] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | undefined>(undefined);
  const [redLetter, setRedLetter] = useState(initialRedLetter);

  useEffect(() => {
    function readHash() {
      const m = window.location.hash.match(/^#verse-(\d+)$/);
      setCurrentVerse(m ? parseInt(m[1], 10) : undefined);
    }
    function onVerseNavigate(e: Event) {
      setCurrentVerse((e as CustomEvent<{ verse: number }>).detail.verse);
    }
    readHash();
    window.addEventListener('hashchange', readHash);
    window.addEventListener('popstate', readHash);
    window.addEventListener('verse-navigate', onVerseNavigate);
    return () => {
      window.removeEventListener('hashchange', readHash);
      window.removeEventListener('popstate', readHash);
      window.removeEventListener('verse-navigate', onVerseNavigate);
    };
  }, []);

  function openNavigator() {
    setShowVersePicker(false);
    setShowVersionPicker(false);
    setShowNavigator(true);
  }

  function openVersePicker() {
    setShowNavigator(false);
    setShowVersionPicker(false);
    setShowVersePicker((s) => !s);
  }

  function toggleRedLetter() {
    const next = !redLetter;
    setRedLetter(next);
    window.dispatchEvent(new CustomEvent('red-letter-toggle', { detail: { enabled: next } }));
  }

  const redLetterTooltip = hasRedLetterContent
    ? (redLetter ? 'Red letter on — tap to hide' : 'Red letter off — tap to show')
    : 'No red letter in this passage — try NIV or NLT';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>

      {/* ── Reference area: chapter heading + verse picker ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>

        {/* Book + Chapter → full Bible navigator */}
        <button
          onClick={openNavigator}
          aria-label={`Navigate Bible. Currently ${bookName} chapter ${chapter}`}
          aria-haspopup="dialog"
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 5,
            fontFamily: "'IM Fell English', serif",
            fontSize: 'clamp(2rem, 5vw, 3.4rem)',
            lineHeight: 1.05,
            letterSpacing: '0.01em',
            color: 'var(--cream)',
          }}
        >
          {bookName} {chapter}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            color: 'var(--stone)', verticalAlign: 'middle', lineHeight: 0,
          }}>
            <ChevronIcon size={18} />
          </span>
        </button>

        {/* Verse indicator → current-chapter verse picker */}
        <button
          onClick={openVersePicker}
          aria-label={currentVerse ? `Verse ${currentVerse} — tap to jump to another verse` : 'Jump to a verse in this chapter'}
          aria-haspopup="dialog"
          style={{
            background: showVersePicker ? 'rgba(143,168,196,0.1)' : 'none',
            border: 'none',
            padding: '2px 6px 2px 4px',
            marginLeft: 1,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            lineHeight: 1.05,
            color: showVersePicker ? 'var(--companion)' : currentVerse ? 'var(--stone)' : 'rgba(122,114,100,0.45)',
            borderRadius: 6,
            transition: 'background 0.12s, color 0.12s',
            verticalAlign: 'baseline',
            alignSelf: 'center',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(143,168,196,0.1)';
            e.currentTarget.style.color = 'var(--companion)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = showVersePicker ? 'rgba(143,168,196,0.1)' : 'none';
            e.currentTarget.style.color = showVersePicker
              ? 'var(--companion)'
              : currentVerse ? 'var(--stone)' : 'rgba(122,114,100,0.45)';
          }}
        >
          {currentVerse ? (
            <>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>:{currentVerse}</span>
              <ChevronIcon size={10} />
            </>
          ) : (
            <VerseGridIcon />
          )}
        </button>
      </div>

      {/* Version pill */}
      <div style={{ position: 'relative', alignSelf: 'center' }}>
        <button
          onClick={() => { setShowNavigator(false); setShowVersePicker(false); setShowVersionPicker((s) => !s); }}
          aria-label={`Change Bible translation. Currently ${currentVersion}`}
          aria-haspopup="listbox"
          aria-expanded={showVersionPicker}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: showVersionPicker ? 'rgba(200,169,106,0.14)' : 'rgba(200,169,106,0.07)',
            border: '1px solid var(--gold-lo)',
            borderRadius: 20,
            padding: '5px 10px 5px 12px',
            cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--gold)',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.1s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(200,169,106,0.14)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = showVersionPicker ? 'rgba(200,169,106,0.14)' : 'rgba(200,169,106,0.07)'; }}
        >
          {currentVersion}
          <ChevronIcon size={10} />
        </button>

        {showVersionPicker && (
          <VersionPopover
            current={currentVersion}
            isAuthenticated={isAuthenticated}
            onClose={() => setShowVersionPicker(false)}
          />
        )}
      </div>

      {/* Red letter toggle — only for authenticated users */}
      {isAuthenticated && (
        <button
          onClick={hasRedLetterContent ? toggleRedLetter : undefined}
          aria-label={redLetterTooltip}
          title={redLetterTooltip}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: (redLetter && hasRedLetterContent) ? 'rgba(192,112,96,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${(redLetter && hasRedLetterContent) ? 'rgba(192,112,96,0.32)' : 'var(--faint)'}`,
            borderRadius: 20,
            padding: '5px 10px',
            cursor: hasRedLetterContent ? 'pointer' : 'default',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            color: (redLetter && hasRedLetterContent) ? 'var(--jesus)' : 'var(--stone)',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.1s, border-color 0.1s, color 0.1s',
            alignSelf: 'center',
            opacity: hasRedLetterContent ? 1 : 0.45,
          }}
        >
          <RedLetterDot active={redLetter && hasRedLetterContent} />
          Red Letter
        </button>
      )}

      {/* Full Bible navigator — Book → Chapter → Verse */}
      {showNavigator && (
        <BibleNavigator
          currentBook={bookSlug}
          currentChapter={chapter}
          currentVerse={currentVerse}
          currentVersion={currentVersion}
          onClose={() => setShowNavigator(false)}
        />
      )}

      {/* Current-chapter verse picker */}
      {showVersePicker && (
        <ChapterVersePicker
          bookName={bookName}
          bookSlug={bookSlug}
          chapter={chapter}
          currentVerse={currentVerse}
          onClose={() => setShowVersePicker(false)}
        />
      )}
    </div>
  );
}

function RedLetterDot({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: active ? 'var(--jesus)' : 'var(--stone)',
      transition: 'background 0.15s',
    }} />
  );
}

function ChevronIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function VerseGridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.5 }}>
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}
