'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { markDayComplete, leavePlan } from '@/app/actions/plans';
import { passageToReaderUrl } from '@/lib/reading-plans/passage-url';
import type { ReadingPlan, UserPlanProgress } from '@/app/actions/plans';
import type { UserReflection } from '@/app/actions/reflections';
import { ReflectionEditor } from '@/components/companion/reflection-editor';

interface PlanInteractiveProps {
  plan: ReadingPlan;
  progress: UserPlanProgress;
  viewDay: number;
  reflections: UserReflection[];
}

export function PlanInteractive({ plan, progress, viewDay, reflections }: PlanInteractiveProps) {
  const [completedDays, setCompletedDays] = useState(new Set(progress.completed_days));
  const [currentDay, setCurrentDay] = useState(progress.current_day);
  const reflectionMap = new Map(reflections.map((r) => [r.plan_day, r]));
  const viewDayReflection = reflectionMap.get(viewDay) ?? null;
  const [marking, setMarking] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  const isDayDone = completedDays.has(viewDay);
  const isPlanComplete = completedDays.size >= plan.total_days;
  const completionPct = Math.round((completedDays.size / plan.total_days) * 100);

  const dayData = plan.passages.find((p) => p.day === viewDay);
  const passages = dayData?.passages ?? [];

  async function handleMarkComplete() {
    setMarking(true);
    const result = await markDayComplete(progress.plan_id, viewDay);
    setMarking(false);
    if (result.success) {
      const next = new Set(completedDays);
      next.add(viewDay);
      setCompletedDays(next);
      if (viewDay === currentDay && currentDay < plan.total_days) {
        setCurrentDay(currentDay + 1);
      }
      router.refresh();
    }
  }

  async function handleLeave() {
    setLeaving(true);
    await leavePlan(progress.plan_id);
    router.push('/companion/plans');
  }

  function jumpToDay(day: number) {
    router.push(`/companion/plans/${progress.plan_id}?day=${day}`);
  }

  return (
    <div>
      {/* Day passages */}
      <div style={{
        border: '1px solid var(--faint2)',
        borderRadius: 14,
        padding: '22px 26px',
        marginBottom: 36,
        background: 'var(--bg2)',
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--stone)', margin: '0 0 14px',
        }}>
          Day {viewDay}{viewDay === currentDay ? ' — Today' : ''}
          {isDayDone && (
            <span style={{ marginLeft: 10, color: '#5ea773' }}>✓ Complete</span>
          )}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {passages.length === 0 ? (
            <span style={{ fontSize: 14, color: 'var(--stone)' }}>No passages for this day.</span>
          ) : (
            passages.map((passage) => {
              const url = passageToReaderUrl(passage);
              return url ? (
                <Link
                  key={passage}
                  href={url}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '6px 14px', borderRadius: 8,
                    border: '1px solid var(--faint)',
                    background: 'var(--card-surface)',
                    color: 'var(--cream)',
                    fontSize: 14, textDecoration: 'none',
                    fontFamily: "'IM Fell English', serif",
                    transition: 'border-color 0.12s',
                  }}
                >
                  {passage}
                  <span style={{ fontSize: 11, color: 'var(--stone)', marginLeft: 2 }}>→</span>
                </Link>
              ) : (
                <span key={passage} style={{ fontSize: 14, color: 'var(--stone)' }}>{passage}</span>
              );
            })
          )}
        </div>

        {!isPlanComplete && (
          <button
            onClick={handleMarkComplete}
            disabled={marking || isDayDone}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 999,
              border: `1px solid ${isDayDone ? 'rgba(94,167,115,0.3)' : 'var(--companion)'}`,
              background: isDayDone ? 'rgba(94,167,115,0.08)' : 'transparent',
              color: isDayDone ? '#5ea773' : 'var(--companion)',
              fontSize: 13, fontWeight: 600,
              cursor: isDayDone ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {isDayDone ? '✓ Complete' : marking ? 'Marking…' : `Mark Day ${viewDay} complete`}
          </button>
        )}

        {isPlanComplete && (
          <p style={{ fontSize: 14, color: '#5ea773', fontStyle: 'italic', margin: 0 }}>
            You have completed this plan. Well done.
          </p>
        )}

        <ReflectionEditor
          key={viewDay}
          planId={progress.plan_id}
          planDay={viewDay}
          passageRef={passages[0] ?? null}
          reflection={viewDayReflection}
        />
      </div>

      {/* Progress summary */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--stone)' }}>
            Day {currentDay} of {plan.total_days}
          </span>
          <span style={{ fontSize: 12, color: 'var(--stone)', opacity: 0.7 }}>
            {completionPct}% complete
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--faint)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: 'var(--companion)',
            width: `${completionPct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Day grid */}
      <div>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--stone)', margin: '0 0 12px',
        }}>
          All Days
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${plan.total_days > 100 ? '32px' : '40px'}, 1fr))`,
          gap: 4,
        }}>
          {Array.from({ length: plan.total_days }, (_, i) => {
            const day = i + 1;
            const done = completedDays.has(day);
            const isCurrent = day === currentDay;
            const isViewing = day === viewDay;
            const hasReflection = reflectionMap.has(day);
            return (
              <button
                key={day}
                onClick={() => jumpToDay(day)}
                title={`Day ${day}${done ? ' — complete' : isCurrent ? ' — today' : ''}${hasReflection ? ' — reflection written' : ''}`}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 5,
                  border: isViewing
                    ? '2px solid var(--companion)'
                    : isCurrent
                    ? '1px solid var(--companion)'
                    : '1px solid var(--faint)',
                  background: done
                    ? 'rgba(94,167,115,0.15)'
                    : isViewing || isCurrent
                    ? 'rgba(143,168,196,0.1)'
                    : 'transparent',
                  color: done ? '#5ea773' : isCurrent || isViewing ? 'var(--companion)' : 'var(--stone)',
                  fontSize: plan.total_days > 100 ? 9 : 11,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: isCurrent || isViewing ? 700 : 400,
                  padding: 0,
                  position: 'relative',
                }}
              >
                {done ? '✓' : day}
                {hasReflection && (
                  <span style={{
                    position: 'absolute', bottom: 3, right: 3,
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--companion)', opacity: 0.7,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leave plan */}
      <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--faint)' }}>
        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            style={{
              background: 'none', border: 'none', padding: 0,
              fontSize: 13, color: 'var(--stone)', opacity: 0.5,
              cursor: 'pointer', textDecoration: 'underline',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Leave this plan
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--stone)' }}>
              Leave plan? Your progress will be deleted.
            </span>
            <button
              onClick={handleLeave}
              disabled={leaving}
              style={{
                background: 'none', border: '1px solid rgba(192,112,96,0.4)',
                padding: '5px 14px', borderRadius: 999,
                fontSize: 12, color: '#c07060', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {leaving ? 'Leaving…' : 'Yes, leave'}
            </button>
            <button
              onClick={() => setConfirmLeave(false)}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 12, color: 'var(--stone)', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
