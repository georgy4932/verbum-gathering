# VerbumScribe Architecture

**Version:** 1.0
**Status:** MVP
**Last Updated:** 2026

---

# Overview

VerbumScribe is a mobile-first Christian discipleship platform built around Scripture, prayer, fellowship, and written community engagement.

The platform follows a modern web architecture using:

- Next.js
- Supabase
- Vercel
- TypeScript
- Tailwind CSS

---

# System Architecture

Users
    ↓
Next.js Application
    ↓
Supabase
├── Authentication
├── Database
├── Storage
└── Realtime

Deployment
└── Vercel

---

# Frontend

## Framework

Next.js (App Router)

Purpose:

- Routing
- Server Components
- Client Components
- API Routes
- SEO

---

## Language

TypeScript

Purpose:

- Type safety
- Better maintainability
- Reduced runtime errors

---

## Styling

Tailwind CSS

Purpose:

- Rapid UI development
- Consistent design system
- Responsive layouts

---

# Backend

Supabase provides backend services.

No custom backend server is required for MVP.

---

# Authentication

Provider:

Supabase Auth

Supported:

- Email signup
- Email login
- Email verification
- Password reset

Future:

- Google OAuth
- Apple Sign In

---

# Database

Database:

Supabase PostgreSQL

Core Tables:

- profiles
- gatherings
- gathering_members
- study_posts
- comments
- prayer_requests
- prayer_responses
- notifications

See:

/docs/database-schema.md

---

# Storage

Supabase Storage

Buckets:

## avatars

Stores user profile images.

Example:

avatars/{user-id}/avatar.png

---

## gathering-covers

Stores gathering cover images.

Example:

gathering-covers/{gathering-id}/cover.png

---

# Realtime

Supabase Realtime

Future use cases:

- Live notifications
- Prayer updates
- Discussion updates
- Presence indicators

Not required for MVP launch.

---

# Deployment

Provider:

Vercel

Environment:

Production

Current deployment:

https://verbum-gathering.vercel.app

Future custom domain:

https://verbumscribe.app

---

# Application Structure

app/
components/
lib/
hooks/
public/
supabase/

docs/

---

# Feature Architecture

## Profiles

Users create:

- Display name
- Avatar
- Bio

Profile data stored in:

profiles

Avatar stored in:

avatars bucket

---

## Gatherings

A Gathering is a discipleship community.

Contains:

- Home
- Study
- Discussion
- Prayer

Roles:

- Host
- Moderator
- Member

---

## Study

Written teaching content.

Supports:

- Title
- Content
- Scripture references
- Discussion

Stored in:

study_posts

---

## Discussion

Threaded comments.

Supports:

- Replies
- Community discussion
- Moderation

Stored in:

comments

---

## Prayer

Prayer-focused engagement.

Supports:

- Requests
- Praise reports
- Testimonies
- Prayer responses

Stored in:

prayer_requests
prayer_responses

---

# Notifications

MVP:

In-app notifications

Future:

- Push notifications
- Email notifications

---

# Security

Security model:

Row Level Security (RLS)

All database access controlled through Supabase policies.

Principles:

- Users edit their own profiles
- Hosts manage their own gatherings
- Members access joined gatherings
- Private gatherings remain protected

---

# Performance Strategy

Use:

- Server Components where possible
- Pagination for large discussions
- Optimized image loading
- Static rendering where appropriate

---

# Monitoring

Platform:

Vercel Analytics

Future:

- Error monitoring
- User analytics
- Performance dashboards

---

# Future Architecture

Potential additions:

- Mobile applications
- Audio devotionals
- Ministry verification
- Event scheduling
- Push notifications
- AI-assisted study tools

---

# Architectural Principles

1. Simplicity first
2. Mobile-first experience
3. Scripture-centered design
4. Written engagement over passive consumption
5. Security by default
6. Community before virality

---

# Core Product Philosophy

VerbumScribe is not a social network.

It is not a livestream platform.

It is not church management software.

It is a place to gather around the Word.
