# GridWatch Repository Audit

**Date:** May 2026  
**Scope:** Full codebase review prior to open-source release

## Architecture Summary

GridWatch is a **Vite + React 18 SPA** backed by **Supabase** (Postgres, Realtime, Edge Functions). There is no Next.js or custom REST API in this repository.

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React, TypeScript, Tailwind, Leaflet |
| Backend | Supabase Postgres + Realtime |
| Edge runtime | Deno (Supabase Functions) |
| AI | Perplexity API (`sonar` model) |
| Scheduling | pg_cron + pg_net |

## Data Flow

1. **Map UI** loads `nodes` with Realtime `UPDATE` subscriptions.
2. **Users** report via `report-power` → aggregates reports → updates `nodes`, `grid_status`, `grid_events`.
3. **AI ingest** (`ai-ingest`) searches social/news, writes `ai_events`, may update nodes (confidence > 60).
4. **Cleanup** (`cleanup-old-data`) purges 48h+ data and auto-expires stale outages.

## Security Findings (Resolved)

| Issue | Severity | Resolution |
|-------|----------|------------|
| `.env` committed to git | Critical | Removed from tracking; `.env.example` added |
| Public INSERT on `reports` | High | RLS policy dropped; writes via edge function only |
| Unprotected admin functions | High | `CRON_SECRET` header required |
| CORS `*` | Medium | Documented; acceptable for public read API |
| Anonymous session rate limits | Low | Documented limitation |

## Dead Code Removed

- `src/data/nigeriaNodes.ts` (unused mock data)
- `src/App.css`
- 45 unused shadcn/ui components
- `lovable-tagger` dev dependency

## Duplicate Logic Consolidated

- `recalculateGridStatus()` → `supabase/functions/_shared/grid-status.ts`

## Missing Items (Addressed)

- LICENSE, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT
- CI pipeline (GitHub Actions)
- Docker self-hosting
- Version-controlled cron jobs
- Production README

## Recommended Post-Launch

1. Rotate Supabase anon key if `.env` was ever public
2. Human-in-the-loop queue for AI node updates
3. Integration tests for edge function aggregation
4. Materialized views if node count exceeds 10k+
