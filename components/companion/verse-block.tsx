'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { ColorPicker, HIGHLIGHT_COLORS } from './color-picker';
import { StudyPanel } from './study-panel';
import { addHighlight, removeHighlight, savePassage, unsavePassage } from '@/app/actions/companion';
import type { VerseLine } from '@/lib/bible/api-bible';

// ── Inline SVG icons ──────────────────────────────────────────────────────────
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
function IconBookmarkFilled() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

// Poetry indentation values per level
const INDENT: Record<number, string> = { 0: '0', 1: '1.2rem', 2: '2.4rem', 3: '3.6rem' };

// ── Props ─────────────────────────────────────────────────────────────────────
export interface VerseBlockProps {
  book: string;
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
  lines: VerseLine[];
  isPoetry: boolean;
  isParagraphStart: boolean;
  isStanzaBreak: boolean;
  translation: string;
  highlightColor?: string;
  isAuthenticated: boolean;
}

export function VerseBlock({
  book,
  bookName,
  chapter,
  verseNum,
  text,
  lines,
  isPoetry,
  isParagraphStart,
  isStanzaBreak,
  translation,
  highlightColor: initialColor,
  isAuthenticated,
}: VerseBlockProps) {
  const passageRef = `${bookName} ${chapter}:${verseNum}`;
  const [color, setColor] = useState(initialColor);
  const [showPicker, setShowPicker] = useState(false);
  const [showStudyPanel, setShowStudyPanel] = useState(false);
  const [panelAutoFocusNotes, setPanelAutoFocusNotes] = useState(false);
  const [panelAutoFocusAI, setPanelAutoFocusAI] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const verseNumRef = useRef<HTMLButtonElement>(null);

  // ── Highlight ──
  const handleHighlight = useCallback((newColor: string) => {
    setColor(newColor);
    setShowPicker(false);
    startTransition(async () => { await addHighlight(passageRef, newColor); });
  }, [passageRef]);

  const handleRemove = useCallback(() => {
    setColor(undefined);
    setShowPicker(false);
    startTransition(async () => { await removeHighlight(passageRef); });
  }, [passageRef]);

  // ── Note ──
  const handleNote = useCallback(() => {
    setPanelAutoFocusNotes(true);
    setShowStudyPanel(true);
  }, []);

  // ── Save / unsave toggle ──
  const handleSave = useCallback(() => {
    if (isSaved) {
      setIsSaved(false);
      startTransition(async () => { await unsavePassage(passageRef); });
    } else {
      setIsSaved(true);
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
      startTransition(async () => { await savePassage(passageRef); });
    }
  }, [isSaved, passageRef]);

  // ── Copy ──
  const handleCopy = useCallback(async () => {
    const copyText = `${passageRef} — ${text} (${translation})`;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = copyText;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [passageRef, text, translation]);

  // ── AI ──
  const handleAskAI = useCallback(() => {
    setPanelAutoFocusAI(true);
    setShowStudyPanel(true);
  }, []);

  const closePanel = useCallback(() => {
    setShowStudyPanel(false);
    setPanelAutoFocusNotes(false);
    setPanelAutoFocusAI(false);
  }, []);

  const highlighted = !!color;
  const colorLabel = color ? (HIGHLIGHT_COLORS.find((c) => c.value === color)?.label ?? color) : undefined;
  const saveLabel = saveFlash ? 'Saved!' : isSaved ? 'Saved — click to unsave' : 'Save verse';
  const saveActive = isSaved || saveFlash;

  // Extra top spacing for stanza / paragraph breaks
  const marginTop = isStanzaBreak ? 20 : isParagraphStart ? 12 : 0;

  return (
    <>
      <div
        id={`verse-${verseNum}`}
        className="verse-block group"
        data-verse={verseNum}
        style={{
          position: 'relative',
          borderLeft: highlighted ? `3px solid ${COLOR_BORDER[color!]}` : '3px solid transparent',
          background: highlighted ? COLOR_BG[color!] : 'transparent',
          borderRadius: highlighted ? '0 6px 6px 0' : undefined,
          paddingLeft: highlighted ? 10 : 13,
          paddingRight: isAuthenticated ? 44 : 0,
          paddingTop: 4,
          paddingBottom: 4,
          marginTop,
          marginBottom: 2,
          scrollMarginTop: 80,
          transition: 'background 0.2s, border-color 0.2s',
        }}
        aria-label={highlighted ? `Verse ${verseNum}, highlighted as ${colorLabel}` : undefined}
      >
        {/* Verse text — poetry renders multiple lines, prose renders one */}
        <div>
          {lines.map((line, i) => (
            <p
              key={i}
              style={{
                fontFamily: "'IM Fell English', serif",
                fontSize: '1.2rem',
                lineHeight: isPoetry ? 1.8 : 2.1,
                color: 'var(--cream)',
                margin: 0,
                paddingLeft: isPoetry ? (INDENT[line.indentLevel] ?? '3.6rem') : 0,
              }}
            >
              {i === 0 && (
                <button
                  ref={verseNumRef}
                  onClick={() => setShowStudyPanel(true)}
                  aria-label={`Study notes for verse ${verseNum}`}
                  title={`Study ${passageRef}`}
                  style={{
                    display: 'inline',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '0.65rem',
                    color: highlighted ? COLOR_BORDER[color!] : 'var(--stone)',
                    fontFamily: "'DM Sans', sans-serif",
                    verticalAlign: 'super',
                    marginRight: 4,
                    letterSpacing: '0.04em',
                    transition: 'color 0.15s',
                    lineHeight: 0,
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.color = 'var(--companion)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.color = highlighted ? COLOR_BORDER[color!] : 'var(--stone)'; }}
                >
                  {verseNum}
                </button>
              )}
              {line.segments.map((seg, j) =>
                seg.isJesus
                  ? <span key={j} className="words-of-jesus">{seg.text}</span>
                  : seg.text
              )}
            </p>
          ))}
        </div>

        {/* Action toolbar */}
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
            <ToolbarButton
              label={saveLabel}
              onClick={handleSave}
              active={saveActive}
              activeColor={isSaved ? 'var(--gold)' : undefined}
            >
              {saveFlash ? <IconCheck /> : isSaved ? <IconBookmarkFilled /> : <IconBookmark />}
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
          @keyframes verse-arrive {
            0%   { box-shadow: inset 3px 0 0 rgba(200,169,106,0.9),  0 0 28px rgba(200,169,106,0.08); }
            35%  { box-shadow: inset 3px 0 0 rgba(200,169,106,0.55), 0 0 12px rgba(200,169,106,0.04); }
            100% { box-shadow: none; }
          }
          .verse-block:target,
          .verse-block.verse-arrived {
            animation: verse-arrive 2.4s cubic-bezier(0.4,0,0.6,1) forwards;
          }
        `}</style>
      </div>

      {showStudyPanel && (
        <StudyPanel
          bookName={bookName}
          bookSlug={book}
          chapter={chapter}
          verse={verseNum}
          verseText={text}
          isAuthenticated={isAuthenticated}
          autoFocusNotes={panelAutoFocusNotes}
          autoFocusAI={panelAutoFocusAI}
          triggerRef={verseNumRef}
          onClose={closePanel}
        />
      )}
    </>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarButton({
  label,
  onClick,
  active,
  activeColor,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
}) {
  const activeBg = active ? 'var(--companion-lo)' : 'transparent';
  const activeTextColor = activeColor ?? 'var(--companion)';
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
        background: activeBg,
        color: active ? activeTextColor : 'var(--stone)',
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
        e.currentTarget.style.background = activeBg;
        e.currentTarget.style.color = active ? activeTextColor : 'var(--stone)';
      }}
    >
      {children}
    </button>
  );
}
