# VerbumScribe Governance and Moderation

**Version:** 1.2  
**Status:** Active  
**Last updated:** 2026-05-29

---

## 1. Community Purpose

VerbumScribe is a written fellowship network for Christians. Its primary space is the Gathering — a governed community where members study Scripture, share prayer requests, discuss faith, and support one another in word.

The platform is not a broadcast channel, a debate forum, or a social feed. It is a fellowship space. The tone is written, considered, and rooted in the conviction that words carry weight.

VerbumScribe welcomes Christian discussion rooted in Scripture, prayer, humility, and respect. Content may be removed if it promotes abuse, deception, exploitation, hatred, occult practice, sexual misconduct, scams, harassment, or teaching that repeatedly and divisively contradicts the platform covenant after correction.

This standard is behavioral, not credal. The question is not what you believe in the abstract but how you conduct yourself in community.

---

## 2. Gatherings as the Primary Space

A Gathering is the fundamental unit of community on VerbumScribe. Every Gathering:

- Is created by a trusted user (a host)
- Has a defined name, purpose, and optional Scripture focus
- Has an explicit visibility: **public**, **community**, or **private**
- Is governed by its host and any moderators the host designates
- Contains content organized as: Threads, Prayer Requests, Replies, and optionally Study Posts and scheduled Live sessions

Gatherings are not ephemeral. A Gathering has a persistent identity and is expected to develop a character over time. Hosts are accountable for the conduct of their Gathering.

### Visibility Levels

| Level | Who can see it | Who can join |
|---|---|---|
| Public | Anyone, including signed-out visitors | Any authenticated user |
| Community | Authenticated users only | Any authenticated user |
| Private | Members only | Invitation or host approval |

### Seeded Gatherings

Five Gatherings are defined. **Three open at launch; two are held back** until they can be populated with real content and a posting rhythm is established.

All seeded Gatherings are created by a dedicated platform-owned service account — not the personal admin account. This ensures that the platform's core spaces are not coupled to the lifecycle of any individual admin's credentials.

**Opens at launch (must have minimum starter content before opening):**

| Gathering | Purpose | Visibility | Minimum starter content |
|---|---|---|---|
| **Daily Scripture Reflection** | A daily passage, reflection prompt, and replies | Public | 3 starter threads |
| **Prayer Wall** | Prayer requests and encouragement | Community | 2 prayer prompts (real and pastoral, not platform-generated) |
| **Questions About the Bible** | Sincere Bible questions and Scripture-grounded answers | Public | 3 starter questions |

**Held back — do not open until properly populated:**

| Gathering | Purpose | Visibility |
|---|---|---|
| **New Believers** | Christian foundations, encouragement, and beginner questions | Community |
| **Christian Living** | Discipleship, habits, obedience, family, work, temptation, forgiveness | Public |

**Rationale**: three active spaces feel intentional; five empty spaces signal neglect. New Believers and Christian Living open when they have enough content to demonstrate tone, not on a date.

**On Prayer Wall content specifically**: seed posts must not be performative or generic. 1–2 real prayer themes framed pastorally, short and specific, written in the platform's intended voice. The moment seed content sounds automated, the space loses its character.

**Creator onboarding is held back at launch.** Users with `trusted_user` status who want to create Gatherings will be able to do so technically, but no public invitation to create Gatherings will be made until the three launch spaces have established visible norms. The governance model must be imitable before it is decentralized.

---

## 3. Content Types

### Threads

A Thread is a written discussion started by any member of a Gathering. Threads are the primary vehicle for Bible questions, study reflections, testimonies, and fellowship conversation.

Threads must be:
- Genuine in intent — not rhetorical traps, bait, or provocation
- Substantive — a single sentence with no question or point is not a Thread
- On-topic for the Gathering's stated purpose

### Replies

A Reply is a response to a Thread. Replies must advance the conversation, not derail it. A Reply that attacks the person rather than engaging the idea is not a Reply — it is a conduct violation.

### Prayer Requests

A Prayer Request is a distinct object, not a Thread. It signals vulnerability and asks for intercession. It should be treated with care by all members. Moderators may remove prayer requests only for clear policy violations (spam, exploitation, fabricated crisis to solicit funds).

Prayer Requests are not a place for debate. Replies to Prayer Requests should be supportive or prayerful, not critical or corrective.

### Study Posts

A Study Post is host- or moderator-published content: structured teaching, commentary, or a curated passage. Members may Reply to Study Posts but cannot create them. Study Posts are curated, not open.

---

## 4. Trust Levels and Promotion

VerbumScribe uses a hybrid trust model. The system tracks eligibility signals and surfaces candidates for review. Promotion itself is always a human decision. These two states are distinct and must not be collapsed:

- **`eligible_for_trusted_review`** — the system has detected that a user meets all eligibility criteria. This is a flag that triggers admin attention. It does not confer any new capability.
- **`trusted_user`** — an admin has reviewed the user and made the affirmative decision to promote them. This is what grants new capabilities.

A user can be eligible and not trusted. A user cannot be trusted without first being reviewed. The gap between those two states is intentional — it is where human judgment lives.

### Why Trust Is Manual at MVP

Spiritual community cannot be safely governed by engagement metrics alone. A user can accumulate five replies and not be the kind of person you want hosting a Gathering. A user can be quiet and still be the right person to trust. Automatic promotion optimizes for activity, not character.

At this stage of the platform, the admin team knows — or can know — who is in the community. That proximity is an advantage. Automation would eliminate it before there is enough behavioral data to replace it safely.

Trust automation is deferred, not rejected. Once the platform has enough data to understand what good-faith participation actually looks like over time, it becomes possible to design rules that don't reward gaming. That data does not exist yet.

### Level 0 — New Member

Granted on account creation.

**Can:**
- View public and community Gatherings
- Join Gatherings
- Create Threads (Bible questions, study discussions, testimonies) within Gatherings they have joined
- Submit Prayer Requests within Gatherings they have joined
- Reply to Threads and Prayer Requests
- Report content

**Cannot:**
- Create a Gathering
- Request a moderator role
- Moderate any content
- Invite others to private Gatherings
- Create Study Posts

### Eligibility for Trusted Review

A user becomes **eligible for trusted review** when they meet all of the following criteria simultaneously. These are gates, not a scoring system — all must be satisfied.

| Signal | Requirement |
|---|---|
| Account age | At least 14 days since creation |
| Email verification | Email must be verified |
| Profile completion | Display name set; profile not blank |
| Gathering participation | Joined at least 1 Gathering |
| Constructive interactions | At least 5 across: Threads created, substantive Replies (not one-word), Prayer Requests submitted, or Prayer Acknowledgments made |
| Standing: strikes | No active strikes (a strike is a recorded moderation action against the account) |
| Standing: reports | No unresolved serious reports (harassment, exploitation, sexual misconduct, scam) |

Being eligible does not change what a user can do. It surfaces them to admins for possible review.

**What disqualifies eligibility (automatic disqualification, regardless of other signals):**
- Any unresolved serious report
- Any active strike within the past 60 days
- Email not verified
- Account younger than 14 days

Clearing a disqualification (e.g., a strike expires) restores eligibility — the user re-enters the candidate pool and may be reviewed.

### Promotion to Trusted Member (Admin Review)

When a user appears in the admin's trusted review queue, the admin reviews their history and makes a deliberate decision to approve or decline. This decision is logged.

**What admins should look for during review:**

*Indicators of good faith:*
- Replies that engage with the actual content of a Thread, not just a reaction
- Prayer requests that reflect genuine need, not platform exploration
- Participation that shows the user understands the purpose of the Gathering they are in
- Absence of complaints from Gathering hosts or moderators
- Consistency — a user who was active, then quiet, then active again is not a concern; a user who only engaged heavily right before eligibility is

*Indicators of concern (should delay or decline promotion):*
- History of strong opinions expressed without any indication of listening
- Replies that consistently redirect conversation to their own agenda
- Activity that looks like it was performed to meet eligibility criteria (e.g., five rapid generic replies on the same day)
- Any complaint from a host or moderator about conduct in a Gathering
- Profile or display name that is misleading or impersonating

*When to decline rather than defer:*
Decline (not just defer) if there is a specific conduct concern. A deferred user remains in the queue and may be reconsidered. A declined user should have a note recorded explaining why.

### Level 1 — Trusted Member

Granted by platform admin after explicit review and approval of an eligible user.

**Additional capabilities:**
- Create a Gathering — at creation time they are automatically inserted into `gathering_members` with `role = 'host'`. This is not a separate step; it happens in the same transaction as the Gathering insert.
- Request a moderator role within a Gathering they belong to (but do not host)
- Create longer Study Threads (if the platform introduces thread length differentiation)

**As host of their own Gathering (auto-granted at creation):**
- Hide threads, replies, and prayer requests within their Gathering (reversible; logged)
- Restore previously hidden content
- Remove members from their Gathering
- Archive their Gathering

**Additional accountability:**
- Hosts are responsible for the conduct of their Gathering
- A Trusted Member who hosts a Gathering that becomes a repeated source of policy violations may have their trust level reviewed and revoked
- Requesting a moderator role does not guarantee it — the Gathering host decides

### Level 2 — Gathering Moderator

Granted by the host of a specific Gathering, and only to Trusted Members. Scoped to that Gathering only.

**Additional capabilities (within their Gathering):**
- Hide threads, replies, and prayer requests (reversible; logged)
- Restore previously hidden content
- Pin or unpin content
- Remove members from the Gathering

**Cannot (at MVP):**
- Act in Gatherings where they are not a designated moderator
- Override platform admin decisions
- Change any user's trust level
- Grant or revoke moderator status (host does this, not the moderator)
- See reports filed within the Gathering — reports are platform-admin-only at MVP (see Section 5)

### Level 3 — Platform Admin

Granted manually. Few. Trusted.

**Additional capabilities:**
- Act in any Gathering
- Review and action the trusted-review candidate queue
- Promote or revoke trust levels, with logged reason
- Permanently suspend accounts
- Review and resolve escalated reports
- Override Gathering moderator decisions, with logged reason
- Access all audit logs

---

## 5. Report Categories

Any member may report content. Reports are confidential — the reported user is not notified of who filed the report.

| Category | Description |
|---|---|
| **Harassment** | Direct personal attacks, threats, or targeted intimidation |
| **Spam** | Repeated or irrelevant promotion, automated-looking posting |
| **Exploitation** | Soliciting money, data, or personal information under false pretense |
| **Sexual misconduct** | Sexually explicit content, grooming behavior, or inappropriate contact |
| **Abuse or hate** | Content that demeans people based on identity |
| **Occult or harmful content** | Content promoting practices explicitly contrary to the platform covenant |
| **Scam** | Fraudulent claims, fake crises, financial manipulation |
| **Divisive teaching** | Repeated, disruptive promotion of teaching that fractures rather than builds community (see Section 6) |
| **Other** | Anything not covered above — requires written explanation |

Reports are a signal, not a verdict. A report opens a review; it does not remove content automatically at MVP.

---

## 6. Doctrinal Ambiguity — What Moderation Covers and What It Does Not

This section is explicit because doctrinal questions are the most common source of moderation confusion in Christian communities.

### What is behavior moderation

VerbumScribe enforces behavior, not belief. Behavior moderation covers:
- How you speak to others
- Whether you are honest
- Whether you are exploiting the platform
- Whether you are repeatedly disrupting community after correction

A person can hold minority theological views and be a good faith member. A person can hold mainstream views and be a destructive member. The difference is conduct.

### What is doctrinal moderation

VerbumScribe does not arbitrate theological disputes. The platform does not take positions on:
- Modes of baptism
- Eschatological frameworks
- Cessationism vs. continuationism
- Soteriological particulars
- Worship style
- Church polity
- Denomination identity

These are contested within orthodox Christianity and the platform does not presume to resolve them.

### What disagreement is allowed

Substantive theological disagreement is welcome. A member may:
- Argue for their position with evidence and reasoning
- Dispute another member's interpretation of a passage
- Raise concerns about a teaching shared in a Study Post
- Note doctrinal differences between traditions respectfully

A member may not:
- Declare that those who disagree are not Christian
- Repeatedly redirect every Thread in a Gathering to their disputed position
- Attack other members personally for their theological views
- Use prayer requests or other vulnerable content as platforms for correction

### Who decides borderline cases

At MVP: platform admins decide borderline cases with no appeal mechanism beyond direct contact. This is honest — the platform is small and admin judgement is the system. As scale grows, a review panel model should be considered.

The governing question in borderline cases: **Is this person engaging in good faith with the community, or are they using the community as a target?** A person who is genuinely seeking fellowship but disagrees on doctrine is a member to keep. A person who treats the community as an arena for their agenda is not.

---

## 7. Moderator Actions

### Hide vs. Remove — a deliberate distinction

**Hide** is the primary host and moderator action at MVP.

- Reversible: the original author can still see their own content; all other users cannot
- Not deleted: the row remains in the database; the content can be restored by a host, moderator, or platform admin
- Logged: every hide and restore is written to `moderation_log` with actor, target, timestamp, and optional note
- The author is not notified at MVP (notification mechanism TBD)

**Remove (hard delete)** is deliberately **deferred** at MVP. The operational risk of an irreversible action — applied to the wrong content on mobile — is higher than the value it adds at current scale. Hide covers the safety need. Hard-remove can be added once moderation volume and norms justify it.

If a situation genuinely requires content to disappear permanently (CSAM, fraud evidence, targeted harassment), platform admins handle it via the Supabase console, not through the app UI. That is an acceptable edge case at this scale.

### Gathering-Level Actions (Host and Moderator)

Both hosts and moderators can perform these actions within their Gathering. Hosts have these powers automatically (assigned at Gathering creation); moderators receive them from the host.

| Action | Effect | Reversible? | Logged? |
|---|---|---|---|
| Hide content | Hidden from all users except the author; author can still see their own content | **Yes** | **Always** |
| Restore content | Reverses a hide; content visible to all again | Yes | Yes |
| Pin content | Content surfaced to top of listing | Yes | No (informational only) |
| Remove member | Member removed from Gathering; can rejoin if public/community | Yes | Yes |

**Host-only actions:**

| Action | Effect | Reversible? | Logged? |
|---|---|---|---|
| Archive Gathering | Gathering closed to new content; existing content readable | Yes (reopen) | Yes |

Hosts and moderators act within their Gathering only. They cannot act on the platform user account.

### Platform Admin Actions

| Action | Effect | Reversible? |
|---|---|---|
| All host/moderator actions | As above, in any Gathering | Varies |
| Suspend account | User cannot sign in; content remains | Yes |
| Permanently deactivate account | User cannot sign in; content soft-deleted | No |
| Promote trust level | `trust_state` → `trusted_user` | Yes |
| Revoke trust level | `trust_state` → `standard_user` | Yes |
| Mark report resolved | Closes report with outcome and resolution note | Yes (reopen) |
| Override moderator decision | Restores or hides content over moderator's head | Yes |

---

## 8. Moderator Scope — Gathering vs. Platform

This distinction matters for accountability.

**The line:** Hosts and moderators moderate content visibility within their Gathering. Platform admins handle formal enforcement and report adjudication.

**Gathering hosts and moderators** are accountable to the host who designated them and to platform policy. They can act only within their Gathering. Their actions are scoped, reversible, and logged. If a moderator abuses their role (retaliating against members, selectively enforcing rules), they can be removed by the host or by a platform admin.

**Platform admins** are accountable to the platform itself. Their actions are logged. They operate across all Gatherings. An admin who acts in bad faith (retaliating against users, using access for personal benefit) is in violation of the platform's own governance standards.

A Gathering moderator cannot tell a platform admin what to do. A platform admin can override a host or moderator's decision but should do so sparingly and with a documented reason.

**On reports specifically:** All reports are visible to platform admins only at MVP. Hosts and moderators do not see who filed a report or its contents. This is intentional — host-visible reporting creates retaliation risk and privacy problems before moderation norms are mature. Host report visibility can be added when norms are established and the need is demonstrated.

---

## 9. Escalation Rules

| Situation | Handled by | Escalation path |
|---|---|---|
| Content violation in a Gathering | Host or moderator (hide action) | → Platform admin if host/moderator is unavailable or conflicted |
| Formal report filed against content | Platform admin only | No further escalation at MVP |
| Report against a Gathering moderator | Platform admin only | No further escalation at MVP |
| Report against a platform admin | — | Not defined at MVP; deferred |
| Cross-Gathering pattern of behavior | Platform admin | — |
| Potential legal issue (threats, CSAM, fraud) | Platform admin | → Legal / law enforcement immediately; content removed via Supabase console |

At MVP, escalation is manual. A user who cannot get resolution from a moderator contacts the platform directly (mechanism TBD — email, in-app form, or both).

---

## 10. Appeals

At MVP, the appeals process is simple and honest: **a user who believes a moderation action was wrong can contact the platform directly.**

There is no formal appeals tier, no independent review board, and no guaranteed timeline. This is appropriate for the current size of the platform and the current capacity of its team.

What the platform commits to at MVP:
- Good faith review of appeals submitted in writing
- A response within a reasonable time (defined as: we will try, without committing to a specific SLA)
- Not retaliating against users for appealing

What the platform does not commit to at MVP:
- Reversing all decisions
- Providing a detailed explanation of every moderation outcome
- External arbitration

When the platform grows, a more structured appeals process — potentially including a community panel — should be designed. That design is not premature now; it would be unused.

---

## 11. Abuse Cases and Expected Patterns

The following abuse patterns are anticipated and the governance model is designed to address them:

| Pattern | Description | Response |
|---|---|---|
| **Spam joining** | Bot or bad actor joining many Gatherings to post spam | Rate limit joins; require trust level for private invitations |
| **Prayer request exploitation** | Using prayer requests to solicit money or personal information | Moderator removal; possible account suspension |
| **Doctrinal siege** | User hijacking every Thread in a Gathering to promote a disputed position | Gather moderator removes member; escalate if cross-Gathering |
| **Coordinator attacks** | Multiple accounts coordinating to target a user or Gathering | Pattern visible in audit log; platform admin intervention |
| **Host abandonment** | Host leaves; Gathering loses its moderator | Admins can designate a new host; Gathering may be closed if inactive |
| **Moderator bias** | Moderator applies rules selectively (e.g., against one theological group) | Report to platform admin; admin can override and revoke moderator role |
| **Privacy violation** | Member shares private content from one context in another | Moderator removal; account review |
| **Impersonation** | User impersonates a pastor, teacher, or ministry | Immediate account action; platform admin |

---

## 12. Audit Logging Expectations

The following events must be logged at MVP. The `gathering_events` table captures the primary actions. Additional moderator-specific logging is planned for the governance implementation.

| Event | Logged | Who can see it |
|---|---|---|
| Gathering created | Yes (`gathering_created`) | Platform admin |
| Member joined | Yes (`gathering_joined`) | Platform admin |
| Member left | Yes (`gathering_left`) | Platform admin |
| Prayer request created | Yes (`prayer_request_created`) | Platform admin |
| Prayer acknowledged | Yes (`prayer_acknowledged`) | Platform admin |
| Study post created | Yes (`study_post_created`) | Platform admin |
| Discussion thread created | Yes (`discussion_thread_created`) | Platform admin |
| Private access denied | Yes (`private_access_denied`) | Platform admin |
| Content reported | **Logged** — via `file_content_report()` SECURITY DEFINER; stored in `content_reports` | Platform admin only |
| Moderator action (hide/restore) | **Not yet logged** — `moderation_log` table exists; hide/restore server actions not yet written | — |
| Trust level changed | **Logged** — via `approve_trust_user()` / `decline_trust_user()` SECURITY DEFINER; stored in `moderation_log` | Platform admin |
| Account suspended | **Not yet logged** | — |

Gaps marked "not yet logged" are the highest-priority additions before the host moderation action paths are built.

---

## 13. What Remains Manual at MVP

The following functions are intentionally manual at MVP. Automating them prematurely trades judgment for speed in ways that are not yet safe.

| Function | Manual process |
|---|---|
| Trust eligibility detection | System surfaces eligible users to admin queue; admin must take action |
| Trust level promotion | Admin reviews candidate; records approval/decline with note; grants flag |
| Trust level revocation | Admin decision; logged; user notified (mechanism TBD) |
| Report review | Admin reads report; decides action; records outcome |
| Moderator action logging | Currently unimplemented; must be added in governance build |
| Appeals | User contacts platform directly; admin reviews |
| Account suspension | Admin action via admin UI (TBD) or Supabase console |
| Host succession | Admin designates new host; logged |
| Cross-Gathering pattern detection | Admin queries `gathering_events` and report tables |
| Strike recording | Admin records strike against account with reason and expiry |

The trust promotion workflow is the highest priority for tooling. An admin reviewing eligibility from the Supabase console is not sustainable beyond a handful of users. The minimum viable admin surface is: a queue of eligible candidates, a way to view their activity, and a one-action approve/decline with a required note.

Priority order for tooling: trust review queue → report queue → moderator action log → appeals tracking → account management.

---

## 14. MVP Launch Sequence

This sequence is binding. Do not skip steps or reorder them.

### Pre-launch checklist (complete before any user can access the platform)

| Step | Description | Status |
|---|---|---|
| Admin auth hardened | `requirePlatformAdmin()` on all /admin routes; no browser-side privileged writes | Done |
| Governance schema applied | `trust_state`, `account_status`, `is_platform_admin`, `content_reports`, `moderation_log` | Done |
| Report path operational | `file_content_report()` SECURITY DEFINER with duplicate protection and private-gathering guard | Done |
| Trust gate on Gatherings | `trust_state = 'trusted_user'` required to create a Gathering; page-level explanation for standard users | Done |
| Platform service account created | Dedicated account (not personal admin) owns seed Gatherings | **Pending** |
| Seed Gatherings inserted | Daily Scripture Reflection, Prayer Wall, Questions About the Bible | **Pending** |
| Minimum starter content posted | 3 threads (DSR), 2 prayer prompts (PW), 3 questions (QAtB) — all real, none generic | **Pending** |
| Site header mobile nav | Hamburger pattern replaces horizontal nav links | **Pending** |

### Post-launch — in order

1. **Observe before expanding.** Watch how users interact with the three spaces before adding New Believers or Christian Living. Opening new spaces is a signal of health, not a target to hit.
2. **Establish posting rhythm.** Daily Scripture Reflection requires someone to post a new thread daily (or nearly so) for the first month. Decide now who does this and how.
3. **Run first trust review cycle.** When users are eligible, run the SQL workflow manually. Don't rush the first promotions — the first trusted creators set the visible standard.
4. **Open New Believers and Christian Living** only when they have real seed content and a person committed to participating in them actively.
5. **Invite trusted creators** after at least one creator has been promoted and their Gathering is visibly healthy. The invitation should reference something real, not just a policy document.

### What is not being built yet

| Item | Decision |
|---|---|
| `/admin/trust-queue` UI | Deferred — SQL workflow sufficient until review volume grows |
| `/admin/reports` UI | Deferred — Supabase dashboard query sufficient at MVP volume |
| Host moderation UI (hide/restore) | Next schema-touching task; requires `is_hidden` column on content tables |
| Moderator action log | Blocked on host moderation UI being built first |
| New Believers / Christian Living | Held back until populated |
| Creator onboarding announcements | Held back until norms are established |

---

## 15. What Belongs on `profiles`

The `profiles` table carries only the current authoritative state of a user. Everything that is a record of events belongs in a dedicated table.

| Field | Belongs on `profiles`? | Reason |
|---|---|---|
| `full_name`, `avatar_url`, `bio` | **Yes** | Identity |
| `trust_state` | **Yes** | Drives access decisions on every request; must be fast and always-present |
| `account_status` | **Yes** | Same — checked on every authenticated action |
| `is_platform_admin` | **Yes** | Same |
| `eligible_since`, `trust_reviewed_at`, `trust_review_note` | **Yes** | Metadata about the current trust decision, not a history |
| Report counts, strike counts | **No** → `content_reports`, `user_strikes` | History; computed from dedicated tables |
| Moderation action history | **No** → `moderation_log` | Append-only audit trail |
| Gathering membership and role | **No** → `gathering_members` | Per-gathering join table |
| Prayer acknowledgment history | **No** → `gathering_prayer_acknowledgments` | Per-request join table |

**`is_platform_admin` is read-only from application code.** It may be read for authorization decisions. It must not be exposed for mutation through any profile update path. RLS enforces this via a `WITH CHECK` clause that prevents a user from changing their own `is_platform_admin` value. Setting this flag is a manual Supabase dashboard operation.

---

## 16. Mobile-First UX Constraints

Mobile is the primary product surface for VerbumScribe. Desktop is the expanded version. This is a design priority inversion, not a responsive polishing pass. All governance and moderation flows must be completable by a moderator reviewing a report on their phone.

### What is shown first on mobile

The primary action for each screen is always visible without scroll:

| Screen | Primary action shown first | Secondary (below or behind tap) |
|---|---|---|
| Gathering overview | Join / Leave button (full-width) | Member count, metadata, tabs |
| Thread view | Reply input pinned to bottom | Thread metadata, reply count |
| Prayer request view | "I'm praying" button | Praying count, request date |
| Report flow | Category selection | Optional note field |
| Moderator action sheet | Hide / Remove (top two) | Pin / Escalate |
| Admin trust card | Approve button (above Decline) | Candidate history, join date |
| Admin report card | Review button | Report category, date, count |

Metadata (member count, join date, interaction count) is always subordinate. It informs the decision; it does not compete for attention with the action.

### What is hidden or collapsed on mobile

The following elements are visible on tablet/desktop but collapsed or absent on mobile:

- Site header nav links — hidden behind hamburger (current debt; must be resolved before launch)
- Gathering grid layout — collapses to vertical stack
- Admin queue table view — collapses to stacked cards
- Moderator action labels in-line — replaced by bottom drawer
- Multi-column form layouts — always single column on mobile
- Secondary metadata (visibility badge, last activity) — collapsed below primary content or omitted

### How actions are prioritized on mobile

One primary action per screen. This is enforced by layout, not just convention:

- **Join a Gathering**: full-width button, nothing competing above it
- **Post a reply**: full-screen compose; keyboard fills lower half; one submit action
- **Submit a prayer request**: full-screen form; textarea + submit only; no sidebar
- **Report content**: bottom drawer; category first; optional note below; full-width submit at bottom
- **Moderator action**: bottom drawer; no more than 4 options; destructive actions require confirm

If a screen requires two important actions (e.g., Approve and Decline), they are both full-width and stacked, with the safer action on top. Destructive or irreversible actions are always second.

### Reporting flow on mobile

The report flow is designed to be completable one-handed in 3 taps:

1. Tap "..." menu on a Thread, Reply, or Prayer Request
2. Bottom drawer opens — tap **Report**
3. Category drawer: scrollable list; optional note field below; **Submit report** full-width at bottom

Confirmation state: "Report submitted" — no undo, no further options.

The report form must not require scrolling to reach the submit button on a standard phone viewport (375–390px wide). The note field is optional and placed below the category list; the submit button is always visible at the bottom of the drawer without requiring scroll.

### Moderator actions on mobile

Moderators access actions via long-press or "..." context menu on content. The action sheet shows at most 4 options:

1. Hide / Restore
2. Remove
3. Pin / Unpin
4. Escalate to admin

These are shown as labeled items, never icon-only. Destructive or irreversible actions (Remove) are separated from reversible ones (Hide, Pin) by a visual divider and require a confirmation step ("Hide this reply?" → Cancel / Confirm).

The confirmation step is not optional. Acting on the wrong item is a real failure mode on mobile — the confirmation prevents misfire.

Removing a member is accessed from the member's profile, not from content. This separation is intentional — removing content and removing a member have different weights and are not the same decision.

### Admin trust review on mobile

The trust review queue renders as single-column stacked cards. Each card shows:
- Display name and join date
- Interaction count and Gathering count
- Open reports, if any

Two actions: **Approve** (above) and **Decline** (below). Both are full-width buttons.

- Decline: tap → note field appears → Confirm decline (note required)
- Approve: tap → optional note → Confirm (note not required but allowed)

The admin must be able to review and act on a candidate without leaving the card view. The candidate's activity history is accessible via a detail tap, but the decision can be made from the card alone.

### How navigation changes across breakpoints

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Site header | Brand + hamburger | Brand + collapsed nav | Brand + full nav links |
| Gathering tabs | Horizontal scroll tab bar | Horizontal tab bar, no scroll | Horizontal tab bar |
| Gathering header | Stacked (name → metadata → join) | Side-by-side | Side-by-side |
| Content cards | Full-width stack | Full-width stack | Grid (2-col where appropriate) |
| Admin queues | Single-column cards | Single-column cards | Two-column or table |
| Moderation actions | Bottom drawer | Bottom drawer or inline menu | Inline dropdown |
| Forms | Full-screen, single column | Contained, single column | Contained, may be narrower |
| Report flow | Bottom drawer | Bottom drawer | Modal or inline panel |

The current site header (horizontal nav links) does not meet the mobile requirement. It must be replaced with a hamburger pattern before any public-facing launch.

### QA requirement for governance flows

Every governance feature (report, hide, remove, trust review, moderator action) must be verified at mobile width before desktop review.

Standard QA viewport for governance: **375×812** (primary), then **1280×800** (desktop).

Verification at mobile must confirm:
- All tap targets are ≥ 44×44px
- The flow is completable without horizontal scroll
- No step depends on hover
- Destructive actions have a visible confirmation step
- Back navigation is available without relying on browser chrome

---

## 17. What This Document Does Not Cover

- **User data deletion and export** — see separate privacy policy (not yet written)
- **DMCA and copyright** — not addressed at MVP
- **Financial transactions** — not present at MVP
- **Minor safety (COPPA)** — not addressed at MVP; platform should add an age gate before public launch
- **Legal holds** — not addressed at MVP
- **Advertiser policy** — not applicable; no advertising

These are real gaps. They should be addressed before any public-facing growth beyond a known, trusted cohort.
