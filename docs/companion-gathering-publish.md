# Companion → Gathering Publish (Phase 3)

`publishCompanionNoteToGathering()` (`app/actions/gatherings.ts`) copies a
private `companion_notes` row into `gathering_discussion_threads`
(`kind = 'note'`) or `gathering_prayer_requests` (`kind = 'prayer'`) as a
one-time snapshot, using the scripture-attachment columns added in
migration 018 (`passage_ref`, `translation_version`,
`scripture_text_snapshot`, `source_context`, `publication_state`).

Published Gathering items are independent snapshots. They are not linked
to Companion notes/prayer points, and there is intentionally no publish
history, dedupe tracking, or sync relationship in Phase 3.
