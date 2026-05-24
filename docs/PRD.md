# VerbumScribe Product Requirements Document (PRD)

**Version:** 1.0 (MVP)  
**Product:** VerbumScribe  
**Tagline:** The Word, with you.  
**Platform:** Mobile-first web application (PWA) with future native mobile support  
**Status:** Active Development

---

# Vision

VerbumScribe is a digital Christian ecosystem designed to help believers gather around Scripture, prayer, fellowship, and discipleship through meaningful written engagement.

Unlike social platforms built around attention, VerbumScribe is intentionally built around presence, reflection, and spiritual growth.

> Not to scroll. But to remain.

---

# Mission

To create a digital gathering place where believers engage deeply with God's Word and grow together through discipleship-centered communities.

---

# Problem Statement

Christian communities currently rely on fragmented tools:

- WhatsApp for communication
- Zoom for meetings
- Facebook Groups for community
- Bible apps for Scripture reading
- Email for discipleship content

This fragmentation weakens engagement and discipleship.

Believers need a dedicated space where Scripture, prayer, study, and fellowship coexist in one environment.

---

# Target Users

## Believers

Individuals seeking:

- Bible study
- Christian fellowship
- Prayer support
- Spiritual growth

## Ministry Leaders

Including:

- Pastors
- Teachers
- Evangelists
- Church leaders
- Small group leaders

Who need:

- Community spaces
- Bible study groups
- Discipleship environments

## Christian Organizations

- Churches
- Ministries
- Bible study networks
- Faith communities

---

# Product Pillars

## 1. Devotions

Daily Scripture-centered reflections.

### Features

- Daily devotion posts
- Scripture references
- Reflection prompts
- Save and bookmark functionality

### Goal

Encourage daily engagement with God's Word.

---

## 2. Gatherings

The core feature of VerbumScribe.

A Gathering is a discipleship-centered community where believers study Scripture, discuss faith, share prayer requests, and grow together.

Think:

> Reddit + Bible Study

Not:

> Zoom + Livestream

### Purpose

Allow ministries, churches, teachers, and believers to create meaningful Christian communities centered around the Word.

---

## 3. Prayer

A dedicated prayer experience.

### Features

- Prayer requests
- Praise reports
- Prayer prompts
- Prayer responses

No follower counts.

No popularity metrics.

No vanity engagement.

---

# Gatherings

## Gathering Types

### Public

Anyone can discover and join.

Examples:

- Romans Study
- Prayer Community
- Christian Founders

### Community

Visible only to authenticated VerbumScribe members.

Membership required.

### Private

Invite-only.

Examples:

- Leadership Teams
- Mentorship Groups
- Church Staff

---

# Gathering Structure

Every Gathering contains the following sections.

## Home

Overview page.

Contains:

- Welcome message
- Description
- Announcements
- Upcoming activities

---

## Study

Teaching content published by the host.

Supports:

- Bible studies
- Written lessons
- Reflections
- Reading plans
- Scripture references

---

## Discussion

Threaded conversation system.

Supports:

- Questions
- Responses
- Nested replies
- Community discussion

---

## Prayer

Dedicated prayer space.

Supports:

- Prayer requests
- Praise reports
- Testimonies
- Prayer responses

Actions:

- Pray
- Encourage
- Comment

---

# User Roles

## Host

Creator of a Gathering.

Permissions:

- Edit Gathering
- Publish studies
- Manage members
- Moderate discussions
- Post announcements

---

## Moderator

Trusted assistants.

Permissions:

- Moderate discussions
- Remove content
- Assist with community management

---

## Member

Standard participant.

Permissions:

- Join Gatherings
- Participate in discussions
- Submit prayer requests
- Respond to content

---

# User Profiles

## Required

### Display Name

Examples:

- Sarah
- Michael A.
- Grace Walker

Display names are not required to be unique.

---

## Optional

### Profile Photo

Stored in Supabase Storage.

### Bio

Maximum 160 characters.

---

# Profile Visibility

Default profile information:

Visible:

- Display name
- Avatar
- Bio

Private:

- Reading history
- Prayer activity
- Participation history

---

# Authentication

## MVP

Supported:

- Email signup
- Email login
- Email verification
- Password reset

Not included:

- Google authentication
- Apple authentication
- Social sign-in providers

These may be added later.

---

# Notifications

Users receive notifications for:

- Replies to comments
- New study posts
- Prayer responses
- Gathering announcements

### MVP

In-app notifications only.

---

# Search

Users can search:

- Gatherings
- Studies
- Devotions
- Members

---

# Moderation

Hosts and moderators can:

- Delete content
- Remove members
- Report abuse
- Pin discussions

---

# MVP Features

## Authentication

- User registration
- Email verification
- Login
- Password reset

## Profiles

- Display name
- Avatar upload
- Bio

## Gatherings

- Create Gathering
- Join Gathering
- Public/private visibility
- Member management

## Study

- Rich text posts
- Comments
- Replies

## Prayer

- Prayer requests
- Prayer responses
- Praise reports

## Notifications

- In-app notifications

## Discovery

- Gathering search
- Gathering recommendations

---

# Non-Goals (MVP)

The following are intentionally excluded from version 1.

- Live streaming
- Video conferencing
- Donations
- Church management
- Event ticketing
- Courses and certificates
- Direct messaging
- Social media feeds
- Like systems
- Follower counts

---

# Success Metrics

## Activation

A user:

1. Creates an account
2. Verifies email
3. Completes profile
4. Joins a Gathering

---

## Engagement

Measured by:

- Weekly active users
- Study participation
- Prayer participation
- Discussion participation

---

## Community Growth

Measured by:

- Gatherings created
- Active Gatherings
- Members per Gathering
- 30-day retention

---

# Product Positioning

VerbumScribe is a discipleship platform where believers gather around Scripture, prayer, and meaningful discussion.

It is not a social network.

It is not a livestream platform.

It is not church management software.

It is a place to gather around the Word.

---

# Core Principle

The Word, with you.
