'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateStudyNote, deleteStudyNote } from '@/app/actions/study-notes';
import type { StudyNote } from '@/app/actions/study-notes';

interface NoteEditorClientProps {
  note: StudyNote;
}

function formatSavedTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function NoteEditorClient({ note }: NoteEditorClientProps) {
  const [title, setTitle] = useState(note.title ?? '');
  const [content, setContent] = useState(note.content);
  const [passageRef, setPassageRef] = useState(note.passage_ref ?? '');
  const [noteDate, setNoteDate] = useState(
    note.note_date ?? new Date().toISOString().split('T')[0]
  );
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-grow textarea on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  function scheduleAutosave(patch: {
    title?: string;
    content?: string;
    passageRef?: string;
    noteDate?: string;
  }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const t = patch.title      !== undefined ? patch.title      : title;
      const c = patch.content    !== undefined ? patch.content    : content;
      const p = patch.passageRef !== undefined ? patch.passageRef : passageRef;
      const d = patch.noteDate   !== undefined ? patch.noteDate   : noteDate;
      startSave(async () => {
        const result = await updateStudyNote(note.id, {
          title:       t.trim() || null,
          content:     c,
          passage_ref: p.trim() || null,
          note_date:   d || null,
        });
        if (result.success) setSavedAt(new Date());
      });
    }, 1400);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTitle(e.target.value);
    scheduleAutosave({ title: e.target.value });
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    scheduleAutosave({ content: e.target.value });
  }

  function handlePassageChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassageRef(e.target.value);
    scheduleAutosave({ passageRef: e.target.value });
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNoteDate(e.target.value);
    scheduleAutosave({ noteDate: e.target.value });
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteStudyNote(note.id);
      router.push('/companion/notes');
      router.refresh();
    });
  }

  const inputBase: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--cream)',
    fontFamily: "'DM Sans', sans-serif",
    width: '100%',
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 1.25rem 6rem' }}>

      {/* Back navigation */}
      <div style={{
        paddingTop: 28, paddingBottom: 32,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <a
          href="/companion/notes"
          style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none', opacity: 0.7 }}
        >
          ← Notes
        </a>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              fontSize: 12, color: 'var(--stone)', background: 'none',
              border: 'none', cursor: 'pointer', opacity: 0.45,
              transition: 'opacity 0.15s',
              minHeight: 32,
            }}
          >
            Delete
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--stone)' }}>Delete this note?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                fontSize: 12, color: 'var(--live)', background: 'none',
                border: 'none', cursor: 'pointer', minHeight: 32,
              }}
            >
              {isDeleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                fontSize: 12, color: 'var(--stone)', background: 'none',
                border: 'none', cursor: 'pointer', minHeight: 32,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        style={{
          ...inputBase,
          fontFamily: "'IM Fell English', serif",
          fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
          lineHeight: 1.15,
          color: title ? 'var(--cream)' : 'var(--faint2)',
          marginBottom: 16,
          display: 'block',
        }}
      />

      {/* Passage ref + date row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        marginBottom: 28,
      }}>
        <input
          type="text"
          value={passageRef}
          onChange={handlePassageChange}
          placeholder="Scripture reference…"
          style={{
            ...inputBase,
            width: 'auto',
            flex: '1 1 160px',
            fontSize: 13,
            color: passageRef ? 'var(--companion)' : 'var(--stone)',
            letterSpacing: '0.03em',
          }}
        />
        <span style={{ color: 'var(--faint2)', fontSize: 13, flexShrink: 0 }}>·</span>
        <input
          type="date"
          value={noteDate}
          onChange={handleDateChange}
          style={{
            ...inputBase,
            width: 'auto',
            flexShrink: 0,
            fontSize: 12,
            color: 'var(--stone)',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--faint)', marginBottom: 32 }} />

      {/* Content */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        placeholder="Begin writing…"
        rows={12}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          width: '100%',
          color: 'var(--cream)',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '1rem',
          lineHeight: 1.9,
          letterSpacing: '0.008em',
          caretColor: 'var(--companion)',
          overflow: 'hidden',
        }}
      />

      {/* Save status */}
      <div style={{
        marginTop: 24,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        {isPending ? (
          <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.4 }}>Saving…</span>
        ) : savedAt ? (
          <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.4 }}>
            Saved {formatSavedTime(savedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
