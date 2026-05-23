'use client';

import { useState } from 'react';
import type { BibleVersion } from '@/lib/bible/api-bible';
import { VersionPopover } from './version-popover';
import { BibleNavigator } from './bible-navigator';

interface ReaderControlsProps {
  bookSlug: string;
  bookName: string;
  chapter: number;
  currentVersion: BibleVersion;
  isAuthenticated: boolean;
}

export function ReaderControls({ bookSlug, bookName, chapter, currentVersion, isAuthenticated }: ReaderControlsProps) {
  const [showNavigator, setShowNavigator] = useState(false);
  const [showVersionPicker, setShowVersionPicker] = useState(false);

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
          transition: 'color 0.12s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--cream)'; (e.currentTarget.querySelector('.nav-chevron') as HTMLElement | null)?.style.setProperty('color', 'var(--muted)'); }}
        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--cream)'; (e.currentTarget.querySelector('.nav-chevron') as HTMLElement | null)?.style.setProperty('color', 'var(--stone)'); }}
      >
        {bookName} {chapter}
        <span className="nav-chevron" style={{ display: 'inline-flex', alignItems: 'center', transition: 'color 0.12s', color: 'var(--stone)', verticalAlign: 'middle', lineHeight: 0 }}>
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

      {showNavigator && (
        <BibleNavigator
          currentBook={bookSlug}
          currentChapter={chapter}
          currentVersion={currentVersion}
          onClose={() => setShowNavigator(false)}
        />
      )}
    </div>
  );
}

function ChevronIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
