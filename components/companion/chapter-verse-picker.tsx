'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getVerseCount } from '@/lib/bible/verse-counts';

interface ChapterVersePickerProps {
  bookName: string;
  bookSlug: string;
  chapter: number;
  currentVerse?: number;
  onClose: () => void;
}

export function ChapterVersePicker({
  bookName,
  bookSlug,
  chapter,
  currentVerse,
  onClose,
}: ChapterVersePickerProps) {
  const count = getVerseCount(bookSlug, chapter);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sheetRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSelect = useCallback((v: number) => {
    onClose();
    requestAnimationFrame(() => {
      const el = document.getElementById(`verse-${v}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        history.pushState(null, '', `#verse-${v}`);
        window.dispatchEvent(new CustomEvent('verse-navigate', { detail: { verse: v } }));
        el.classList.add('verse-arrived');
        setTimeout(() => el.classList.remove('verse-arrived'), 2400);
      }, 180);
    });
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes verse-sheet-in {
          from { transform: translateX(-50%) translateY(20px); opacity: 0.7; }
          to   { transform: translateX(-50%) translateY(0);   opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 490,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Jump to verse in ${bookName} ${chapter}`}
        tabIndex={-1}
        style={{
          position: 'fixed', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, maxHeight: '58vh',
          zIndex: 491,
          background: 'var(--bg2)',
          borderRadius: '18px 18px 0 0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -16px 56px rgba(0,0,0,0.75)',
          animation: 'verse-sheet-in 0.18s cubic-bezier(0.32,0,0.2,1)',
          outline: 'none',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 0, flexShrink: 0 }}>
          <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--faint2)' }} aria-hidden="true" />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px 6px', flexShrink: 0,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--stone)',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {bookName} {chapter} — Tap a verse
          </span>
          <button
            onClick={onClose}
            aria-label="Close verse picker"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--stone)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Verse grid */}
        <div style={{
          overflowY: 'auto', padding: '8px 16px 36px',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          WebkitOverflowScrolling: 'touch' as any,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))', gap: 5 }}>
            {Array.from({ length: count }, (_, i) => i + 1).map((v) => {
              const active = v === currentVerse;
              return (
                <button
                  key={v}
                  onClick={() => handleSelect(v)}
                  style={{
                    background: active ? 'rgba(200,169,106,0.16)' : 'var(--bg3)',
                    border: `1px solid ${active ? 'rgba(200,169,106,0.48)' : 'var(--faint)'}`,
                    borderRadius: 8,
                    padding: '10px 4px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                    color: active ? 'var(--gold)' : 'var(--muted)',
                    fontWeight: active ? 700 : 400,
                    textAlign: 'center',
                    minHeight: 42,
                    transition: 'background 0.1s, color 0.1s, border-color 0.1s',
                  }}
                  onMouseOver={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(200,169,106,0.07)';
                      e.currentTarget.style.color = 'var(--cream)';
                      e.currentTarget.style.borderColor = 'rgba(200,169,106,0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--bg3)';
                      e.currentTarget.style.color = 'var(--muted)';
                      e.currentTarget.style.borderColor = 'var(--faint)';
                    }
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
