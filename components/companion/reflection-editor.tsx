'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { UserReflection } from '@/app/actions/reflections';
import { upsertReflection, deleteReflection } from '@/app/actions/reflections';

// Prompts cycle by plan day so they feel intentional rather than random.
const PROMPTS = [
  'What stood out to you?',
  'What is God highlighting today?',
  'Is there a prayer forming from this passage?',
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  }) + ' at ' + new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

interface Props {
  planId: string;
  planDay: number;
  passageRef?: string | null;
  reflection: UserReflection | null;
}

export function ReflectionEditor({ planId, planDay, passageRef, reflection }: Props) {
  const router = useRouter();
  const [content, setContent] = useState(reflection?.content ?? '');
  const [savedContent, setSavedContent] = useState<string | null>(reflection?.content ?? null);
  const [reflectionId, setReflectionId] = useState<string | null>(reflection?.id ?? null);
  const [savedAt, setSavedAt] = useState<string | null>(reflection?.updated_at ?? null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startSave] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const prompt = PROMPTS[planDay % PROMPTS.length];
  const isDirty = content !== (savedContent ?? '');
  const canSave = content.trim().length > 0 && isDirty;
  const hasSaved = savedContent !== null;

  function handleSave() {
    startSave(async () => {
      const result = await upsertReflection({ planId, planDay, passageRef, content });
      if (result.success && result.data) {
        setSavedContent(result.data.content);
        setReflectionId(result.data.id);
        setSavedAt(result.data.updated_at);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!reflectionId) return;
    startDelete(async () => {
      const result = await deleteReflection(reflectionId);
      if (result.success) {
        setContent('');
        setSavedContent(null);
        setReflectionId(null);
        setSavedAt(null);
        setConfirmDelete(false);
        router.refresh();
      }
    });
  }

  return (
    <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--faint)' }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: 'var(--companion)', margin: '0 0 10px',
      }}>
        Reflection
      </p>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={prompt}
        rows={4}
        maxLength={5000}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'var(--bg2)', border: '1px solid var(--faint2)',
          borderRadius: 12, padding: '14px 16px',
          color: 'var(--cream)', fontSize: 15, lineHeight: 1.8,
          resize: 'vertical', fontFamily: "'IM Fell English', serif",
          outline: 'none', minHeight: 108,
        }}
      />

      <div style={{
        display: 'flex', gap: 10, marginTop: 12,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending || !canSave}
          style={{
            padding: '10px 22px', borderRadius: 999,
            background: 'var(--companion)', color: 'var(--bg)',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            border: 'none', cursor: canSave ? 'pointer' : 'default',
            opacity: (isPending || !canSave) ? 0.45 : 1,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'opacity 0.15s',
            minHeight: 44,
          }}
        >
          {isPending ? 'Saving…' : !isDirty && hasSaved ? 'Saved' : 'Save reflection'}
        </button>

        {/* Delete — inline confirm, no browser dialog */}
        {hasSaved && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              padding: '10px 16px', borderRadius: 999,
              background: 'transparent', color: 'var(--stone)',
              fontSize: 13, border: '1px solid var(--faint2)',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              minHeight: 44,
            }}
          >
            Delete
          </button>
        )}

        {confirmDelete && (
          <>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                padding: '10px 16px', borderRadius: 999,
                background: 'transparent', color: '#c07060',
                fontSize: 13, border: '1px solid rgba(192,112,96,0.4)',
                cursor: 'pointer', opacity: isDeleting ? 0.45 : 1,
                fontFamily: "'DM Sans', sans-serif",
                minHeight: 44,
              }}
            >
              {isDeleting ? 'Deleting…' : 'Confirm delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                background: 'none', border: 'none',
                padding: '10px 8px', minHeight: 44,
                fontSize: 13, color: 'var(--stone)',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
          </>
        )}

        {/* Saved timestamp — only shown when not dirty */}
        {savedAt && !isDirty && (
          <span style={{
            fontSize: 11, color: 'var(--stone)', opacity: 0.5,
            marginLeft: 'auto', whiteSpace: 'nowrap',
          }}>
            {formatTimestamp(savedAt)}
          </span>
        )}

        {/* Character count — only when approaching limit */}
        {content.length > 4000 && (
          <span style={{ fontSize: 11, color: 'var(--stone)', marginLeft: 'auto' }}>
            {content.length.toLocaleString()} / 5,000
          </span>
        )}
      </div>
    </div>
  );
}
