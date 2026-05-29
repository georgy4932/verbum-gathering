# ADR-004: Stewardship Invariant

**Status:** Accepted  
**Date:** 2026-05-29

## Context

VerbumScribe is a platform built around prayer, Scripture, and fellowship. Its primary spaces — the Prayer Wall, Daily Scripture Reflection, and discussions — carry genuine relational and spiritual weight. The risk specific to this platform is not spam or low-quality content; it is that a person shares something vulnerable and no one notices.

Standard product design optimizes for engagement, retention, and growth. Those are not the right optimization targets for VerbumScribe. The wrong metric for this platform is not "too many" interactions — it is a person who shared a prayer request or a quiet struggle and received no response.

## Decision

The platform adopts the following primary invariant:

> **VerbumScribe must never knowingly leave a vulnerable share unacknowledged.**

This is more important than engagement, retention, and growth. It is the lens for evaluating features, workflows, and any future automation.

A companion principle governs how systems support this invariant:

> **The purpose of stewardship systems is to surface moments that may require human presence, not to automate community judgment.**

Systems exist to improve human awareness and prioritization. They do not replace discernment.

## Definitions

### Vulnerable share (Phase 1)

A vulnerable share is any member contribution that contains one or more of:

- a prayer request
- a personal struggle
- a confession of weakness
- an honest spiritual question
- a request for guidance or support

**Not treated as vulnerable** unless they also contain one of the above:

- casual reactions
- routine agreement or "Amen" comments
- generic pleasantries
- admin or tech questions
- content that already has substantive, thoughtful engagement

Phase 1 systems do not classify vulnerability automatically. Deterministic signals surface candidates; human stewards decide what was genuinely vulnerable.

### Acknowledgment vs. resolution

- **Acknowledgment** = meaningful human presence: a short, specific reply, not an automated "noted."
- **Resolution** = solving the underlying problem (pastoral, theological, or practical).

This ADR commits to acknowledgment, not to comprehensive resolution or counseling. The platform is not a pastoral care service. It is a community where no one should feel unseen.

## Priority order when attention is limited

1. **Prayer Wall** — pastoral witness, highest likelihood of relational or spiritual risk.
2. **Daily Scripture Reflection** — habit loop and visible platform rhythm.
3. **Questions About the Bible** — depth and discussion space.

If you must choose between an unanswered prayer request and a first-time post that already has replies, the prayer request wins.

## Separation of stewardship from governance

Do not collapse all "things that matter" into one queue:

| Category | Purpose | Examples |
|---|---|---|
| Stewardship | Care and presence | Prayer requests, lonely threads, first-time participation |
| Governance | Norms, safety, enforcement | Reports, moderation review, trust review |
| Observations | Pattern awareness (no immediate judgment) | Tone risks, unusual activity, coordinated behavior |

A separate governance invariant will be defined later:
> VerbumScribe must never knowingly leave a credible report of harm unreviewed.

That is a governance invariant, distinct from stewardship.

## Phase 1 implementation constraints

Phase 1 uses the smallest reliable system that protects the stewardship invariant:

- No AI classification
- No automated moderation, pastoral replies, doctrinal scoring, or trust recommendations
- No new dashboard, no real-time alerts

The canonical stewardship tool is the **Morning Steward Digest**: one deliberate review moment per day.

## Evaluation test for all future work

When generating features, workflows, moderation tools, AI assistants, dashboards, or notification systems, run this test:

> Does this help a human notice and respond to vulnerable shares, or does it distract attention away from them?

If the answer is "distract" or "neutral while adding complexity," it should not be prioritized.

## What this ADR does not decide

- The exact mechanism for surfacing vulnerable shares (see governance doc, Stewardship section)
- Whether moderators or only platform admins perform stewardship
- The format or delivery of the Morning Steward Digest
- Any automated vulnerability classification
- The governance invariant for reports (separate ADR)
