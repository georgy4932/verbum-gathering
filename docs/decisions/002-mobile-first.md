# ADR 002 — Mobile-First Product Surface

**Status:** Accepted — Non-negotiable  
**Date:** 2026-05-29  
**Deciders:** Product (eodeh2005@gmail.com)

---

## Context

VerbumScribe's users will primarily access the product on mobile. Community interaction — joining Gatherings, posting a reply, raising a prayer request, reporting content, reading a thread — happens in moments throughout the day, not only at a desk. The moderation and governance flows must work for a moderator reviewing a report on their phone, not only for an admin at a desktop dashboard.

The existing codebase uses inline styles with `auto-fit` CSS grid, which provides basic responsiveness but is designed desktop-first (wide containers, dense metadata, hover-state CTAs). This must change.

This ADR establishes mobile-first as a non-negotiable product constraint for all new and refactored surfaces.

---

## Decision

**Mobile is the primary product surface. Desktop is the expanded version.**

This is not a responsive design requirement — it is a design priority inversion. Mobile layout is intentionally designed first. Desktop layout is additive.

---

## Breakpoints

| Name | Width | Primary use |
|---|---|---|
| Mobile | `< 640px` | Primary design target |
| Tablet | `640px – 1023px` | Expanded single-column; some two-column |
| Desktop | `≥ 1024px` | Multi-column layouts |

All layout decisions start at mobile. Additions are layered in at tablet and desktop via `min-width` media queries or equivalent CSS logic.

---

## Non-Negotiable UI Constraints

### Touch and tap

- Minimum tap target: **44×44px** for all interactive elements — buttons, links, form inputs, icon actions
- No interaction that depends on `:hover` as a primary affordance; hover may *enhance* but never *gate* an action
- Spacing between adjacent tap targets: minimum **8px** to prevent misfire
- Swipe gestures: do not implement without explicit product decision; text-based community does not need them at MVP

### Density and hierarchy

- **One primary action per screen on mobile.** Secondary actions are collapsed, placed below the fold, or surfaced via a deliberate secondary tap
- Metadata (member count, last activity, visibility badge) is shown when it aids the decision; hidden when it crowds the action
- Cards stack vertically on mobile; grid layouts are desktop-only
- Long-form content (thread body, study post, prayer request) takes full screen width with comfortable reading margins (`padding: 0 1.25rem` minimum)

### Forms

- One input concept per visible viewport on mobile where possible
- Labels above inputs, not inline (inline labels disappear on fill)
- Submit button: full-width on mobile, fixed to bottom of form or clearly below last field
- No multi-column form layouts on mobile
- Error messages inline below the relevant field; not toast-only
- Keyboard: use appropriate `inputmode` attributes (`inputmode="text"`, `inputmode="email"`, etc.)

### Navigation

- Primary navigation on mobile: bottom tab bar or hamburger — not a top nav with multiple links
- Current implementation (top horizontal nav) must be refactored for mobile; this is a known debt item
- Active section is clearly indicated without hover
- Back navigation is always available without relying on browser chrome

---

## Gathering-Specific Mobile Constraints

| Action | Mobile behavior |
|---|---|
| Join a Gathering | Single large button, full-width, no competing elements |
| Open a Thread | Full-screen thread view; reply input pinned to bottom |
| Post a Reply | Full-screen compose; single submit action; no formatting toolbar at MVP |
| Raise a Prayer Request | Full-screen form; textarea + submit; no sidebar |
| Report content | Sheet or bottom drawer with category selection + optional note; single confirm |
| Navigate Gathering tabs | Horizontal scroll tab bar (Study, Discussion, Prayer, Live); no overflow clipping |
| View member count / metadata | Below heading; smaller type; never above primary content |

The Gathering layout's current tab navigation (`GatheringNav`) is horizontal scrolling — this is correct for mobile. The header metadata (member count, visibility) should not dominate on mobile.

---

## Governance and Moderation Mobile Constraints

These are the higher-risk flows on mobile — a moderator acting incorrectly because the UI was ambiguous is a real failure mode.

### Reporting flow (any member, mobile)

1. User long-presses or taps a "..." menu on a Thread, Reply, or Prayer Request
2. Bottom drawer opens with: Report · (other actions)
3. Report drawer: category list (scrollable if needed); optional note field below; "Submit report" button full-width at bottom
4. Confirmation state: "Report submitted" with no further options (do not offer undo)
5. Total taps: 3 (open menu → select Report → confirm category → submit)

The report form must be completable one-handed. No multi-step wizard at MVP — one screen, one submit.

### Moderator actions (Gathering moderator, mobile)

Moderator actions are accessed via a long-press or "..." context menu on content. They must be:
- Clearly labeled (not icon-only)
- Separated from destructive/irreversible actions with a visual gap or divider
- Confirmed before execution: "Hide this reply?" with Cancel / Confirm — not an instant action

On mobile, the moderator action sheet shows a maximum of 4 options:
- Hide / Restore
- Remove
- Pin / Unpin
- Report to admin (escalate)

Removing a member is a separate action accessed from the member's profile, not from content. This separation is intentional — removing content and removing a member are different decisions with different weights.

### Admin trust review queue (platform admin, mobile)

The trust review queue on mobile shows:
- One candidate per card, stacked
- Card: display name, join date, interaction count, gathering count, open reports (if any)
- Two actions: **Approve** and **Decline** — both full-width buttons, Approve above Decline
- Decline requires a note: tap Decline → note field appears → Confirm decline
- Approve does not require a note but allows one: tap Approve → optional note → Confirm

The queue is not paginated at MVP; it is a flat list. When the queue exceeds 20 candidates, pagination must be added — this is a known scaling point.

### Report queue (admin, mobile)

- One report per card: content excerpt, category, reporter count, date
- Primary action: **Review** (opens content in context)
- Secondary: Resolve / Dismiss from the review screen
- Resolution requires a dropdown (Resolved / Dismissed) and a note field — both visible without scroll on a standard phone viewport

---

## Navigation Across Breakpoints

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Site header | Brand + hamburger menu | Brand + collapsed nav | Brand + full nav links |
| Primary nav links | Hidden behind hamburger or bottom tabs | Horizontal, limited items | Full horizontal row |
| Gathering tabs (Study, Discussion, Prayer, Live) | Horizontal scrolling tab bar | Horizontal tab bar, no scroll needed | Horizontal tab bar |
| Gathering header | Stacked: name → metadata → join/leave | Side-by-side: name left, join right | Side-by-side |
| Content cards | Full-width, stacked | Full-width, stacked | Grid (2-col) where appropriate |
| Admin queues | Single-column cards | Single-column cards | Two-column or table |
| Moderation actions | Bottom drawer / action sheet | Bottom drawer or inline menu | Inline dropdown |
| Forms | Full-screen, single column | Contained, single column | Contained, may be narrower than viewport |

The current top navigation (`site-header` with horizontal links) must be redesigned for mobile. At MVP, the minimum acceptable change is: on mobile widths, hide the navigation links and replace with a hamburger that reveals a vertical list. This is tracked as a debt item; it must be resolved before any public-facing launch.

---

## QA Requirements

Every meaningful feature must be verified at **mobile width first** before desktop review.

Standard QA viewport sequence:
1. **375×812** (iPhone SE / standard mobile — primary)
2. **390×844** (iPhone 14 — standard)
3. **768×1024** (iPad — tablet)
4. **1280×800** (laptop — desktop)

For Playwright tests, set `viewport` to `{ width: 375, height: 812 }` as the default. Desktop viewport is a secondary test configuration.

Interaction QA on mobile:
- All tap targets verified ≥ 44×44px (measure in browser devtools)
- No hover-only affordances
- Forms completable without horizontal scroll
- Moderation flows (report, hide, remove) verifiable at 375px width
- Navigation reachable without pinch-zoom

---

## Consequences

### Immediate

- All new pages and components must be designed mobile-first
- The implementation proposals for the governance spine (trust queue, report queue, moderator actions) must include mobile layout specs before implementation begins
- QA checklists must list mobile verification before desktop

### Known existing debt

| Surface | Mobile debt |
|---|---|
| Site header nav | Horizontal links not usable on mobile; needs hamburger or bottom tabs |
| Gathering hub (`/gathering`) | Cards use `auto-fit` grid; acceptable but not intentionally mobile-first |
| Gathering list (`/gatherings`) | Same — acceptable but not designed for mobile |
| Gathering tabs (`GatheringNav`) | Horizontal scroll — correct, but styling needs touch-size review |
| Admin pages (all) | Not yet built; must be built mobile-first |

Existing surfaces are not broken on mobile, but they were not designed for it. Refactoring them is a tracked obligation, not an immediate blocker. Priority: admin and governance flows first (they involve deliberate actions with real consequences); marketing/discovery pages second.

### What this does not mean

- It does not mean desktop layout is irrelevant — desktop users have a real experience that should be good
- It does not mean every screen is identical across breakpoints — desktop surfaces may have richer layouts
- It does not mean single-column everywhere on desktop — grid layouts are appropriate where they help
- It does not mean no information density — it means the primary action is never obscured by secondary information

---

## Review Triggers

This ADR has no expiry. The mobile-first constraint is binding. It may be revisited if:
- Data clearly shows primary usage is desktop (unlikely, but track)
- A specific feature category (e.g., admin dashboards) warrants a desktop-primary exception with explicit justification
