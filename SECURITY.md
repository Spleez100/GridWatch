# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in GridWatch, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, email or open a private security advisory with details including:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to acknowledge reports within 48 hours and provide a fix timeline within 7 days for confirmed issues.

## Security Practices

- Never commit `.env` files or API keys
- Rotate `CRON_SECRET` and Supabase keys if exposed
- Use `report-power` edge function for user reports (direct DB inserts are disabled)
- Protect admin edge functions with `CRON_SECRET` header
