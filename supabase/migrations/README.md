# Supabase SQL Migrations — Raqeem / رقيم

## Naming convention
All schema changes live as versioned SQL files in `supabase/migrations/`:

```text
YYYYMMDDHHMMSS_<short_snake_case_description>.sql
```

Example:
`20261119000100_initial_schema.sql`

## Security & RLS rules
1. Every table MUST enable Row Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
2. Default posture is **deny-by-default**.
3. Child photo uploads MUST live in a **private** Storage bucket with random paths and short-lived signed URLs for the allowlisted admin only.
4. Never commit real credentials, production data, or personal information in migrations or seed files.

## Applying migrations
- Locally via Supabase CLI: `supabase db push` or `supabase migration up`
- Remotely via Supabase MCP `apply_migration` against the `raqeem` project after review.
