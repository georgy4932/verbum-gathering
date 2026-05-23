'use client';

import { useEffect, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { updatePreferredVersion } from '@/app/actions/companion';
import { SUPPORTED_VERSIONS, type BibleVersion } from '@/lib/bible/api-bible';

const VERSION_META: Record<BibleVersion, string> = {
  KJV:  'King James, 1611',
  NKJV: 'New King James',
  NIV:  'New International',
  NLT:  'New Living',
  ESV:  'English Standard',
  MSG:  'The Message',
  TPT:  'The Passion',
  WEB:  'World English',
  ASV:  'American Standard, 1901',
};

interface VersionPopoverProps {
  current: BibleVersion;
  isAuthenticated: boolean;
  onClose: () => void;
}

export function VersionPopover({ current, isAuthenticated, onClose }: VersionPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouse);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouse);
    };
  }, [onClose]);

  function select(v: BibleVersion) {
    router.push(`${pathname}?v=${v}`);
    if (isAuthenticated) {
      startTransition(async () => { await updatePreferredVersion(v); });
    }
    onClose();
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Choose Bible translation"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        zIndex: 300,
        background: 'var(--bg2)',
        border: '1px solid var(--gold-lo)',
        borderRadius: 10,
        width: 238,
        boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
        overflow: 'hidden',
        animation: 'popover-in 0.15s ease',
      }}
    >
      <style>{`@keyframes popover-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ padding: '6px 0' }}>
        {SUPPORTED_VERSIONS.map((v) => {
          const active = v === current;
          return (
            <button
              key={v}
              role="option"
              aria-selected={active}
              onClick={() => select(v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: active ? 'rgba(200,169,106,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg3)'; }}
              onMouseOut={(e)  => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>
                <span style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: active ? 'var(--gold)' : 'var(--cream)',
                }}>
                  {v}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--stone)', marginTop: 1 }}>
                  {VERSION_META[v]}
                </span>
              </span>
              {active && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
