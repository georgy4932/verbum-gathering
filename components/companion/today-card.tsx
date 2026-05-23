'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { markDayComplete } from '@/app/actions/plans';
import { passageToReaderUrl } from '@/lib/reading-plans/passage-url';
import type { ActivePlan } from '@/app/actions/plans';
import type { UserReflection } from '@/app/actions/reflections';

interface TodayCardProps {
  activePlan: ActivePlan;
  todayReflection: UserReflection | null;
}

export function TodayCard({ activePlan, todayReflection }: TodayCardProps) {
  const [marking, setMarking] = useState(false);
  const router = useRouter();

  const { plan, plan_id, current_day, completed_days } = activePlan;
  const completedSet = new Set(completed_days);
  const todayDayData = plan.passages.find((p) => p.day === current_day);
  const todayPassages = todayDayData?.passages ?? [];
  const completionPct = Math.round((completed_days.length / plan.total_days) * 100);
  const isPlanComplete = completed_days.length >= plan.total_days;
  const dayAlreadyDone = completedSet.has(current_day);

  async function handleMarkComplete() {
    setMarking(true);
    await markDayComplete(plan_id, current_day);
    setMarking(false);
    router.refresh();
  }

  return (
    <div style={{
      border: '1px solid rgba(143,168,196,0.2)',
      borderRadius: 16,
      padding: '24px 28px',
      background: 'rgba(143,168,196,0.04)',
      marginBottom: 36,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        marginBottom: 16,
      }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'var(--companion)', margin: '0 0 6px',
          }}>
            Today&rsquo;s Reading
          </p>
          <h3 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: '1.3rem', color: 'var(--cream)', margin: 0,
          }}>
            {plan.title}
          </h3>
        </div>
        <Link
          href={`/companion/plans/${plan_id}`}
          style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none', letterSpacing: '0.05em', alignSelf: 'flex-start' }}
        >
          View plan →
        </Link>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--stone)' }}>
            Day {current_day} of {plan.total_days}
          </span>
          <span style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.7 }}>
            {completionPct}%
          </span>
        </div>
        <div style={{ height: 3, background: 'var(--faint)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'var(--companion)',
            width: `${completionPct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Passage links */}
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {todayPassages.length === 0 ? (
          <span style={{ fontSize: 14, color: 'var(--stone)' }}>No passages for today.</span>
        ) : (
          todayPassages.map((passage) => {
            const url = passageToReaderUrl(passage);
            return url ? (
              <Link
                key={passage}
                href={url}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--faint)',
                  background: 'var(--card-surface)',
                  color: 'var(--cream)',
                  fontSize: 14, textDecoration: 'none',
                  fontFamily: "'IM Fell English', serif",
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                {passage}
              </Link>
            ) : (
              <span key={passage} style={{ fontSize: 14, color: 'var(--stone)' }}>{passage}</span>
            );
          })
        )}
      </div>

      {/* Mark complete */}
      {!isPlanComplete && (
        <button
          onClick={handleMarkComplete}
          disabled={marking || dayAlreadyDone}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 999,
            border: `1px solid ${dayAlreadyDone ? 'rgba(94,167,115,0.3)' : 'var(--companion)'}`,
            background: dayAlreadyDone ? 'rgba(94,167,115,0.08)' : 'transparent',
            color: dayAlreadyDone ? '#5ea773' : 'var(--companion)',
            fontSize: 13, fontWeight: 600,
            cursor: dayAlreadyDone ? 'default' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.15s',
          }}
        >
          {dayAlreadyDone
            ? '✓ Day complete'
            : marking
            ? 'Marking…'
            : `Mark Day ${current_day} complete`}
        </button>
      )}

      {isPlanComplete && (
        <p style={{ fontSize: 14, color: '#5ea773', fontStyle: 'italic', margin: 0 }}>
          You have completed this plan. Well done.
        </p>
      )}

      {/* Reflection strip */}
      <div style={{
        marginTop: 20, paddingTop: 16,
        borderTop: '1px solid rgba(143,168,196,0.1)',
      }}>
        {todayReflection ? (
          <div>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
              textTransform: 'uppercase', color: 'var(--companion)', margin: '0 0 6px',
            }}>
              Today&rsquo;s Reflection
            </p>
            <p style={{
              fontSize: 14, color: 'var(--stone)', lineHeight: 1.7,
              fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
              margin: '0 0 8px',
            }}>
              &ldquo;{todayReflection.content.length > 120
                ? todayReflection.content.slice(0, 120) + '…'
                : todayReflection.content}&rdquo;
            </p>
            <Link
              href={`/companion/plans/${plan_id}`}
              style={{ fontSize: 12, color: 'var(--companion)', textDecoration: 'none', letterSpacing: '0.04em' }}
            >
              Edit reflection →
            </Link>
          </div>
        ) : (
          <Link
            href={`/companion/plans/${plan_id}`}
            style={{
              fontSize: 13, color: 'var(--stone)', textDecoration: 'none',
              opacity: 0.65, letterSpacing: '0.02em',
            }}
          >
            Reflect on today&rsquo;s reading →
          </Link>
        )}
      </div>
    </div>
  );
}
