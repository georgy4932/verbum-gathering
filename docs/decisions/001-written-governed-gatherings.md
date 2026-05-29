# ADR 001 — Written, Governed Gatherings

**Status:** Accepted  
**Date:** 2026-05-29  
**Deciders:** Product (eodeh2005@gmail.com)

---

## Context

VerbumScribe is being built as a Christian fellowship platform. The initial implementation shipped a Gatherings module — community spaces with study, discussion, prayer, and live session tabs — with basic auth gating and a feature-flagged creation flow.

Several architectural directions were available at this decision point:

1. Open social network — anyone creates anything, scale first, moderate later
2. Broadcast platform — ministers publish, users consume, no peer creation
3. Governed fellowship network — user-created spaces within a trust and moderation framework
4. Video-first community — LiveKit as the primary interaction mode

The platform had already built toward option 3 in code, but the product model had not been formally stated.

This ADR records the binding decision and its consequences.

---

## Options Considered

### Option A — Open creation, retroactive moderation

Allow any authenticated user to create a Gathering. Moderate after the fact when reports arrive.

**Rejected because:** Spiritual community requires governance before scale, not after. A Gathering created by a bad-faith actor — and populated with vulnerable users before moderation intervenes — causes real harm. The cost of reactive moderation in this context is higher than in a general social network.

### Option B — Curated directory, no user creation

Platform-managed Gatherings only. Users join but never create.

**Rejected because:** It eliminates the community model. VerbumScribe's value is peer fellowship, not platform-broadcast. A curator bottleneck would prevent the network from forming organically.

### Option C — Governed fellowship network (selected)

User creation is gated by trust. Trust is earned, not purchased. Moderation is first-class architecture, not an afterthought. The platform grows through trusted relationships, not open enrollment.

**Accepted.**

### Option D — Video-first (LiveKit)

Prioritize real-time video and audio as the primary interaction mode.

**Deferred.** Written community precedes video community. The governance model must be established for text-based interaction before introducing real-time modalities that are harder to moderate.

---

## Decision

**VerbumScribe Gathering is a governed fellowship network. Governance is first-class product architecture, not an operational layer added after growth.**

The specific decisions within this are:

### 1. Gatherings are user-created spaces, not platform-curated directories

Any trusted user may create a Gathering. The platform does not curate which Gatherings exist. Hosts are accountable for the conduct of their Gathering.

### 2. Gathering creation is trust-gated

A new user cannot create a Gathering. Gathering creation requires Trusted Member status. Trust is not automatically conferred — it requires admin review and approval.

### 3. Trust progression is hybrid: system-detected eligibility, human approval

The system tracks eligibility signals:
- Account age ≥ 14 days
- Email verified
- Profile completed
- Joined ≥ 1 Gathering
- ≥ 5 constructive interactions (threads, replies, prayer requests, prayer acknowledgments)
- No active strikes
- No unresolved serious reports

When all signals are satisfied, the user enters the trusted review queue. An admin reviews and either approves or declines with a recorded reason. **System eligibility does not confer trust. Admin approval does.**

These two states — `eligible_for_trusted_review` and `trusted_user` — are distinct and must not be collapsed in implementation.

### 4. Moderation is Gathering-scoped first, platform-wide second

Gathering hosts designate moderators. Moderators act within their Gathering only. Platform admins act across all Gatherings. This scope distinction is enforced in the permission model, not just in policy.

### 5. Audit logging is a product requirement, not an operational nice-to-have

Every material action — creation, membership changes, content changes, trust level changes, moderation actions — must be logged. The log is the foundation of accountability.

### 6. LiveKit and open video sessions are deferred

The Gatherings live session tab (scheduled sessions with metadata) is implemented. The LiveKit real-time video infrastructure is not. This is intentional. Video-based community is harder to moderate and creates safety surface area that is not appropriate until the text-based governance model is stable.

### 7. Gathering creation is not open to all users

Even after public launch, new users cannot create Gatherings. This is a permanent feature of the model, not a temporary gate. The trust requirement may be relaxed in specific ways over time (e.g., a faster path for users with verified pastoral credentials), but the gate itself remains.

---

## Consequences

### What this enables

- A community that grows through relationships and accountability rather than viral adoption
- Hosts who are genuinely invested in their Gathering (they had to earn the right to create it)
- A moderation surface that is bounded by trust level rather than open to all
- An audit log that provides a basis for pattern detection and appeals

### What this constrains

- Growth is intentionally slower than open creation would allow
- Admin overhead is higher during the early phase (manual trust review)
- Users who want to create a Gathering immediately cannot; some will leave
- The trust queue must be actively managed — an unreviewed queue is a blocked user experience

### What this does not foreclose

- Future acceleration of the trust path (e.g., verified credentials, church affiliation)
- Future partial automation of eligibility review once behavioral data exists
- Future LiveKit integration once text-based governance is stable
- Future moderator tooling that reduces manual admin burden

---

## What We Are Intentionally Not Building Yet

| Item | Reason deferred |
|---|---|
| LiveKit real-time video | Written community first; moderation surface not ready |
| Automatic trust promotion | No behavioral data to calibrate; gaming risk too high |
| Open Gathering creation | Governance precedes scale; trust gate is permanent |
| Formal appeals board | Not needed at current user volume; add when manual process breaks |
| Community-visible moderator actions | Adds social pressure to moderation; defer until model is stable |
| Monetization, subscriptions, tiers | Not the current focus |
| Public API | Not the current focus |
| Reporting to third-party trust/safety systems | Not at current scale |
| Age verification or COPPA compliance | Required before any public-facing growth; not yet implemented |

---

## Review Triggers

This ADR should be revisited if:

- The admin trust review queue grows beyond what two people can manage weekly
- A significant pattern of bad-faith Gatherings emerges that the current trust gate did not prevent
- The behavioral signal data accumulates enough to support calibrated auto-eligibility thresholds
- A credentialed pathway (pastor, ministry) creates demand for a faster trust path
- LiveKit is ready to be integrated with governance controls in place
