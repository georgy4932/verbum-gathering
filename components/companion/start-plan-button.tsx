'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startReadingPlan } from '@/app/actions/plans';

interface StartPlanButtonProps {
  planId: string;
  enrolled: boolean;
}

export function StartPlanButton({ planId, enrolled }: StartPlanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(enrolled);
  const router = useRouter();

  async function handleClick() {
    if (isEnrolled) {
      router.push(`/companion/plans/${planId}`);
      return;
    }
    setLoading(true);
    const result = await startReadingPlan(planId);
    setLoading(false);
    if (result.success || (!result.success && result.error === 'already_enrolled')) {
      setIsEnrolled(true);
      router.push(`/companion/plans/${planId}`);
    }
  }

  const active = isEnrolled;
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '9px 20px', borderRadius: 999,
        border: active ? '1px solid rgba(143,168,196,0.4)' : 'none',
        background: active ? 'transparent' : 'var(--companion)',
        color: active ? 'var(--companion)' : 'var(--bg)',
        fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.15s',
      }}
    >
      {loading ? 'Starting…' : active ? 'Continue reading →' : 'Start plan'}
    </button>
  );
}
