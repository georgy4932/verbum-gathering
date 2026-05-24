# VerbumScribe Database Schema

**Version:** 1.0  
**Status:** Draft for MVP  
**Database:** Supabase Postgres

---

# Core Tables

## profiles

Stores public user profile information.

```sql
profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
