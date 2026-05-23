import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TodayCard } from '@/components/companion/today-card';
import { getReflectionForPlanDay, getRecentReflections } from '@/app/actions/reflections';
import { getNotificationPreferences } from '@/app/actions/notifications';
import { ReminderNudge } from '@/components/companion/reminder-nudge';
import type { ActivePlan } from '@/app/actions/plans';
import type { UserReflection } from '@/app/actions/reflections';

export const metadata = {
  title: 'Companion — VerbumScribe',
  description: 'Read Scripture. Reflect. Study with an intelligent companion that serves the text.',
};

export const dynamic = 'force-dynamic';

function formatReflectionDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });
}

function isPastReminderTime(reminderTime: string, timezone: string): boolean {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    const nowMinutes = h * 60 + m;
    const [rh, rm] = reminderTime.split(':').map(Number);
    return nowMinutes >= rh * 60 + rm;
  } catch {
    return false;
  }
}

export default async function CompanionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let activePlan: ActivePlan | null = null;
  if (user) {
    const { data } = await supabase
      .from('user_reading_plan_progress')
      .select(
        'id, user_id, plan_id, current_day, completed_days, started_at, last_read_at,' +
        ' plan:reading_plans(id, title, description, total_days, passages, is_public, created_at)'
      )
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    activePlan = data as ActivePlan | null;
  }

  // Fetch reflection, notification prefs in parallel — only when logged in.
  let todayReflection: UserReflection | null = null;
  let recentReflections: UserReflection[] = [];
  let showNudge = false;
  let nudgePhraseIndex = 0;

  if (user) {
    const [reflResult, recentResult, notifPrefs] = await Promise.all([
      activePlan
        ? getReflectionForPlanDay(activePlan.plan_id, activePlan.current_day)
        : Promise.resolve(null),
      getRecentReflections(3),
      getNotificationPreferences(),
    ]);
    todayReflection = reflResult;
    recentReflections = recentResult;

    if (
      notifPrefs?.reminders_enabled &&
      activePlan &&
      !todayReflection &&
      isPastReminderTime(notifPrefs.reminder_time, notifPrefs.timezone)
    ) {
      showNudge = true;
      nudgePhraseIndex = activePlan.current_day % 4;
    }
  }

  return (
    <main style={{ padding: '0 1.25rem 4rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div className="page-header">
          <span className="movement-eyebrow" style={{ color: 'var(--companion)' }}>
            Companion — The Word interpreted
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>
            The Word, open before you.
          </h1>
          <p className="subtitle">
            Read Scripture. Reflect on what you find. Ask questions. Study with an intelligent companion
            that serves the text — and never replaces it.
          </p>
        </div>

        {/* Quiet reminder nudge — only when reminders enabled + past reminder time + no reflection yet */}
        {showNudge && activePlan && (
          <ReminderNudge activePlan={activePlan} phraseIndex={nudgePhraseIndex} />
        )}

        {/* Today's Reading — shown only when enrolled in a plan */}
        {activePlan && (
          <TodayCard activePlan={activePlan} todayReflection={todayReflection} />
        )}

        <div
          className="card-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 40 }}
        >
          <Link href="/companion/read" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Scripture</span>
            <h2 style={titleStyle}>Read a passage</h2>
            <p style={descStyle}>
              Open any book of the Bible. Read with the text as the primary voice.
              Reflect and annotate quietly as you go.
            </p>
            <span className="enter">Open Scripture →</span>
          </Link>

          <Link href="/companion/plans" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Plans</span>
            <h2 style={titleStyle}>Reading plans</h2>
            <p style={descStyle}>
              Follow a curated Scripture reading schedule. Formation over engagement —
              no streaks, no badges, no pressure.
            </p>
            <span className="enter">Browse plans →</span>
          </Link>

          <Link href="/companion/notes" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Notes</span>
            <h2 style={titleStyle}>My study notes</h2>
            <p style={descStyle}>
              Your private notes, anchored to passages. Not a social feed.
              A personal record of formation.
            </p>
            <span className="enter">Open notes →</span>
          </Link>

          <Link href="/companion/saved" style={cardStyle} className="movement-card companion">
            <span className="movement-label">Saved</span>
            <h2 style={titleStyle}>Saved passages</h2>
            <p style={descStyle}>
              Passages you have marked to return to. Your Scripture library,
              built through reading — not curation.
            </p>
            <span className="enter">Open library →</span>
          </Link>
        </div>

        {/* Recent reflections — shown when the user has written any */}
        {recentReflections.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: 'var(--stone)',
              margin: '0 0 16px',
            }}>
              Recent Reflections
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
              {recentReflections.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: '1px solid var(--faint2)',
                    background: 'var(--bg2)',
                  }}
                >
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'baseline', marginBottom: 8, gap: 12,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--companion)', fontWeight: 600 }}>
                      {r.passage_ref ?? (r.plan_day ? `Day ${r.plan_day}` : 'Reflection')}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--stone)', opacity: 0.5, whiteSpace: 'nowrap' }}>
                      {formatReflectionDate(r.updated_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 14, color: 'var(--stone)', lineHeight: 1.7,
                    fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
                    margin: 0,
                  }}>
                    &ldquo;{r.content.length > 200 ? r.content.slice(0, 200) + '…' : r.content}&rdquo;
                  </p>
                  {r.plan_id && (
                    <Link
                      href={`/companion/plans/${r.plan_id}${r.plan_day ? `?day=${r.plan_day}` : ''}`}
                      style={{
                        display: 'inline-block', marginTop: 10,
                        fontSize: 12, color: 'var(--companion)',
                        textDecoration: 'none', opacity: 0.7,
                      }}
                    >
                      View in plan →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formation posture reminder + settings link */}
        <div style={{ borderTop: '1px solid var(--faint)', paddingTop: 32, maxWidth: 640 }}>
          <p style={{
            fontFamily: "'IM Fell English', serif", fontStyle: 'italic',
            fontSize: '1.1rem', color: 'var(--muted)', lineHeight: 1.85,
          }}>
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
          </p>
          <span style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--stone)', marginTop: 10, display: 'block',
          }}>
            Psalm 119:105
          </span>
          {user && (
            <Link
              href="/companion/settings"
              style={{ display: 'inline-block', marginTop: 20, fontSize: 12, color: 'var(--stone)', opacity: 0.5, textDecoration: 'none' }}
            >
              Reminder settings →
            </Link>
          )}
        </div>

      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = { textDecoration: 'none', color: 'inherit' };
const titleStyle: React.CSSProperties = { fontSize: '1.2rem', margin: 0 };
const descStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.75, margin: 0 };
