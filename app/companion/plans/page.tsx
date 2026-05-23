import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPublicPlans } from '@/app/actions/plans';
import { StartPlanButton } from '@/components/companion/start-plan-button';

export const metadata = {
  title: 'Reading Plans — VerbumScribe',
  description: 'Curated Scripture reading schedules to guide your daily formation.',
};

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const plans = await getPublicPlans();

  let enrolledIds = new Set<string>();
  if (user) {
    const { data } = await supabase
      .from('user_reading_plan_progress')
      .select('plan_id')
      .eq('user_id', user.id);
    enrolledIds = new Set((data ?? []).map((r) => r.plan_id as string));
  }

  return (
    <main style={{ padding: '0 1.25rem 4rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div className="page-header">
          <Link
            href="/companion"
            style={{ fontSize: 12, color: 'var(--stone)', textDecoration: 'none', letterSpacing: '0.08em' }}
          >
            ← Companion
          </Link>
          <span
            className="movement-eyebrow"
            style={{ color: 'var(--companion)', display: 'block', marginTop: 8 }}
          >
            Reading Plans
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>
            Guided Scripture paths.
          </h1>
          <p className="subtitle">
            Follow a curated reading schedule to move through Scripture with intention.
            Formation over engagement — no streaks, no badges, no pressure.
          </p>
        </div>

        {!user && (
          <div style={{
            padding: '14px 20px', borderRadius: 10, marginBottom: 32,
            background: 'rgba(200,169,106,0.07)', border: '1px solid var(--gold-lo)',
            fontSize: 14, color: 'var(--stone)',
          }}>
            <Link href="/auth/signin" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
            {' '}to start a plan and track your progress.
          </div>
        )}

        {plans.length === 0 ? (
          <p style={{ color: 'var(--stone)', fontSize: 15 }}>No plans available yet.</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 48,
          }}>
            {plans.map((plan) => {
              const enrolled = enrolledIds.has(plan.id);
              return (
                <div
                  key={plan.id}
                  style={{
                    padding: '24px 28px',
                    border: enrolled
                      ? '1px solid rgba(143,168,196,0.25)'
                      : '1px solid var(--faint2)',
                    borderRadius: 16,
                    background: enrolled ? 'rgba(143,168,196,0.05)' : 'var(--bg2)',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div>
                    {enrolled && (
                      <span style={{
                        display: 'inline-block', marginBottom: 8,
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.25em',
                        textTransform: 'uppercase', color: 'var(--companion)',
                      }}>
                        Enrolled
                      </span>
                    )}
                    <h3 style={{
                      fontFamily: "'IM Fell English', serif",
                      fontSize: '1.2rem', color: 'var(--cream)', margin: 0,
                    }}>
                      {plan.title}
                    </h3>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--stone)', lineHeight: 1.7, margin: 0, flexGrow: 1 }}>
                    {plan.description}
                  </p>

                  <p style={{
                    fontSize: 12, color: 'var(--stone)', opacity: 0.55,
                    fontVariantNumeric: 'tabular-nums', margin: 0,
                  }}>
                    {plan.total_days} {plan.total_days === 1 ? 'day' : 'days'}
                  </p>

                  {user ? (
                    <StartPlanButton planId={plan.id} enrolled={enrolled} />
                  ) : (
                    <Link
                      href="/auth/signin"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '9px 20px', borderRadius: 999,
                        background: 'var(--companion)', color: 'var(--bg)',
                        fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                        textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
                        width: 'fit-content',
                      }}
                    >
                      Sign in to start
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--faint)', paddingTop: 28, maxWidth: 560 }}>
          <p style={{
            fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
            fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.85, margin: 0,
          }}>
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
          </p>
          <span style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--stone)', marginTop: 8, display: 'block',
          }}>
            Psalm 119:105
          </span>
        </div>

      </div>
    </main>
  );
}
