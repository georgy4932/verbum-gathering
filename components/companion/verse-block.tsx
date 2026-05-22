'use client';

import { useState, useTransition, useCallback } from 'react';
import { ColorPicker, HIGHLIGHT_COLORS } from './color-picker';
import { addHighlight, removeHighlight, savePassage } from '@/app/actions/companion';

// ── Inline SVG icons (avoids requiring lucide-react) ─────────────────────────
function IconHighlighter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>
    </svg>
  );
}
function IconNote() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/><path d="M10 8h1"/>
    </svg>
  );
}
function IconBookmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}
function IconSparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ── Highlight visual maps ─────────────────────────────────────────────────────
const COLOR_BG: Record<string, string> = {
  yellow: 'rgba(234,179,8,0.12)',
  blue:   'rgba(59,130,246,0.12)',
  green:  'rgba(34,197,94,0.12)',
  pink:   'rgba(236,72,153,0.12)',
  orange: 'rgba(249,115,22,0.12)',
};
const COLOR_BORDER: Record<string, string> = {
  yellow: '#ca8a04',
  blue:   '#3b82f6',
  green:  '#22c55e',
  pink:   '#ec4899',
  orange: '#f97316',
};

// ── Props ─────────────────────────────────────────────────────────────────────
export interface VerseBlockProps {
  book: string;       // slug, e.g. "john"
  bookName: string;   // display name, e.g. "John"
  chapter: number;
  verseNum: number;
  text: string;
  translation: string;
  highlightColor?: string;
  isAuthenticated: boolean;
}

export function VerseBlock({
  bookName,
  chapter,
  verseNum,
  text,
  translation,
  highlightColor: initialColor,
  isAuthenticated,
}: VerseBlockProps) {
  const passageRef = `${bookName} ${chapter}:${verseNum}`;
  const [color, setColor] = useState(initialColor);
  const [showPicker, setShowPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // Highlight
  const handleHighlight = useCallback((newColor: string) => {
    setColor(newColor);
    setShowPicker(false);
    startTransition(async () => {
      await addHighlight(passageRef, newColor);
    });
  }, [passageRef]);

  const handleRemove = useCallback(() => {
    setColor(undefined);
    setShowPicker(false);
    startTransition(async () => {
      await removeHighlight(passageRef);
    });
  }, [passageRef]);

  // Note — scroll to note editor and pre-fill passage ref
  const handleNote = useCallback(() => {
    const el = document.getElementById('note-editor');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Dispatch event so NoteEditor can pre-fill the passage ref
      window.dispatchEvent(new CustomEvent('verse:note', { detail: { passageRef } }));
    }
  }, [passageRef]);

  // Save verse
  const handleSave = useCallback(() => {
    setSaved(true);
    startTransition(async () => {
      await savePassage(passageRef);
    });
    setTimeout(() => setSaved(false), 2000);
  }, [passageRef]);

  // Copy
  const handleCopy = useCallback(async () => {
    const copyText = `${passageRef} — ${text} (${translation})`;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const ta = document.createElement('textarea');
      ta.value = copyText;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [passageRef, text, translation]);

  // Ask AI — open companion and pre-fill
  const handleAskAI = useCallback(() => {
    const el = document.getElementById('ai-companion');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new CustomEvent('verse:askAI', {
      detail: {
        passageRef,
        verseText: text,
        prompt: `Help me understand ${passageRef}: "${text}"`,
      },
    }));
  }, [passageRef, text]);

  const highlighted = !!color;
  const colorLabel = color
    ? (HIGHLIGHT_COLORS.find((c) => c.value === color)?.label ?? color)
    : undefined;

  return (
    <div
      className="verse-block group"
      data-verse={verseNum}
      style={{
        position: 'relative',
        borderLeft: highlighted
          ? `3px solid ${COLOR_BORDER[color!]}`
          : '3px solid transparent',
        background: highlighted ? COLOR_BG[color!] : 'transparent',
        borderRadius: highlighted ? '0 6px 6px 0' : undefined,
        paddingLeft: highlighted ? 10 : 13,
        paddingRight: isAuthenticated ? 44 : 0,
        paddingTop: 4,
        paddingBottom: 4,
        marginBottom: 2,
        transition: 'background 0.2s, border-color 0.2s',
      }}
      aria-label={highlighted ? `Verse ${verseNum}, highlighted as ${colorLabel}` : undefined}
    >
      {/* Verse text */}
      <p style={{
        fontFamily: "'IM Fell English', serif",
        fontSize: '1.2rem',
        lineHeight: 2.1,
        color: 'var(--cream)',
        margin: 0,
      }}>
        <sup style={{
          fontSize: '0.65rem',
          color: highlighted ? COLOR_BORDER[color!] : 'var(--stone)',
          fontFamily: "'DM Sans', sans-serif",
          verticalAlign: 'super',
          marginRight: 4,
          letterSpacing: '0.04em',
          transition: 'color 0.2s',
        }}>
          {verseNum}
        </sup>
        {text}
      </p>

      {/* Action toolbar — revealed on hover/focus */}
      {isAuthenticated && (
        <div
          className="verse-actions"
          role="toolbar"
          aria-label={`Actions for verse ${verseNum}`}
          style={{
            position: 'absolute',
            right: -2,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'var(--bg2)',
            border: '1px solid var(--faint2)',
            borderRadius: 8,
            padding: '3px 2px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.15s',
            zIndex: 10,
          }}
        >
          <ToolbarButton label="Highlight" onClick={() => setShowPicker((s) => !s)} active={highlighted}>
            <IconHighlighter />
          </ToolbarButton>
          <ToolbarButton label="Add note" onClick={handleNote}>
            <IconNote />
          </ToolbarButton>
          <ToolbarButton label={saved ? 'Saved!' : 'Save verse'} onClick={handleSave} active={saved}>
            {saved ? <IconCheck /> : <IconBookmark />}
          </ToolbarButton>
          <ToolbarButton label={copied ? 'Copied!' : 'Copy verse'} onClick={handleCopy} active={copied}>
            {copied ? <IconCheck /> : <IconCopy />}
          </ToolbarButton>
          <ToolbarButton label="Ask AI about this verse" onClick={handleAskAI}>
            <IconSparkles />
          </ToolbarButton>
        </div>
      )}

      {/* Color picker popover */}
      {showPicker && (
        <div style={{ position: 'absolute', right: 40, top: 0, zIndex: 20 }}>
          <ColorPicker
            onSelect={handleHighlight}
            onRemove={handleRemove}
            onClose={() => setShowPicker(false)}
            currentColor={color}
          />
        </div>
      )}

      <style>{`
        .verse-block:hover .verse-actions,
        .verse-block:focus-within .verse-actions {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        minWidth: 32,
        minHeight: 32,
        borderRadius: 6,
        border: 'none',
        background: active ? 'var(--companion-lo)' : 'transparent',
        color: active ? 'var(--companion)' : 'var(--stone)',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg3)';
          e.currentTarget.style.color = 'var(--cream)';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = active ? 'var(--companion-lo)' : 'transparent';
        e.currentTarget.style.color = active ? 'var(--companion)' : 'var(--stone)';
      }}
    >
      {children}
    </button>
  );
}
