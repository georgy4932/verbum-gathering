'use client';

import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'verbum-theme';

// ── SVG icons ────────────────────────────────────────────────────────────

function IconSystem() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {/* Left half filled — represents dark */}
      <path d="M7 1.2A5.8 5.8 0 0 0 7 12.8V1.2Z" fill="currentColor" />
      {/* Full circle outline */}
      <circle cx="7" cy="7" r="5.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
        <line x1="7" y1="1" x2="7" y2="2.4" />
        <line x1="7" y1="11.6" x2="7" y2="13" />
        <line x1="1" y1="7" x2="2.4" y2="7" />
        <line x1="11.6" y1="7" x2="13" y2="7" />
        <line x1="2.76" y1="2.76" x2="3.74" y2="3.74" />
        <line x1="10.26" y1="10.26" x2="11.24" y2="11.24" />
        <line x1="11.24" y1="2.76" x2="10.26" y2="3.74" />
        <line x1="3.74" y1="10.26" x2="2.76" y2="11.24" />
      </g>
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
      <path d="M11 8.8A6 6 0 0 1 3.2 2.2a6 6 0 1 0 7.8 6.6Z" />
    </svg>
  );
}

// ── Segment definitions ───────────────────────────────────────────────────

const SEGMENTS: { value: ThemePref; label: string; Icon: () => ReactElement }[] = [
  { value: 'system', label: 'System',     Icon: IconSystem },
  { value: 'light',  label: 'Light mode', Icon: IconSun    },
  { value: 'dark',   label: 'Dark mode',  Icon: IconMoon   },
];

const INDEX: Record<ThemePref, number> = { system: 0, light: 1, dark: 2 };

// ── Segment width ─────────────────────────────────────────────────────────
const SEG = 30; // px per segment
const PAD = 2;  // inner padding

// ── ThemeToggle ───────────────────────────────────────────────────────────

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read the preference the inline script already resolved
    const stored = (
      document.documentElement.getAttribute('data-theme-pref') as ThemePref
    ) ?? 'system';
    setPref(stored);
    setMounted(true);
  }, []);

  function apply(next: ThemePref) {
    setPref(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* private browsing */ }

    const resolved: 'light' | 'dark' =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
        : next;

    const html = document.documentElement;

    // Apply the transition class so CSS handles smooth color change
    html.classList.add('theme-transitioning');
    html.setAttribute('data-theme', resolved);
    html.setAttribute('data-theme-pref', next);
    setTimeout(() => html.classList.remove('theme-transitioning'), 400);
  }

  const idx = INDEX[pref];
  const totalWidth = SEG * 3 + PAD * 2;
  const totalHeight = 28 + PAD * 2;

  // Render a static pill SSR-safe (no indicator, no active state) until hydrated
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: totalWidth,
          height: totalHeight,
          borderRadius: 10,
          background: 'var(--toggle-track)',
          border: '1px solid var(--toggle-border)',
        }}
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: totalWidth,
        height: totalHeight,
        background: 'var(--toggle-track)',
        border: '1px solid var(--toggle-border)',
        borderRadius: 10,
        padding: PAD,
        gap: 0,
        flexShrink: 0,
      }}
    >
      {/* Sliding indicator pill */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: PAD,
          left: PAD,
          width: SEG,
          height: `calc(100% - ${PAD * 2}px)`,
          background: 'var(--toggle-thumb)',
          borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.08)',
          transform: `translateX(${idx * SEG}px)`,
          transition: 'transform 0.26s cubic-bezier(0.34, 1.3, 0.64, 1)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Segment buttons */}
      {SEGMENTS.map((seg) => {
        const active = pref === seg.value;
        return (
          <button
            key={seg.value}
            onClick={() => apply(seg.value)}
            title={seg.label}
            aria-pressed={active}
            style={{
              position: 'relative',
              zIndex: 1,
              width: SEG,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              borderRadius: 7,
              cursor: 'pointer',
              color: active ? 'var(--cream)' : 'var(--stone)',
              transition: 'color 0.2s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <seg.Icon />
          </button>
        );
      })}
    </div>
  );
}
