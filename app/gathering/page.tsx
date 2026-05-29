import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Utilities ─────────────────────────────────────────────────────────────

function pl(n: number, word: string, plural = word + "s") {
  return `${n} ${n === 1 ? word : plural}`;
}

function relTime(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
}

// ── Types ──────────────────────────────────────────────────────────────────

type Session = {
  id: string;
  title: string;
  scheduled_at: string;
  gathering: { name: string; slug: string } | null;
};

type MyGathering = {
  id: string;
  name: string;
  slug: string;
  member_count: number;
  role: string;
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function GatheringPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = Date.now();
  const liveStart = new Date(now - 90 * 60_000).toISOString();
  const liveEnd = new Date(now + 30 * 60_000).toISOString();
  const in24h = new Date(now + 24 * 3_600_000).toISOString();
  const weekAgo = new Date(now - 7 * 24 * 3_600_000).toISOString();
  const dayAgo = new Date(now - 24 * 3_600_000).toISOString();

  const [
    { count: gatheringCount },
    { count: memberCount },
    { count: prayerTodayCount },
    { count: studyWeekCount },
    { data: rawLive },
    { data: rawUpcoming },
    { data: rawMine },
  ] = await Promise.all([
    supabase
      .from("gatherings")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("gathering_members")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("gathering_prayer_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayAgo),
    supabase
      .from("gathering_study_posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    supabase
      .from("gathering_live_sessions")
      .select("id, title, scheduled_at, gathering:gatherings(name, slug)")
      .gte("scheduled_at", liveStart)
      .lte("scheduled_at", liveEnd)
      .eq("is_cancelled", false)
      .order("scheduled_at")
      .limit(3),
    supabase
      .from("gathering_live_sessions")
      .select("id, title, scheduled_at, gathering:gatherings(name, slug)")
      .gt("scheduled_at", liveEnd)
      .lte("scheduled_at", in24h)
      .eq("is_cancelled", false)
      .order("scheduled_at")
      .limit(2),
    user
      ? supabase
          .from("gathering_members")
          .select("role, gathering:gatherings(id, name, slug, member_count)")
          .eq("user_id", user.id)
          .order("joined_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  let canCreate = false;
  if (user) {
    const { data: trustProfile } = await supabase
      .from("profiles")
      .select("trust_state")
      .eq("id", user.id)
      .single();
    canCreate = trustProfile?.trust_state === "trusted_user";
  }

  const live = (rawLive ?? []) as unknown as Session[];
  const upcoming = (rawUpcoming ?? []) as unknown as Session[];
  const myGatherings = ((rawMine ?? []) as unknown as Array<{ role: string; gathering: MyGathering | null }>)
    .map((m) => (m.gathering ? { ...m.gathering, role: m.role } : null))
    .filter((g): g is MyGathering & { role: string } => g !== null);

  const isLive = live.length > 0;
  const hasUpcoming = upcoming.length > 0;

  const gCount = gatheringCount ?? 0;
  const mCount = memberCount ?? 0;
  const pCount = prayerTodayCount ?? 0;
  const sCount = studyWeekCount ?? 0;

  // Activity strip signals — only non-zero values
  const signals: Array<{ label: string; live?: boolean }> = [];
  if (isLive) signals.push({ label: pl(live.length, "session") + " live now", live: true });
  if (hasUpcoming && !isLive) signals.push({ label: pl(upcoming.length, "session") + " today" });
  if (gCount > 0) signals.push({ label: pl(gCount, "gathering") });
  if (mCount > 0) signals.push({ label: pl(mCount, "member") });
  if (pCount > 0) signals.push({ label: `${pCount} ${pCount === 1 ? "prayer" : "prayers"} today` });
  if (sCount > 0) signals.push({ label: `${sCount} study ${sCount === 1 ? "post" : "posts"} this week` });

  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            color: "var(--stone)", letterSpacing: "0.12em",
            textTransform: "uppercase", fontSize: 11, marginBottom: 14,
          }}>
            Gathering
          </p>
          <h1 style={{
            fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
            margin: "0 0 18px", lineHeight: 1.04,
            color: "var(--cream)", maxWidth: 720,
          }}>
            Gather in prayer,<br />Scripture, and presence.
          </h1>
          <p style={{
            maxWidth: 520, color: "var(--muted)", lineHeight: 1.75,
            marginBottom: 28, fontSize: 15, margin: "0 0 28px",
          }}>
            Structured and open spaces for study, prayer, and real‑time connection —
            hosted by your community.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {/* Primary CTA — always Browse */}
            <Link href="/gatherings" style={{
              display: "inline-flex", alignItems: "center",
              padding: "11px 26px", borderRadius: 999,
              background: "var(--companion)", color: "#fff",
              textDecoration: "none", fontSize: 14, fontWeight: 600,
              letterSpacing: "0.01em",
            }}>
              Browse gatherings
            </Link>
            {/* Secondary CTA — contextual */}
            {isLive ? (
              <Link
                href={live[0].gathering ? `/gatherings/${live[0].gathering.slug}/live` : "#"}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "11px 20px", borderRadius: 999,
                  border: "1px solid rgba(134,239,172,0.35)", color: "#86efac",
                  textDecoration: "none", fontSize: 13,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#86efac", display: "inline-block",
                }} />
                Enter live now
              </Link>
            ) : canCreate ? (
              <Link href="/gatherings/new" style={{
                display: "inline-flex", alignItems: "center",
                padding: "11px 20px", borderRadius: 999,
                border: "1px solid var(--faint)", color: "var(--stone)",
                textDecoration: "none", fontSize: 13,
              }}>
                + Create a gathering
              </Link>
            ) : (
              <span style={{ fontSize: 12, color: "var(--stone)", opacity: 0.45, paddingLeft: 2 }}>
                Early access · hosting gated
              </span>
            )}
          </div>
        </div>

        {/* ── Activity strip ─────────────────────────────────────────────── */}
        {signals.length > 0 && (
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "4px 20px",
            marginBottom: 40, paddingBottom: 28,
            borderBottom: "1px solid var(--faint)",
            fontSize: 12, color: "var(--stone)",
          }}>
            {signals.map((s, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {s.live && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#86efac", display: "inline-block", flexShrink: 0,
                  }} />
                )}
                <span style={{ color: s.live ? "#86efac" : undefined }}>{s.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* ── Primary entry modes ──────────────────────────────────────────
            Three curated paths: Live Now · Bible Study · Open Spaces
        ──────────────────────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
          gap: 14,
          marginBottom: 14,
        }}>

          {/* ─ Live Now (three states) ──────────────────────────────────── */}
          {isLive ? (
            /* STATE: sessions in progress */
            <div style={{
              borderRadius: 24,
              border: "1px solid rgba(134,239,172,0.28)",
              background: "rgba(134,239,172,0.03)",
              padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#86efac",
                  boxShadow: "0 0 0 3px rgba(134,239,172,0.18)",
                  display: "inline-block",
                }} />
                <small style={{
                  fontSize: 11, color: "#86efac",
                  letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
                }}>
                  Live now
                </small>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 6px", color: "var(--cream)" }}>
                  Join what is happening now
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>
                  {pl(live.length, "session")} in progress. Enter and participate in real time.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {live.map((s) => (
                  <Link
                    key={s.id}
                    href={s.gathering ? `/gatherings/${s.gathering.slug}/live` : "#"}
                    style={{
                      display: "flex", justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px", borderRadius: 12,
                      background: "rgba(134,239,172,0.055)",
                      border: "1px solid rgba(134,239,172,0.12)",
                      textDecoration: "none", color: "inherit", gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </p>
                      {s.gathering && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--stone)" }}>
                          {s.gathering.name}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#86efac", flexShrink: 0 }}>Enter →</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : hasUpcoming ? (
            /* STATE: sessions scheduled today */
            <div style={{
              borderRadius: 24,
              border: "1px solid rgba(200,169,106,0.22)",
              background: "rgba(200,169,106,0.025)",
              padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--gold)", opacity: 0.75, display: "inline-block",
                }} />
                <small style={{
                  fontSize: 11, color: "var(--gold)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  Starting soon
                </small>
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 6px", color: "var(--cream)" }}>
                  Live sessions today
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>
                  Sessions are scheduled. Join when they open.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {upcoming.slice(0, 2).map((s) => (
                  <div key={s.id} style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: "rgba(200,169,106,0.04)",
                    border: "1px solid rgba(200,169,106,0.1)",
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", gap: 12,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--cream)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </p>
                      {s.gathering && (
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--stone)" }}>
                          {s.gathering.name}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--gold)", flexShrink: 0 }}>
                      in {relTime(s.scheduled_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STATE: nothing live or upcoming today */
            <div style={{
              borderRadius: 24,
              border: "1px solid var(--faint)",
              background: "transparent",
              padding: "22px 24px",
              display: "flex", flexDirection: "column", gap: 12,
              opacity: 0.6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "var(--stone)", opacity: 0.35, display: "inline-block",
                }} />
                <small style={{
                  fontSize: 11, color: "var(--stone)",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  Live
                </small>
              </div>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--cream)" }}>
                Join what is happening now
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.65, flexGrow: 1 }}>
                No sessions are live right now. Check back or browse gatherings for upcoming schedules.
              </p>
              <Link href="/gatherings" style={{
                fontSize: 12, color: "var(--stone)",
                textDecoration: "none", marginTop: 4,
              }}>
                Browse gatherings →
              </Link>
            </div>
          )}

          {/* ─ Bible Study ──────────────────────────────────────────────── */}
          <Link href="/gathering/studies" style={{
            borderRadius: 24,
            border: "1px solid rgba(200,169,106,0.15)",
            background: "rgba(200,169,106,0.025)",
            padding: "22px 24px",
            display: "flex", flexDirection: "column", gap: 12,
            textDecoration: "none", color: "inherit",
          }}>
            <small style={{
              fontSize: 11, color: "var(--gold)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Guided
            </small>
            <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--cream)" }}>
              Bible study
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.65, flexGrow: 1 }}>
              Enter guided Scripture conversations led by your community&apos;s teachers
              and pastors. Return regularly and grow deeper.
            </p>
            <span style={{ fontSize: 12, color: "var(--stone)", marginTop: 4 }}>
              View studies →
            </span>
          </Link>

          {/* ─ Open Spaces ──────────────────────────────────────────────── */}
          <Link href="/rooms" style={{
            borderRadius: 24,
            border: "1px solid var(--faint)",
            background: "var(--card-surface)",
            padding: "22px 24px",
            display: "flex", flexDirection: "column", gap: 12,
            textDecoration: "none", color: "inherit",
            opacity: 0.78,
          }}>
            <small style={{
              fontSize: 11, color: "var(--stone)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Open · always on
            </small>
            <h2 style={{ fontSize: "1.1rem", margin: 0, color: "var(--cream)" }}>
              Fellowship spaces
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.65, flexGrow: 1 }}>
              Come quietly into ongoing spaces of prayer, testimony, and shared
              presence. Stay as long as you need.
            </p>
            <span style={{ fontSize: 12, color: "var(--stone)", marginTop: 4 }}>
              Enter a space →
            </span>
          </Link>
        </div>

        {/* ── Secondary actions ─────────────────────────────────────────────
            Browse all · Create / Early access · Upcoming sessions
        ──────────────────────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginBottom: 0,
        }}>

          {/* Browse Gatherings — most prominent secondary card */}
          <Link href="/gatherings" style={{
            borderRadius: 20,
            border: "1px solid var(--companion-lo)",
            background: "rgba(143,168,196,0.04)",
            padding: "20px 22px",
            display: "flex", flexDirection: "column", gap: 10,
            textDecoration: "none", color: "inherit",
          }}>
            <small style={{
              fontSize: 11, color: "var(--companion)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Community{gCount > 0 ? ` · ${gCount} active` : ""}
            </small>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--cream)" }}>
              All gatherings
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, flexGrow: 1 }}>
              Explore every public gathering — study groups, prayer circles,
              and discussion rooms hosted by your community.
            </p>
            {mCount > 0 && (
              <p style={{ margin: 0, fontSize: 11, color: "var(--stone)" }}>
                {pl(mCount, "member")} across all gatherings
              </p>
            )}
            <span style={{ fontSize: 12, color: "var(--companion)", marginTop: 2 }}>
              Browse all →
            </span>
          </Link>

          {/* Create / Early access */}
          <div style={{
            borderRadius: 20,
            border: "1px solid var(--faint)",
            background: "var(--card-surface)",
            padding: "20px 22px",
            display: "flex", flexDirection: "column", gap: 10,
            opacity: canCreate ? 1 : 0.72,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <small style={{
                fontSize: 11, color: "var(--stone)",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Host
              </small>
              {!canCreate && (
                <span style={{
                  fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
                  color: "var(--gold)", border: "1px solid rgba(200,169,106,0.3)",
                  padding: "2px 8px", borderRadius: 6,
                }}>
                  Early access
                </span>
              )}
            </div>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--cream)" }}>
              {canCreate ? "Start a gathering" : "Host a gathering"}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.6, flexGrow: 1 }}>
              {canCreate
                ? "Host a space for your community — lead study sessions, gather for prayer, or facilitate discussion."
                : "Hosting is in early access. You'll be invited when it opens more broadly."}
            </p>
            {canCreate ? (
              <Link href="/gatherings/new" style={{
                fontSize: 12, color: "var(--stone)",
                textDecoration: "none", marginTop: 2,
              }}>
                + Create a gathering →
              </Link>
            ) : (
              <span style={{ fontSize: 12, color: "var(--stone)", opacity: 0.45, marginTop: 2 }}>
                Request access
              </span>
            )}
          </div>

          {/* Upcoming sessions */}
          <div style={{
            borderRadius: 20,
            border: "1px solid var(--faint)",
            background: "var(--card-surface)",
            padding: "20px 22px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <small style={{
              fontSize: 11, color: "var(--stone)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Upcoming
            </small>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--cream)" }}>
              Scheduled sessions
            </h3>
            {upcoming.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexGrow: 1 }}>
                {upcoming.slice(0, 2).map((s) => (
                  <div key={s.id} style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", gap: 8,
                  }}>
                    <span style={{
                      fontSize: 13, color: "var(--muted)",
                      minWidth: 0, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--stone)", flexShrink: 0 }}>
                      in {relTime(s.scheduled_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "var(--stone)", lineHeight: 1.6, opacity: 0.55, flexGrow: 1 }}>
                No sessions scheduled today.
              </p>
            )}
            <Link href="/gatherings" style={{
              fontSize: 12, color: "var(--stone)",
              textDecoration: "none", marginTop: "auto", opacity: 0.6,
            }}>
              View all gatherings →
            </Link>
          </div>
        </div>

        {/* ── Personal continuation ─────────────────────────────────────────
            Three states: signed in + gatherings · signed in + empty · anon
        ──────────────────────────────────────────────────────────────────── */}
        {user && myGatherings.length > 0 ? (
          <div style={{ marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--faint)" }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "baseline", marginBottom: 16,
            }}>
              <p style={{
                margin: 0, fontSize: 11, color: "var(--stone)",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Your spaces
              </p>
              <Link href="/gatherings" style={{
                fontSize: 12, color: "var(--stone)",
                textDecoration: "none", opacity: 0.5,
              }}>
                View all →
              </Link>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {myGatherings.map((g) => (
                <Link key={g.id} href={`/gatherings/${g.slug}`} style={{
                  padding: "10px 16px", borderRadius: 14,
                  border: "1px solid var(--faint)",
                  background: "var(--card-surface)",
                  textDecoration: "none", color: "inherit",
                  display: "flex", flexDirection: "column", gap: 3,
                  flex: "1 1 180px", maxWidth: 260,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--cream)" }}>
                    {g.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--stone)", opacity: 0.65 }}>
                    {g.role === "host" ? "Host" : g.role === "moderator" ? "Mod" : "Member"}
                    {g.member_count != null ? ` · ${pl(g.member_count, "member")}` : ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : user ? (
          /* Signed in, no gatherings yet */
          <div style={{
            marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--faint)",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <p style={{ margin: 0, color: "var(--stone)", fontSize: 14, lineHeight: 1.65, maxWidth: 440 }}>
              You haven&apos;t joined any gatherings yet. Browse to find one, or start your own.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/gatherings" style={{
                padding: "9px 20px", borderRadius: 999,
                background: "var(--companion)", color: "#fff",
                textDecoration: "none", fontSize: 13, fontWeight: 500,
              }}>
                Browse gatherings
              </Link>
              {canCreate && (
                <Link href="/gatherings/new" style={{
                  padding: "9px 18px", borderRadius: 999,
                  border: "1px solid var(--faint)", color: "var(--stone)",
                  textDecoration: "none", fontSize: 13,
                }}>
                  + Create
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Signed out */
          <div style={{
            marginTop: 36, paddingTop: 28, borderTop: "1px solid var(--faint)",
            display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <p style={{ margin: 0, color: "var(--stone)", fontSize: 14, lineHeight: 1.65, maxWidth: 480 }}>
              Sign in to join gatherings, share prayer requests, and participate
              in live sessions.
            </p>
            <Link href="/auth/signin" style={{
              padding: "9px 22px", borderRadius: 999,
              background: "var(--companion)", color: "#fff",
              textDecoration: "none", fontSize: 13, fontWeight: 500,
            }}>
              Sign in
            </Link>
          </div>
        )}

        <p style={{
          textAlign: "center", color: "var(--stone)",
          fontSize: "0.85rem", opacity: 0.35, marginTop: 52,
        }}>
          Spaces are open. You may enter quietly.
        </p>
      </div>
    </main>
  );
}
