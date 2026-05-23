import Link from 'next/link';
import type { ActivePlan } from '@/app/actions/plans';

const NUDGE_PHRASES = [
  'Your reading is open for today.',
  'Return to the passage when you\'re ready.',
  'Today\'s reading is waiting.',
  'The Word is open whenever you are.',
];

interface ReminderNudgeProps {
  activePlan: ActivePlan;
  phraseIndex?: number;
}

export function ReminderNudge({ activePlan, phraseIndex = 0 }: ReminderNudgeProps) {
  const phrase = NUDGE_PHRASES[phraseIndex % NUDGE_PHRASES.length];
  const planId = activePlan.plan_id;
  const day = activePlan.current_day;

  return (
    <div style={{
      marginBottom: 32,
      padding: '16px 20px',
      borderRadius: 12,
      border: '1px solid var(--faint)',
      borderLeft: '3px solid var(--companion)',
      background: 'var(--bg1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12,
      maxWidth: 640,
    }}>
      <p style={{
        margin: 0,
        fontSize: 14,
        color: 'var(--stone)',
        lineHeight: 1.65,
        fontFamily: "'IM Fell English', serif",
        fontStyle: 'italic',
      }}>
        {phrase}
      </p>
      <Link
        href={`/companion/plans/${planId}?day=${day}`}
        style={{
          fontSize: 13,
          color: 'var(--companion)',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          opacity: 0.85,
          flexShrink: 0,
          minWidth: 'max-content',
        }}
      >
        Open Day {day} →
      </Link>
    </div>
  );
}
