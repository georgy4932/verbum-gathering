# Known Issues

## `npm run build` fails — missing `SUPABASE_SERVICE_ROLE_KEY`

**Status:** Pre-existing. Not caused by, and not to be fixed inside, the
Companion → Gathering refactor branches without explicit approval.

**Symptom:**

```
Error: supabaseKey is required.
    at .../api/ban-participant/route.js
...
Error: Failed to collect page data for /api/ban-participant
```

(Same failure for `/api/livekit-webhook`.)

**Cause:** `lib/supabase/admin.ts` constructs `supabaseAdmin` via
`createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` at
module load time. `app/api/ban-participant/route.ts` and
`app/api/livekit-webhook/route.ts` both import `supabaseAdmin`, so
Next.js's "Collecting page data" build step evaluates that module for
both routes. In any environment where `SUPABASE_SERVICE_ROLE_KEY` is
not set (this repo's `.env.local` only defines
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`), the
`createClient` call throws immediately and the build fails.

**Confirmed pre-existing:** Reproduced on `claude/friendly-pascal-TJAY4`
at commit `39be3e0` (before the Phase 2 Companion prayer-points change)
via `git stash && npm run build` — identical error, same two routes,
same stack trace. `npx tsc --noEmit` passes; only `next build`'s
page-data collection step fails.

**Scope:** Unrelated to Companion/Gathering — these are LiveKit
room-moderation routes (`ban-participant`, `livekit-webhook`). Do not
fix inside `claude/friendly-pascal-TJAY4` or related Companion →
Gathering branches unless explicitly approved.

**Likely fix (separate PR, future):** Either provide
`SUPABASE_SERVICE_ROLE_KEY` (and the LiveKit env vars) in the build
environment, or make `lib/supabase/admin.ts` construct the client
lazily (inside a function) instead of at module scope, so routes that
are never invoked don't fail page-data collection when the var is
absent.
