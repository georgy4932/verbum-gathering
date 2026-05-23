import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlanWithProgress, startReadingPlan } from '@/app/actions/plans';
import { PlanInteractive } from '@/components/companion/plan-interactive';
import { StartPlanButton } from '@/components/companion/start-plan-button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { plan } = await getPlanWithProgress(id);
  if (!plan) return { title: 'Plan not found — VerbumScribe' };
  return {
    title: `${plan.title} — VerbumScribe`,
    description: plan.description ?? undefined,
  };
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { id } = await params;
  const { day: dayParam } = await searchParams;

  const { plan, progress } = await getPlanWithProgress(id);
  if (!plan) notFound();

  const viewDay = dayParam
    ? Math.min(Math.max(parseInt(dayParam, 10), 1), plan.total_days)
    : (progress?.current_day ?? 1);

  const completionPct = progress
    ? Math.round((progress.completed_days.length / plan.total_days) * 100)
    : 0;

  return (
    <main style={{ padding: '0 1.25rem 4rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 28 }}>
          <Link
            href="/companion/plans"
            style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none', letterSpacing: '0.08em' }}
          >
            ← Reading Plans
          </Link>
        </div>

        {/* Plan header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.35em',
            textTransform: 'uppercase', color: 'var(--companion)', margin: '0 0 8px',
          }}>
            Reading Plan
          </p>
          <h1 style={{
            fontFamily: "'IM Fell English', serif",
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
            color: 'var(--cream)', margin: '0 0 10px', lineHeight: 1.1,
          }}>
            {plan.title}
          </h1>
          {plan.description && (
            <p style={{ fontSize: 15, color: 'var(--stone)', lineHeight: 1.75, margin: '0 0 20px', maxWidth: 620 }}>
              {plan.description}
            </p>
          )}

          {/* Progress bar — enrolled users only */}
          {progress && (
            <div style={{ maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--stone)' }}>
                  Day {progress.current_day} of {plan.total_days}
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
                }} />
              </div>
            </div>
          )}

          {/* Not enrolled — offer to start */}
          {!progress && (
            <div style={{ marginTop: 16 }}>
              <StartPlanButton planId={plan.id} enrolled={false} />
            </div>
          )}
        </div>

        {/* Interactive section — enrolled users see day view + grid */}
        {progress ? (
          <PlanInteractive
            plan={plan}
            progress={progress}
            viewDay={viewDay}
          />
        ) : (
          /* Not enrolled: show a preview of Day 1 */
          <div style={{
            border: '1px solid var(--faint2)',
            borderRadius: 14,
            padding: '22px 26px',
            background: 'var(--bg2)',
          }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--stone)', margin: '0 0 12px',
            }}>
              Day 1 — Preview
            </p>
            <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.75, margin: 0 }}>
              {plan.passages[0]?.passages.join(', ') ?? 'No passages.'}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
