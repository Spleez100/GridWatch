# Contributing to GridWatch

Thank you for helping improve electricity transparency in Nigeria. This guide covers local development, conventions, and the pull request process.

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for database and edge functions)
- A Supabase project (cloud or local)

## Local Setup

```bash
git clone https://github.com/Spleez100/GridWatch.git
cd GridWatch
cp .env.example .env
npm install
```

Fill in `.env` with your Supabase URL and anon key.

### Supabase (local, optional)

```bash
supabase start
supabase db reset
supabase functions serve
```

Set edge function secrets:

```bash
supabase secrets set CRON_SECRET=your-secret PERPLEXITY_API_KEY=your-key
```

Configure cron database settings (see README → Cron Job System).

### Run the frontend

```bash
npm run dev
```

Open http://localhost:8080

## Branch Naming

| Prefix      | Use case                    |
| ----------- | --------------------------- |
| `feat/`     | New features                |
| `fix/`      | Bug fixes                   |
| `docs/`     | Documentation only          |
| `refactor/` | Code changes, no behavior   |
| `chore/`    | Tooling, deps, CI           |
| `test/`     | Tests only                  |

Example: `feat/add-disco-filter`

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(map): add severity filter to node markers
fix(report): handle duplicate report edge case
docs(readme): add Railway deployment guide
```

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make focused changes with clear commit messages
3. Run checks locally:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```
4. Open a PR with:
   - Summary of changes
   - Screenshots for UI changes
   - Test plan checklist
5. Address review feedback
6. Squash or keep commits clean before merge

## Coding Standards

- TypeScript strict mode — avoid `any`
- Match existing file structure and naming
- Edge function shared logic lives in `supabase/functions/_shared/`
- No secrets in code or commits
- Meaningful comments only on complex logic (AI pipeline, cron, propagation)

## Project Structure

```
src/                    # React frontend
  components/           # UI and feature components
  hooks/                # Data hooks (Supabase realtime)
  integrations/         # Supabase client & types
supabase/
  functions/            # Deno edge functions
  migrations/           # Postgres schema & RLS
```

## Questions?

Open a [GitHub Discussion](https://github.com/Spleez100/GridWatch/discussions) or issue tagged `question`.

Maintained by **Pelumi**.
