# Verbum Gathering — Claude Code Guide

## Tech stack
- Next.js 15 (App Router, server actions, `force-dynamic`)
- Supabase (PostgreSQL + RLS + GoTrue auth)
- `@supabase/ssr` for server-side session via cookies
- Playwright for browser QA (devDependency)

## Implementation sequence — locked, non-negotiable

**No new admin screens until admin role enforcement is fixed and tested.**

This is not a preference. It is a hard sequencing rule. Building admin UI before the auth boundary is secure means polishing an unsafe surface.

### Locked order

1. **Fix admin auth boundary** — establish a real source of truth for admin role (see ADR 003)
2. **Quarantine broken admin routes** — remove or hard-block `/admin/devotions`, `/admin/insights`, `/admin/live-rooms` until they have real enforcement
3. **Implement governance schema** — `trust_state`, `account_status`, `content_reports`, `user_strikes`, `moderation_log`, SECURITY DEFINER functions
4. **Build governance UI** — `/admin/trust-queue`, `/admin/reports` — mobile-first, only after steps 1–3 are complete

Do not jump to step 4 because the UX docs are ready. The docs describe what to build; they do not change the dependency order.

### Admin route PR requirements

Any PR that touches a route under `/admin/` must include:
- Server-side role enforcement using `profiles.is_platform_admin` — checked inside the page/action, not only in middleware
- No privileged writes from a browser-side Supabase client (no `supabaseBrowser` in admin pages)
- At least one test or SQL verification proving a non-admin user cannot reach or mutate

### Current admin auth state (as of 2026-05-29)

| Route | Auth | Role check | Status |
|---|---|---|---|
| `/admin/devotions` | None | None | **Critical — open to all users** |
| `/admin/insights` | Yes | `host_profiles.is_host` — table does not exist | Broken; always redirects; phantom check |
| `/admin/live-rooms` | Yes | `host_profiles.is_host` — table does not exist | Same |

The source of truth for admin was `host_profiles.is_host`. That table was never migrated. It does not exist. Until this is fixed, there is no functioning admin role enforcement in the application.

### Product spine — non-negotiable constraints

- **Governed written Gatherings** — governance precedes scale
- **Mobile-first** — mobile is the primary surface; desktop is additive
- **Trust-gated creation** — `trust_state = 'trusted_user'` required to create a Gathering; manual admin approval only
- **Moderation before scale** — governance schema is built before user-facing discovery or growth features

## Development rules

### QA discipline — mandatory, non-negotiable
After every meaningful build phase, pause and QA live behavior before continuing.
Do not stack unverified features.

**Phase checklist format** — use this structure for every feature:
```
### Phase N — <feature name>

- [ ] Check 1
- [ ] Check 2
...

Database verification: [SQL to run after phase]
```

**Optimistic UI — always verify three states:**
1. **Immediate** — does the UI update before the server responds? (optimistic)
2. **Server-refreshed** — after `router.refresh()` fires, does the server state agree?
3. **Hard-reload persisted** — after `Cmd+Shift+R`, is the state still correct?

Applies to: JoinButton, PrayingButton, any future optimistic action.

**After every join/leave/post/prayer action**, run a live database snapshot
to confirm the row-level change matches what the UI showed.

### Auth states to cover for every auth-gated feature
Test all four states before marking a feature complete:
1. Anon (signed out)
2. Authenticated non-member
3. Member
4. Host / moderator

### Server action security pattern
Every server action that writes data must:
1. Call `getAuthUser()` (re-fetches from Supabase — never trust a closure-captured `user`)
2. Check membership/role if the action is member- or host-gated
3. Return `{ success: false, error: "..." }` on auth failure — never silently succeed

Page-level `"use server"` closures that capture `user` at render time are UX hints only;
the actual security boundary is always re-enforced inside `app/actions/gatherings.ts`.

### RLS always on
Every table has RLS enabled. Test with anon + member + host roles, not just as service role.
Use `execute_sql` via MCP to verify row-level counts match UI state after each phase.

## Schema quick-reference

### Tables
| Table | Key columns |
|---|---|
| `gatherings` | `slug`, `host_id`, `visibility` (public/community/private), `member_count` (trigger-maintained) |
| `gathering_members` | `gathering_id`, `user_id`, `role` (host/moderator/member), `joined_at` |
| `gathering_study_posts` | `gathering_id`, `author_id`, `title`, `body`, `passage_ref` |
| `gathering_discussion_threads` | `gathering_id`, `author_id`, `title`, `body`, `reply_count` (trigger) |
| `gathering_discussion_replies` | `thread_id`, `author_id`, `body` — **no `gathering_id`** |
| `gathering_prayer_requests` | `gathering_id`, `author_id`, `body`, `praying_count` (trigger) |
| `gathering_prayer_acknowledgments` | `(request_id, user_id)` PK — **no `gathering_id`** |
| `gathering_live_sessions` | `gathering_id`, `scheduled_at`, `is_cancelled`, `stream_url` — **no `host_id`** |

### Trigger-maintained counts
- `gathering_members` INSERT/DELETE → updates `gatherings.member_count`
- `gathering_discussion_replies` INSERT/DELETE → updates `gathering_discussion_threads.reply_count`
- `gathering_prayer_acknowledgments` INSERT/DELETE → updates `gathering_prayer_requests.praying_count`
- `gatherings` INSERT → auto-inserts host into `gathering_members` with `role = 'host'`

### SECURITY DEFINER helpers (break circular RLS dependency)
- `can_see_gathering(gid uuid)` — used in gatherings SELECT policy
- `is_gathering_member(gid uuid)` — used in child-table policies
- `gathering_member_role(gid uuid)` — used in host/mod-gated write policies

## `"use server"` scoping rule
Top-level `"use server"` in a page/layout file only permits async function exports.
`export const dynamic` is a non-async export — it will cause a Vercel build error.
**Always scope `"use server"` to inline action functions, not to the file.**

```typescript
// ✅ correct
export const dynamic = "force-dynamic";
async function handleCreate(formData: FormData) {
  "use server";
  ...
}

// ❌ wrong — build error on Vercel
"use server";
export const dynamic = "force-dynamic";
```

## Test users (in Supabase auth.users)
| Email | Password | Role in QA |
|---|---|---|
| `qa-host@verbum-qa.test` | `QaTest1234!` | Creates gatherings, host state |
| `qa-member@verbum-qa.test` | `QaTest1234!` | Joins gatherings, member state |
| `qa-nonmem@verbum-qa.test` | `QaTest1234!` | Authenticated non-member state |

Run `node qa-gatherings.mjs` (from an allowed IP) for full Playwright QA.

## Environment notes
- Supabase project has network restrictions: auth + REST APIs blocked from cloud container IPs
- Local dev: `npm run dev` → port 3099
- Supabase project: `uplptirherynltchogjh` (eu-west-1)
- The Supabase MCP always has direct DB access regardless of network restrictions
