# ADR 003 — Admin Auth Boundary

**Status:** Accepted — Unblocks governance implementation  
**Date:** 2026-05-29  
**Deciders:** Product (eodeh2005@gmail.com)

---

## Context

The existing admin routes are in one of two states:

| Route | Auth | Role check | Reality |
|---|---|---|---|
| `/admin/devotions` | None | None | Open to every user, authenticated or not. Writes go directly to `devotions` via the browser Supabase client. |
| `/admin/insights` | `getUser()` | `host_profiles.is_host` | `host_profiles` does not exist in any migration. Query returns `null`, page always redirects. Phantom check. |
| `/admin/live-rooms` | `getUser()` | `host_profiles.is_host` | Same. |

The intended admin mechanism (`host_profiles.is_host`) was never built. The result is one unprotected page with production write access, and two pages that gate access against a table that does not exist.

No new admin tooling can be built safely on top of this. The governance implementation (trust queue, report queue, moderation log) requires a real admin boundary before any of those routes exist.

---

## Decision

### Source of truth: `profiles.is_platform_admin`

A single boolean column on `profiles`. Set manually in the Supabase dashboard by the database owner. Never set by application code. Never readable from a client-side Supabase query by non-admins (RLS).

```sql
ALTER TABLE profiles
  ADD COLUMN is_platform_admin boolean NOT NULL DEFAULT false;
```

RLS on `profiles` for this column:
- `is_platform_admin` is readable only by the row owner and by service role
- No application code can set it to `true` — only the database owner via Supabase dashboard or a service role migration

This is the most boring possible implementation. It is explicit, inspectable, and does not require a role table, claims, JWT custom fields, or any abstraction. For a platform with 1–2 admins, it is appropriate.

### Server-side enforcement helper

```typescript
// lib/admin-auth.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requirePlatformAdmin(): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_platform_admin) redirect("/");

  return { id: user.id };
}
```

Called at the top of every admin page and admin server action. Returns the authenticated admin user or redirects. Never throws.

### What changes in existing routes

**`/admin/devotions`**

- Convert from `"use client"` to a server component with a server action
- Add `requirePlatformAdmin()` call at the top of the page
- Remove `supabaseBrowser` write — move the insert into a server action that re-calls `requirePlatformAdmin()` inside the action body
- Result: unauthenticated and non-admin users are redirected at the page render; the write is protected server-side regardless of UI

**`/admin/insights` and `/admin/live-rooms`**

- Replace `host_profiles.is_host` check with `requirePlatformAdmin()`
- These pages also query tables that don't exist (`room_sessions`, `moderated_prayer_posts`, `room_bans`, `live_rooms`) — they will render empty lists until those tables exist
- They are not broken in a dangerous way (they have no writes), but they should be noted as stale content

---

## What this does not mean

- It does not mean adding middleware-only protection. Middleware is for redirects, not the security boundary. The check lives inside the page and inside every server action.
- It does not mean JWT custom claims or a role table. Those are appropriate at scale; they are not needed for two admins.
- It does not mean the existing admin pages become fully functional. `/admin/insights` and `/admin/live-rooms` reference tables from the pre-Gatherings codebase. They may be removed or replaced as the governance build proceeds.

---

## Implementation order within this fix

1. Add `is_platform_admin boolean NOT NULL DEFAULT false` to `profiles`
2. Set `is_platform_admin = true` for `eodeh2005@gmail.com` in Supabase dashboard
3. Create `lib/admin-auth.ts` with `requirePlatformAdmin()`
4. Fix `/admin/devotions`: add `requirePlatformAdmin()`, move write to server action
5. Fix `/admin/insights` and `/admin/live-rooms`: replace phantom `host_profiles` check with `requirePlatformAdmin()`
6. Verify: sign in as a non-admin user and confirm all three routes redirect to `/`
7. Verify: sign in as the admin user and confirm all three routes render

Only after all six steps are done and verified is the admin boundary considered fixed. The governance schema (ADR from governance proposal) begins after this.

---

## PR requirement for all future admin routes

Any PR that introduces a new route under `/admin/`:
- Calls `requirePlatformAdmin()` at page render
- Calls `requirePlatformAdmin()` inside any server action the page uses
- Contains no `supabaseBrowser` calls (no browser-side writes from admin pages)
- Includes a verification step confirming a non-admin user is redirected

This requirement is recorded in `CLAUDE.md` and applies to every future admin surface.

---

## Review triggers

This ADR has no expiry. The `is_platform_admin` approach is appropriate until:
- The admin team grows beyond 2–3 people (at which point a role table becomes worth the overhead)
- Admin actions need to be scoped by Gathering or region (at which point row-level admin permissions are needed)

Neither condition applies at MVP.
