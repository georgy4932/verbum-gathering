// VerbumScribe — Core domain types.
// These are the canonical TypeScript shapes for the full platform.
// No React. No UI. Backend and domain layer only.

// ── Scripture ─────────────────────────────────────────────────────────────
// Human-editorial display string. Not a FK. Not normalized.
// Examples: "Romans 8:1–4", "Psalm 23", "John 3:16–17"
export type ScriptureRef = string;

// ── Roles ─────────────────────────────────────────────────────────────────
export type UserRole = "member" | "guide" | "minister" | "admin";

export interface UserRoleRecord {
  id: string;
  role: UserRole;
  granted_at: string;
  granted_by: string | null;
}

// ── Profiles ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  display_name: string;
  bio: string | null;
}

// ── Companion — The Word Interpreted ──────────────────────────────────────
// All companion data is private. Never publicly visible.

// 'prayer' is an MVP compromise — see migration 018. Revisit if prayer
// points acquire a distinct lifecycle (reminders, answered-state, etc.).
export type CompanionNoteKind = "note" | "prayer";

export interface CompanionNote {
  id: string;
  user_id: string;
  passage_ref: ScriptureRef;
  scripture_refs: ScriptureRef[];
  body: string;
  kind: CompanionNoteKind;
  created_at: string;
  updated_at: string;
}

export interface CompanionThread {
  id: string;
  user_id: string;
  passage_ref: ScriptureRef;
  title: string | null;
  created_at: string;
}

export interface CompanionMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SavedPassage {
  id: string;
  user_id: string;
  passage_ref: ScriptureRef;
  note: string | null;
  saved_at: string;
}

// ── Gathering — The Word Shared ───────────────────────────────────────────

export type LiveRoomStatus = "live" | "soon" | "scheduled";
export type LiveRoomKind   = "prayer" | "worship" | "study";

export interface LiveRoom {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: LiveRoomStatus;
  time_label: string;
  host: string;
  kind: LiveRoomKind;
  host_user_id: string | null;
  livekit_room_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_live: boolean;
  sort_order: number;
  passage_ref: ScriptureRef | null;
  scripture_refs: ScriptureRef[];
}

export interface FellowshipRoom {
  id: string;
  slug: string;
  name: string;
  description: string;
  members_label: string;
  sort_order: number;
  passage_ref: ScriptureRef | null;
  theme: string | null;
}

export interface Study {
  id: string;
  slug: string;
  title: string;
  description: string;
  host_name: string;
  passage_ref: ScriptureRef | null;
  scripture_refs: ScriptureRef[];
  host_user_id: string | null;
}

export interface Devotion {
  id: string;
  title: string;
  scripture: string;
  reflection: string;
  prayer: string;
  published_at: string;
  scripture_refs: ScriptureRef[];
}

// ── Studio — The Word Proclaimed ─────────────────────────────────────────

export type TeachingKind = "sermon" | "devotion" | "study" | "lecture";

export interface TeachingSeries {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  minister_id: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface Teaching {
  id: string;
  slug: string;
  title: string;
  series_id: string | null;
  minister_id: string;
  kind: TeachingKind;
  passage_ref: ScriptureRef | null;
  scripture_refs: ScriptureRef[];
  body: string | null;
  audio_url: string | null;
  video_url: string | null;
  duration_seconds: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface TeachingWithSeries extends Teaching {
  series: TeachingSeries | null;
}

// ── Worship — The Word Embodied ───────────────────────────────────────────

export type WorshipSetKind         = "curated" | "liturgical" | "seasonal";
export type WorshipMomentKind      = "song" | "reading" | "prayer" | "silence" | "reflection";
export type DevotionalPracticeKind = "daily" | "weekly" | "seasonal";

export interface WorshipSet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  passage_ref: ScriptureRef | null;
  scripture_refs: ScriptureRef[];
  curator_id: string | null;
  kind: WorshipSetKind;
  is_published: boolean;
  created_at: string;
}

export interface WorshipMoment {
  id: string;
  set_id: string;
  kind: WorshipMomentKind;
  title: string | null;
  body: string | null;
  passage_ref: ScriptureRef | null;
  media_url: string | null;
  duration_seconds: number | null;
  position: number;
  created_at: string;
}

export interface WorshipSetWithMoments extends WorshipSet {
  moments: WorshipMoment[];
}

export interface DevotionalPractice {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  passage_ref: ScriptureRef | null;
  scripture_refs: ScriptureRef[];
  kind: DevotionalPracticeKind;
  is_published: boolean;
  created_at: string;
}

// ── Gatherings — The Word Together ───────────────────────────────────────

export type GatheringVisibility = "public" | "community" | "private";
export type GatheringMemberRole = "host" | "moderator" | "member";

// Provenance of a published Companion → Gathering copy. 'manual' covers
// content authored directly in a Gathering (no Companion source).
export type GatheringSourceContext = "companion_highlight" | "companion_note" | "companion_prayer" | "manual";
export type GatheringPublicationState = "shared" | "archived";

export interface Gathering {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  host_id: string;
  visibility: GatheringVisibility;
  cover_image_url: string | null;
  passage_ref: ScriptureRef | null;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

export interface GatheringMember {
  id: string;
  gathering_id: string;
  user_id: string;
  role: GatheringMemberRole;
  joined_at: string;
}

export interface GatheringStudyPost {
  id: string;
  gathering_id: string;
  author_id: string | null;
  title: string;
  body: string;
  passage_ref: ScriptureRef | null;
  scripture_refs: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface GatheringDiscussionThread {
  id: string;
  gathering_id: string;
  author_id: string | null;
  title: string;
  body: string | null;
  passage_ref: ScriptureRef | null;
  passage_start: string | null;
  passage_end: string | null;
  translation_version: string | null;
  scripture_text_snapshot: string | null;
  source_context: GatheringSourceContext | null;
  publication_state: GatheringPublicationState;
  is_pinned: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface GatheringDiscussionReply {
  id: string;
  thread_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface GatheringPrayerRequest {
  id: string;
  gathering_id: string;
  author_id: string | null;
  body: string;
  passage_ref: ScriptureRef | null;
  passage_start: string | null;
  passage_end: string | null;
  translation_version: string | null;
  scripture_text_snapshot: string | null;
  source_context: GatheringSourceContext | null;
  publication_state: GatheringPublicationState;
  is_answered: boolean;
  praying_count: number;
  created_at: string;
  updated_at: string;
}

export interface GatheringPrayerAck {
  request_id: string;
  user_id: string;
  created_at: string;
}

export interface GatheringLiveSession {
  id: string;
  gathering_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  passage_ref: ScriptureRef | null;
  stream_url: string | null;
  is_cancelled: boolean;
  created_at: string;
}

// ── Saved Items — Cross-Movement ─────────────────────────────────────────
// A believer's private formation library. Never public.

export type SavedItemKind = "devotion" | "teaching" | "worship_set" | "passage" | "note";

export interface SavedItem {
  id: string;
  user_id: string;
  entity_type: SavedItemKind;
  entity_id: string;
  saved_at: string;
}
