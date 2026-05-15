# Changelog

All notable changes to GridWatch are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source documentation (README, CONTRIBUTING, SECURITY, LICENSE)
- Shared edge function modules (`_shared/cors`, `auth`, `grid-status`, `supabase`)
- Version-controlled cron jobs for `ai-ingest` and `cleanup-old-data`
- CI pipeline (lint, typecheck, test, build)
- Environment validation at startup
- React error boundary
- `.env.example` and gitignore for secrets

### Security

- Removed public INSERT policy on `reports` table
- Cron secret protection on admin edge functions
- Stopped tracking `.env` in version control

### Changed

- Refactored `report-power`, `cleanup-old-data` to use shared grid status module
- Package renamed to `gridwatch`

## [0.1.0] - 2026-03-08

### Added

- Initial GridWatch platform: realtime outage map, crowdsourced reports, AI ingest via Perplexity
- Supabase backend with nodes, reports, grid events, AI events
- TCN station and infrastructure seeding

[Unreleased]: https://github.com/Spleez100/GridWatch/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Spleez100/GridWatch/releases/tag/v0.1.0
