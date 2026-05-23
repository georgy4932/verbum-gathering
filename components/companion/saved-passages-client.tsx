'use client';

import { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import type { SavedPassage } from '@/lib/types/domain';
import { unsavePassage, updateSavedPassageNote } from '@/app/actions/companion';

function passageRefToRoute(ref: string): string {
  const parts = ref.split(' ');
  const chapter = parts.pop() ?? '1';
  const bookSlug = parts.join(' ').toLowerCase().replace(/\s+/g, '-');
  return `${bookSlug}/${chapter}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function PassageRow({
  passage,
  onRemoved,
}: {
  passage: SavedPassage;
  onRemoved: (id: string) => void;
}) {
  const [note, setNote]               = useState(passage.note ?? '');
  const [editing, setEditing]         = useState(false);
  const [confirmRemove, setConfirm]   = useState(false);
  const [isSaving, startSave]         = useTransition();
  const [isRemoving, startRemove]     = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function openNote() {
    setEditing(true);
    setTimeout(() => {
      const el = textareaRef.current;
      if (el) { el.focus(); el.selectionStart = el.value.length; }
    }, 0);
  }

  function handleNoteBlur() {
    setEditing(false);
    startSave(async () => {
      await updateSavedPassageNote(passage.passage_ref, note);
    });
  }

  function handleRemove() {
    startRemove(async () => {
      await unsavePassage(passage.passage_ref);
      onRemoved(passage.id);
    });
  }

  const route = passageRefToRoute(passage.passage_ref);
  const hasNote = note.trim().length > 0;

  return (
    <div style={{
      padding: '18px 22px',
      background: 'var(--bg1)',
      borderBottom: '1px solid var(--faint)',
      opacity: isRemoving ? 0.4 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Top row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 12,
        marginBottom: hasNote || editing ? 10 : 0,
      }}>
        <Link
          href={`/companion/read/${route}`}
          style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: '1rem',
            color: 'var(--companion)',
            textDecoration: 'none',
          }}
        >
          {passage.passage_ref}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5 }}>
            {formatDate(passage.saved_at)}
          </span>

          {!confirmRemove ? (
            <button
              onClick={() => setConfirm(true)}
              style={{
                fontSize: 11, color: 'var(--stone)', opacity: 0.35,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                minHeight: 24,
              }}
            >
              Remove
            </button>
          ) : (
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--stone)' }}>Remove?</span>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                style={{
                  fontSize: 11, color: 'var(--live)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  minHeight: 24,
                }}
              >
                {isRemoving ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  fontSize: 11, color: 'var(--stone)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  minHeight: 24,
                }}
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Note area */}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          maxLength={2000}
          placeholder="Add a note…"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid var(--faint)',
            outline: 'none',
            resize: 'none',
            paddingTop: 10,
            paddingBottom: 2,
            color: 'var(--cream)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            lineHeight: 1.75,
            boxSizing: 'border-box',
            caretColor: 'var(--companion)',
          }}
        />
      ) : (
        <p
          onClick={openNote}
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.75,
            cursor: 'text',
            color: hasNote ? 'var(--muted)' : 'var(--stone)',
            opacity: hasNote ? 1 : 0.4,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {hasNote ? note : 'Add a note…'}
          {isSaving && (
            <span style={{ fontSize: 10, color: 'var(--stone)', opacity: 0.3, marginLeft: 8 }}>
              saving…
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function SavedPassagesClient({
  initialPassages,
}: {
  initialPassages: SavedPassage[];
}) {
  const [passages, setPassages] = useState(initialPassages);

  function handleRemoved(id: string) {
    setPassages((prev) => prev.filter((p) => p.id !== id));
  }

  if (passages.length === 0) {
    return (
      <div style={{
        padding: '48px 32px', textAlign: 'center',
        border: '1px solid var(--faint)', borderRadius: 16,
        background: 'var(--bg1)',
      }}>
        <p style={{
          fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
          fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20,
        }}>
          &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
        </p>
        <span style={{
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--stone)', display: 'block', marginBottom: 24,
        }}>
          Psalm 119:105
        </span>
        <Link href="/companion/read" style={{ fontSize: 13, color: 'var(--companion)' }}>
          Open Scripture to begin →
        </Link>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--faint)' }}>
      {passages.map((p) => (
        <PassageRow key={p.id} passage={p} onRemoved={handleRemoved} />
      ))}
    </div>
  );
}
