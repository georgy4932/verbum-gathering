'use client';

import { useState, useEffect } from 'react';
import type { BibleVersion } from '@/lib/bible/api-bible';
import { VersionPopover } from './version-popover';
import { BibleNavigator } from './bible-navigator';

interface ReaderControlsProps {
  bookSlug: string;
  bookName: string;
  chapter: number;
  currentVersion: BibleVersion;
  isAuthenticated: boolean;
  showRedLetter: boolean;
}

export function ReaderControls({
  bookSlug,
  bookName,
  chapter,
  currentVersion,
  isAuthenticated,
  showRedLetter: initialRedLetter,
}: ReaderControlsProps) {
  const [showNavigator, setShowNavigator] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [currentVerse, setCurrentVerse] = useState<number | undefined>(undefined);
  const [redLetter, setRedLetter] = useState(initialRedLetter);

  // Pick up the verse from the URL hash, and from same-page scroll events
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

  function toggleRedLetter() {
    const next = !redLetter;
    setRedLetter(next);
    window.dispatchEvent(new CustomEvent('red-letter-toggle', { detail: { enabled: next } }));
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>

      {/* Reference pill — styled as the page heading */}
      <button
        onClick={() => { setShowVersionPicker(false); setShowNavigator(true); }}
        aria-label={`Navigate to a different passage. Currently reading ${bookName} chapter ${chapter}`}
        aria-haspopup="dialog"
        style={{
          background: 'none',
          border: 'none',
          padding: '2px 4px 2px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'baseline',
          gap: 7,
          fontFamily: "'IM Fell English', serif",
          fontSize: 'clamp(2rem, 5vw, 3.4rem)',
          lineHeight: 1.05,
          letterSpacing: '0.01em',
          color: 'var(--cream)',
        }}
      >
        {bookName} {chapter}
        {currentVerse && (
          <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.6rem)', color: 'var(--stone)', fontVariantNumeric: 'tabular-nums' }}>
            :{currentVerse}
          </span>
        )}
        <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--stone)', verticalAlign: 'middle', lineHeight: 0 }}>
          <ChevronIcon size={20} />
        </span>
      </button>

      {/* Version pill */}
      <div style={{ position: 'relative', alignSelf: 'center' }}>
        <button
          onClick={() => { setShowNavigator(false); setShowVersionPicker((s) => !s); }}
          aria-label={`Change Bible translation. Currently ${currentVersion}`}
          aria-haspopup="listbox"
          aria-expanded={showVersionPicker}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: showVersionPicker ? 'rgba(200,169,106,0.14)' : 'rgba(200,169,106,0.07)',
            border: '1px solid var(--gold-lo)',
            borderRadius: 20,
            padding: '5px 10px 5px 12px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
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

      {/* Red letter toggle — only shown when authenticated */}
      {isAuthenticated && (
        <button
          onClick={toggleRedLetter}
          aria-label={redLetter ? 'Hide red letter (words of Jesus)' : 'Show red letter (words of Jesus)'}
          title={redLetter ? 'Red letter on' : 'Red letter off'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            background: redLetter ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${redLetter ? 'rgba(248,113,113,0.35)' : 'var(--faint)'}`,
            borderRadius: 20,
            padding: '5px 10px',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: redLetter ? 'var(--jesus)' : 'var(--stone)',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.1s, border-color 0.1s, color 0.1s',
            alignSelf: 'center',
          }}
        >
          <RedLetterDot active={redLetter} />
          Red Letter
        </button>
      )}

      {showNavigator && (
        <BibleNavigator
          currentBook={bookSlug}
          currentChapter={chapter}
          currentVerse={currentVerse}
          currentVersion={currentVersion}
          onClose={() => setShowNavigator(false)}
        />
      )}
    </div>
  );
}

function RedLetterDot({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 6,
      height: 6,
      borderRadius: '50%',
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
