# Known Issues

## ~~`npm run build` fails — missing `SUPABASE_SERVICE_ROLE_KEY`~~ — Fixed

**Status:** Resolved. `lib/supabase/admin.ts` now exports
`getSupabaseAdmin()`, which constructs the service-role client lazily on
first call instead of at module load time. `app/api/ban-participant/route.ts`,
`app/api/livekit-webhook/route.ts`, and `app/api/prayer-post/route.ts`
(all three importers of the admin client) now call `getSupabaseAdmin()`
inside their request handlers.

`npm run build` passes with `SUPABASE_SERVICE_ROLE_KEY` unset — the env
var is only read when one of these routes is actually invoked at
runtime, where it is expected to be configured.

**Original cause:** `lib/supabase/admin.ts` constructed `supabaseAdmin` via
`createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` at
module load time. Next.js's "Collecting page data" build step evaluates
that module for every importing route, so the `createClient` call threw
immediately whenever `SUPABASE_SERVICE_ROLE_KEY` was unset (this repo's
`.env.local` only defines `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
