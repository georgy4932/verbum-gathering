'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { StudyNote } from '@/app/actions/study-notes';

interface NotesListClientProps {
  initialNotes: StudyNote[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function noteMatches(note: StudyNote, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    (note.title ?? '').toLowerCase().includes(lower) ||
    note.content.toLowerCase().includes(lower) ||
    (note.passage_ref ?? '').toLowerCase().includes(lower)
  );
}

function NotePreview({ content }: { content: string }) {
  const first = content.replace(/\n+/g, ' ').trim();
  if (!first) return null;
  return (
    <p style={{
      fontSize: 13, color: 'var(--stone)', lineHeight: 1.7,
      fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
      margin: 0, overflow: 'hidden', display: '-webkit-box',
      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    }}>
      {first.length > 180 ? first.slice(0, 180) + '…' : first}
    </p>
  );
}

export function NotesListClient({ initialNotes }: NotesListClientProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? initialNotes.filter((n) => noteMatches(n, query.trim()))
    : initialNotes;

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            style={{
              width: '100%',
              background: 'var(--bg2)',
              border: '1px solid var(--faint)',
              borderRadius: 10,
              color: 'var(--cream)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: '10px 14px',
              outline: 'none',
            }}
          />
        </div>
        <Link
          href="/companion/notes/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 10,
            border: '1px solid var(--companion-lo)',
            color: 'var(--companion)',
            fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          + New note
        </Link>
      </div>

      {/* Empty state */}
      {initialNotes.length === 0 && (
        <div style={{
          padding: '48px 32px', textAlign: 'center',
          border: '1px solid var(--faint)', borderRadius: 16,
          background: 'var(--bg1)',
        }}>
          <p style={{
            fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
            fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20,
          }}>
            &ldquo;I have stored up your word in my heart.&rdquo;
          </p>
          <span style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--stone)', display: 'block', marginBottom: 24,
          }}>
            Psalm 119:11
          </span>
          <Link
            href="/companion/notes/new"
            style={{ fontSize: 13, color: 'var(--companion)' }}
          >
            Write your first note →
          </Link>
        </div>
      )}

      {/* No search results */}
      {initialNotes.length > 0 && filtered.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.7 }}>
          No notes matching &ldquo;{query}&rdquo;.
        </p>
      )}

      {/* Notes list */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((note) => (
            <Link
              key={note.id}
              href={`/companion/notes/${note.id}`}
              style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                padding: '18px 22px',
                borderRadius: 12,
                border: '1px solid var(--faint)',
                background: 'var(--bg1)',
                transition: 'border-color 0.18s',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 12,
                  marginBottom: note.title || note.content ? 8 : 0,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--companion)', fontWeight: 500 }}>
                    {note.passage_ref || 'Study note'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.55, whiteSpace: 'nowrap' }}>
                    {formatDate(note.updated_at)}
                  </span>
                </div>
                {note.title && (
                  <h3 style={{
                    fontFamily: "'IM Fell English', serif",
                    fontSize: '1rem', color: 'var(--cream)',
                    margin: '0 0 6px', lineHeight: 1.3,
                  }}>
                    {note.title}
                  </h3>
                )}
                <NotePreview content={note.content} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
