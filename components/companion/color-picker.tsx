'use client';

import { useEffect, useRef } from 'react';

const HIGHLIGHT_COLORS = [
  { value: 'yellow', label: 'Study',   bg: '#ca8a04', light: 'rgba(234,179,8,0.18)',   dark: 'rgba(161,98,7,0.35)'  },
  { value: 'blue',   label: 'Promise', bg: '#2563eb', light: 'rgba(59,130,246,0.18)',  dark: 'rgba(29,78,216,0.35)' },
  { value: 'green',  label: 'Command', bg: '#16a34a', light: 'rgba(34,197,94,0.18)',   dark: 'rgba(21,128,61,0.35)' },
  { value: 'pink',   label: 'Prayer',  bg: '#db2777', light: 'rgba(236,72,153,0.18)',  dark: 'rgba(157,23,77,0.35)' },
  { value: 'orange', label: 'Favorite',bg: '#ea580c', light: 'rgba(249,115,22,0.18)', dark: 'rgba(194,65,12,0.35)' },
] as const;

export { HIGHLIGHT_COLORS };

interface ColorPickerProps {
  onSelect: (color: string) => void;
  onRemove: () => void;
  onClose: () => void;
  currentColor?: string;
}

export function ColorPicker({ onSelect, onRemove, onClose, currentColor }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Highlight color picker"
      style={{
        position: 'absolute',
        zIndex: 50,
        top: '100%',
        right: 0,
        marginTop: 6,
        background: 'var(--bg2)',
        border: '1px solid var(--faint2)',
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        minWidth: 200,
      }}
    >
      <p style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--stone)', textTransform: 'uppercase', marginBottom: 8 }}>
        Highlight as
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {HIGHLIGHT_COLORS.map((c, i) => (
          <button
            key={c.value}
            onClick={() => onSelect(c.value)}
            aria-label={c.label}
            title={c.label}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
              if (e.key === 'ArrowLeft') (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
              if (e.key === 'Enter') onSelect(c.value);
            }}
            autoFocus={i === 0}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: c.bg,
              border: currentColor === c.value ? '2px solid var(--cream)' : '2px solid transparent',
              cursor: 'pointer',
              outline: 'none',
              transition: 'transform 0.15s, border-color 0.15s',
              flexShrink: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${c.bg}55`)}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--stone)' }}>
        {HIGHLIGHT_COLORS.map((c) => (
          <span key={c.value} style={{ width: 28, textAlign: 'center' }}>{c.label}</span>
        ))}
      </div>
      {currentColor && (
        <button
          onClick={onRemove}
          style={{
            marginTop: 10,
            width: '100%',
            fontSize: 11,
            color: 'var(--stone)',
            background: 'none',
            border: '1px solid var(--faint)',
            borderRadius: 6,
            padding: '5px 0',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Remove highlight
        </button>
      )}
    </div>
  );
}
