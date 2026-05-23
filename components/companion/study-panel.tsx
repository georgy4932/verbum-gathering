'use client';

import { useState, useEffect, useRef, useTransition, useCallback, useId } from 'react';
import Link from 'next/link';
import { getNotesForVerse, addCompanionNote, getOrCreateCompanionThread } from '@/app/actions/companion';
import { CROSS_REFERENCES, type CrossRefType } from '@/lib/bible/cross-references';
import type { CompanionNote } from '@/lib/types/domain';

// ── Icon helpers ──────────────────────────────────────────────────────────────
function IconX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
function IconSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
      style={{ animation: 'spin 0.9s linear infinite', display: 'inline-block' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

// ── Type badge maps ───────────────────────────────────────────────────────────
const TYPE_LABEL: Record<CrossRefType, string> = {
  parallel: 'Parallel',
  theme:    'Theme',
  context:  'Context',
  quote:    'Quote / Fulfillment',
};
const TYPE_COLOR: Record<CrossRefType, string> = {
  parallel: 'var(--companion)',
  theme:    'var(--worship)',
  context:  'var(--gathering)',
  quote:    'var(--gold)',
};

// ── Focus trap ────────────────────────────────────────────────────────────────
function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
    el.addEventListener('keydown', onKey);
    first.focus();
    return () => el.removeEventListener('keydown', onKey);
  }, [active, ref]);
}

// ── Accordion section ─────────────────────────────────────────────────────────
function Section({
  title, open, onToggle, id, children,
}: {
  title: string; open: boolean; onToggle: () => void; id: string; children: React.ReactNode;
}) {
  return (
    <div style={{ borderTop: '1px solid var(--faint)' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0', background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {title}
        <IconChevron open={open} />
      </button>
      <div
        id={`${id}-body`}
        role="region"
        aria-labelledby={id}
        style={{ overflow: 'hidden', maxHeight: open ? 2400 : 0, transition: 'max-height 0.3s ease', paddingBottom: open ? 16 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

// ── AI chat types ─────────────────────────────────────────────────────────────
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

// ── Props ─────────────────────────────────────────────────────────────────────
interface StudyPanelProps {
  bookName: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  verseText: string;
  isAuthenticated: boolean;
  autoFocusNotes?: boolean;
  autoFocusAI?: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export function StudyPanel({
  bookName, bookSlug, chapter, verse, verseText, isAuthenticated,
  autoFocusNotes = false, autoFocusAI = false, triggerRef, onClose,
}: StudyPanelProps) {
  const passageRef = `${bookName} ${chapter}:${verse}`;
  const panelRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  // ── Slide-in animation ──
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // ── Close with animation ──
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => { onClose(); triggerRef.current?.focus(); }, 250);
  }, [onClose, triggerRef]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useFocusTrap(panelRef, visible);

  // ── Section open state ──
  const [openNotes,   setOpenNotes]   = useState(true);
  const [openRefs,    setOpenRefs]    = useState(true);
  const [openAI,      setOpenAI]      = useState(true);

  // ── Notes ──
  const [notes,       setNotes]       = useState<CompanionNote[] | null>(null);
  const [notesPending, startNotesFetch] = useTransition();
  const [showAddForm, setShowAddForm] = useState(autoFocusNotes);
  const [noteBody,    setNoteBody]    = useState('');
  const [savePending, startSave]      = useTransition();
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    startNotesFetch(async () => {
      const result = await getNotesForVerse(passageRef);
      if (result.success) setNotes(result.data ?? []);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageRef, isAuthenticated]);

  // Auto-focus note textarea
  useEffect(() => {
    if (!autoFocusNotes || !visible) return;
    const id = setTimeout(() => noteTextareaRef.current?.focus(), 280);
    return () => clearTimeout(id);
  }, [autoFocusNotes, visible]);

  const handleSaveNote = useCallback(() => {
    if (!noteBody.trim()) return;
    setSaveError(null);
    startSave(async () => {
      const result = await addCompanionNote(passageRef, noteBody.trim());
      if (result.success) {
        setNoteBody('');
        setShowAddForm(false);
        const refreshed = await getNotesForVerse(passageRef);
        if (refreshed.success) setNotes(refreshed.data ?? []);
      } else {
        setSaveError(result.error ?? 'Could not save note.');
      }
    });
  }, [noteBody, passageRef]);

  // ── AI Companion chat ──
  const [aiMessages,  setAiMessages]  = useState<ChatMessage[]>([]);
  const [aiInput,     setAiInput]     = useState(autoFocusAI ? `Help me understand ${passageRef}` : '');
  const [aiThreadId,  setAiThreadId]  = useState<string | null>(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // Auto-focus AI input
  useEffect(() => {
    if (!autoFocusAI || !visible) return;
    const id = setTimeout(() => { aiInputRef.current?.focus(); aiInputRef.current?.select(); }, 280);
    return () => clearTimeout(id);
  }, [autoFocusAI, visible]);

  const handleAISend = useCallback(async () => {
    const question = aiInput.trim();
    if (!question || aiLoading) return;

    let tid = aiThreadId;
    if (!tid) {
      const result = await getOrCreateCompanionThread(passageRef);
      if (!result.success || !result.data) return;
      tid = result.data.threadId;
      setAiThreadId(tid);
    }

    setAiInput('');
    const userMsg: ChatMessage = { role: 'user', content: question };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const res = await fetch('/api/companion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: tid,
          passageRef,
          passageText: verseText,
          messages: [...aiMessages, userMsg],
        }),
      });
      const data = await res.json();
      if (res.status === 503 && data.error === 'companion_unavailable') {
        setAiMessages((prev) => [...prev, { role: 'assistant', content: 'The AI companion is not configured. You can still read your notes and cross-references.' }]);
      } else if (!res.ok) {
        throw new Error(data.error ?? 'Response error');
      } else {
        setAiMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
        setTimeout(() => aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    } catch {
      setAiMessages((prev) => [...prev, { role: 'assistant', content: 'Something prevented a response. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  }, [aiInput, aiLoading, aiThreadId, aiMessages, passageRef, verseText]);

  const crossRefs = CROSS_REFERENCES[passageRef] ?? [];

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .study-panel {
            top: 0 !important; right: 0 !important; bottom: 0 !important; left: auto !important;
            width: 400px !important; height: 100vh !important;
            border-left: 1px solid var(--faint) !important; border-top: none !important;
            transform: translateX(${visible ? '0' : '100%'}) !important;
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1) !important;
          }
        }
        @media (max-width: 639px) {
          .study-panel {
            left: 0 !important; right: 0 !important; bottom: 0 !important; top: auto !important;
            width: 100% !important; height: 72vh !important;
            border-top: 1px solid var(--faint) !important;
            border-radius: 16px 16px 0 0 !important;
            transform: translateY(${visible ? '0' : '100%'}) !important;
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1) !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.4)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby={`${uid}-title`}
        aria-modal="true"
        className="study-panel"
        style={{ position: 'fixed', zIndex: 200, background: 'var(--bg1)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: '1px solid var(--faint)', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.2em', color: 'var(--stone)', textTransform: 'uppercase', marginBottom: 2 }}>Study</p>
            <h2 id={`${uid}-title`} style={{ fontFamily: "'IM Fell English', serif", fontSize: '1.3rem', margin: 0, color: 'var(--cream)' }}>
              {passageRef}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--stone)', marginTop: 4, fontStyle: 'italic', lineHeight: 1.5 }}>
              "{verseText.length > 80 ? verseText.slice(0, 80) + '…' : verseText}"
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close study panel"
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid var(--faint)', background: 'none', color: 'var(--stone)', cursor: 'pointer', marginLeft: 12 }}
          >
            <IconX />
          </button>
        </div>

        {/* Sections */}
        <div style={{ padding: '0 20px', flex: 1 }}>

          {/* ── Your Notes ── */}
          <Section title="Your Notes" open={openNotes} onToggle={() => setOpenNotes(s => !s)} id={`${uid}-notes`}>
            {!isAuthenticated ? (
              <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.7 }}>
                <Link href="/sign-in" style={{ color: 'var(--companion)' }}>Sign in</Link> to view and add notes on this verse.
              </p>
            ) : notesPending || notes === null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--stone)', fontSize: 12 }}>
                <IconSpinner /> Loading notes…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.length === 0 && !showAddForm && (
                  <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.7 }}>No notes yet for this verse.</p>
                )}
                {notes.map((note) => (
                  <div key={note.id} style={{ background: 'var(--bg2)', border: '1px solid var(--faint)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6, margin: 0 }}>
                      {note.body.length > 160 ? note.body.slice(0, 160) + '…' : note.body}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--stone)', marginTop: 6 }}>
                      {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ))}
                {showAddForm ? (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--companion-lo)', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--companion)', marginBottom: 8 }}>
                      {passageRef}
                    </p>
                    <textarea
                      ref={noteTextareaRef}
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Write your reflection…"
                      rows={4}
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontSize: 13, lineHeight: 1.65, resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }}
                    />
                    {saveError && <p style={{ fontSize: 11, color: 'var(--live)', marginTop: 4 }}>{saveError}</p>}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={handleSaveNote}
                        disabled={savePending || !noteBody.trim()}
                        style={{
                          fontSize: 12,
                          color: savePending || !noteBody.trim() ? 'var(--stone)' : 'var(--bg)',
                          background: savePending || !noteBody.trim() ? 'var(--faint)' : 'var(--companion)',
                          border: 'none', borderRadius: 6, padding: '6px 14px',
                          cursor: savePending || !noteBody.trim() ? 'default' : 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        {savePending ? <><IconSpinner /> Saving…</> : 'Save note'}
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); setNoteBody(''); setSaveError(null); }}
                        style={{ fontSize: 12, color: 'var(--stone)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--companion)', background: 'none', border: '1px solid var(--companion-lo)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.04em' }}
                  >
                    + {notes.length === 0 ? 'Add a note' : 'Add another note'}
                  </button>
                )}
              </div>
            )}
          </Section>

          {/* ── Cross-References ── */}
          <Section title="Cross-References" open={openRefs} onToggle={() => setOpenRefs(s => !s)} id={`${uid}-refs`}>
            {crossRefs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.7 }}>No cross-references available for this verse yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {crossRefs.map((cr) => (
                  <Link
                    key={cr.ref}
                    href={`/companion/read/${cr.bookSlug}/${cr.chapter}`}
                    aria-label={`Go to ${cr.ref}`}
                    onClick={handleClose}
                    style={{ display: 'block', background: 'var(--bg2)', border: '1px solid var(--faint)', borderRadius: 8, padding: '10px 12px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--companion-lo)')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--faint)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--companion)', fontFamily: "'IM Fell English', serif" }}>{cr.ref}</span>
                      <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: TYPE_COLOR[cr.type], border: `1px solid ${TYPE_COLOR[cr.type]}44`, borderRadius: 4, padding: '1px 5px' }}>
                        {TYPE_LABEL[cr.type]}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.55, fontStyle: 'italic' }}>"{cr.snippet}"</p>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          {/* ── AI Companion ── */}
          <Section title="AI Companion" open={openAI} onToggle={() => setOpenAI(s => !s)} id={`${uid}-ai`}>
            {!isAuthenticated ? (
              <p style={{ fontSize: 13, color: 'var(--stone)', lineHeight: 1.7 }}>
                <Link href="/sign-in" style={{ color: 'var(--companion)' }}>Sign in</Link> to ask the AI companion about this verse.
              </p>
            ) : (
              <div>
                {/* Message thread */}
                {aiMessages.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    {aiMessages.map((msg, i) => (
                      <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
                        {msg.role === 'assistant' && (
                          <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--companion-lo)', display: 'block', marginBottom: 3 }}>
                            Companion
                          </span>
                        )}
                        <p style={{
                          fontSize: msg.role === 'assistant' ? 12 : 13,
                          color: msg.role === 'assistant' ? 'var(--muted)' : 'var(--cream)',
                          lineHeight: 1.7, margin: 0,
                          padding: '8px 12px',
                          background: msg.role === 'user' ? 'var(--bg2)' : 'transparent',
                          borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : 0,
                          border: msg.role === 'user' ? '1px solid var(--faint)' : 'none',
                        }}>
                          {msg.content}
                        </p>
                      </div>
                    ))}
                    {aiLoading && (
                      <p style={{ fontSize: 12, color: 'var(--stone)', fontStyle: 'italic' }}>Reflecting…</p>
                    )}
                    <div ref={aiBottomRef} />
                  </div>
                )}
                {aiMessages.length === 0 && !aiLoading && (
                  <p style={{ fontSize: 12, color: 'var(--stone)', lineHeight: 1.7, marginBottom: 10 }}>
                    Ask a question about {passageRef}. The companion serves the text, not replaces it.
                  </p>
                )}
                {/* Input row */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    ref={aiInputRef}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAISend(); } }}
                    placeholder={`Ask about ${passageRef}…`}
                    disabled={aiLoading}
                    style={{
                      flex: 1,
                      background: 'var(--bg2)',
                      border: '1px solid var(--faint)',
                      borderRadius: 7,
                      color: 'var(--cream)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      padding: '8px 12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAISend}
                    disabled={aiLoading || !aiInput.trim()}
                    style={{
                      fontSize: 12,
                      color: 'var(--bg)',
                      background: aiLoading || !aiInput.trim() ? 'var(--faint)' : 'var(--companion)',
                      border: 'none',
                      borderRadius: 7,
                      padding: '8px 14px',
                      cursor: aiLoading || !aiInput.trim() ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {aiLoading ? <IconSpinner /> : 'Ask'}
                  </button>
                </div>
              </div>
            )}
          </Section>

        </div>

        <div style={{ flexShrink: 0, height: 24 }} />
      </div>
    </>
  );
}
