'use client';

import { useEffect, useRef } from 'react';
import { updateRedLetterPreference } from '@/app/actions/companion';

interface RedLetterControllerProps {
  initialEnabled: boolean;
  children: React.ReactNode;
}

// Wraps passage content with a data-red-letter attribute.
// CSS rule [data-red-letter="false"] .words-of-jesus { color: inherit; }
// handles the visual toggle without React state drilling across sibling components.
export function RedLetterController({ initialEnabled, children }: RedLetterControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onToggle(e: Event) {
      const { enabled } = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (container) container.dataset.redLetter = enabled ? 'true' : 'false';
      void updateRedLetterPreference(enabled);
    }

    window.addEventListener('red-letter-toggle', onToggle);
    return () => window.removeEventListener('red-letter-toggle', onToggle);
  }, []);

  return (
    <div ref={containerRef} data-red-letter={initialEnabled ? 'true' : 'false'}>
      {children}
    </div>
  );
}
