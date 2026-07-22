# Changelog

All notable changes to the **Veltro** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- None.

---

## [1.0.0] - 2026-07-21
### Added
- Integrated all Next.js frontend pages with actual FastAPI backend endpoints, removing mock datasets from runtime.
- Loading skeleton states on every metric card, chart, list, and database table.
- Localized error boundary states with manual retry buttons for api fetch failures.
- Multi-day range selector (7d, 30d, 90d) wired to analytics route query parameters.
- Active repository selector in sidebar connected to real repository list fetching.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) running Ruff linting and Pytest on pull request events.
- GitHub Actions CD workflow (`.github/workflows/deploy.yml`) for automated Render and Vercel builds.
- Weekly scheduler workflow (`.github/workflows/digest.yml`) calling `/digest/weekly/all` with service token authentication.
- Privacy Policy page and in-app documentation/help view.
- Comprehensive systems documentation including `README.md`, `architecture.md`, and `database-schema.md`.

### Security
- Enabled branch protection rules on `main` requiring successful CI passing before code merges.

---

## [0.5.0] - 2026-06-15
### Added
- Google Gemini API (`gemini-3.5-flash`) integration as the core intelligence engine.
- Encrypted user preference field for storing user-provided Gemini API keys.
- Server Actions for sending contact and rating notifications via Resend API.
- In-memory cache mechanism in `services/digest.py` to prevent redundant Gemini API rate consumption.
- FastAPI Routes:
  - `GET /digest/{repo_id}/weekly` (cached weekly digest retrieval).
  - `POST /digest/{repo_id}/regenerate` (forced regeneration bypass).
  - `GET /digest/{repo_id}/bottleneck/{login}` (contributor analysis).
  - `GET /digest/{repo_id}/history` (historical summaries archive).
- Webhook trigger to mark digests as stale (`is_stale = true`) when push or PR events are processed.

### Changed
- Replaced general layout with context-aware Gemini API Key status flags (`gemini_api_key_set: bool`) to confirm user setup without leaking raw credentials.

### Security
- Integrated symmetric Fernet encryption for Gemini API key persistence inside PostgreSQL `user_preferences`.

---

## [0.4.0] - 2026-05-10
### Added
- Next.js application shell featuring landing page, login page, dashboard view, Gantt timeline, and settings page.
- Veltro design system built on dark obsidian background (`#0a0a0f`) and electric indigo accents (`#6366f1`).
- Accessible component primitives using Radix UI layout elements.
- GSAP-driven scroll-animations on landing view.
- Recharts implementation for cycle-time historical line visualizations.
- Gantt-style PR lifecycle chart tracking waiting (blue), in review (amber), and merge (green) stages.
- Multi-concentric SVG circular visualizations for contributor activity logs.
- Next.js edge configuration for deploying directly on Vercel.

### Changed
- Configured Next.js rewrites (`/api/*`) in `next.config.mjs` to proxy backend requests and bypass same-site cookie limitations.

---

## [0.3.0] - 2026-03-20
### Added
- Relational schema migrations via Alembic.
- GitHub App client service `services/github.py` with app-level token minting, rate limit detection, and pagination.
- Repository services to fetch installation catalogs and initialize lightweight records (`is_synced = false`).
- Pull request service parsing authors, sizes, labels, and requested reviewers.
- Non-blocking background worker setup using FastAPI `BackgroundTasks` for repository synchronizations.
- Raw SQL query logic in `services/analytics.py` for cycle time, review latency, and deploy frequencies.
- Real-time event listener route `/webhooks/github` verifying HMAC-SHA256 headers.
- Sync logs endpoint and audit history views.

### Changed
- Transitioned routing payloads from ORM models to typed Pydantic v2 schemas under `schemas/`.

---

## [0.2.0] - 2026-01-15
### Added
- GitHub App OAuth handshake, integrating installation and authentication flows in one redirect.
- Double-token JWT auth scheme (Access/Refresh token pair) using HTTP-Only cookies.
- Revocation blocklist database table storing unique token `jti` UUID claims.
- Cryptographic Fernet utility package for symmetric data encryption at rest.
- FastAPI dependency injection helper `get_current_user` to secure private router paths.

### Security
- Enforced HTTP-Only, Secure, SameSite=Lax flags on JWT cookies to protect against XSS and CSRF.
- Added cryptographic token signature validations checking tamper states, missing sub claims, and expiration.
- Implemented state parameters during OAuth redirection to prevent replay attacks.

---

## [0.1.0] - 2025-11-20
### Added
- Monorepo folder tree setup separating `backend/` and `frontend/` directories.
- Production and hot-reload development Docker Compose structures.
- Split `.env` architecture keeping secret tokens isolated in non-client environments.
- Next.js rewrites configurations to route `/api/*` requests to Render services.
- Managed PostgreSQL engine instance configurations for remote Render DB.

---

## Notable Architectural Decisions

1. **Next.js API Proxy (`next.config.mjs`)**: Prevents SameSite cross-domain cookie rejections between Vercel and Render.
2. **GitHub App Scoped Permissions**: Restricts platform access to explicitly selected repositories instead of full account OAuth scopes.
3. **HTTP-Only Token Storage**: Eliminates token exfiltration vulnerabilities by hiding credentials from client-side JavaScript.
4. **JTI-Based Revocation List**: Allows instant logout and token invalidation on stateless JSON Web Tokens.
5. **Raw SQL for Analytics**: Replaces ORM queries with optimized SQL text queries for performant calculations.
6. **User-Provided API Keys**: Cost-isolates Gemini usage by letting teams use their own keys, preventing platform rate-limiting.
7. **Opportunistic Blocklist Purge**: Deletes expired token records during logout requests without requiring separate cron engines.
8. **Permanent `installation_id` Persistence**: Generates temporary 1-hour GitHub credentials on the fly instead of managing token refresh loops.

[Unreleased]: https://github.com/Milkessa97/Veltro/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Milkessa97/Veltro/compare/v0.5.0...v1.0.0
[0.5.0]: https://github.com/Milkessa97/Veltro/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Milkessa97/Veltro/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Milkessa97/Veltro/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Milkessa97/Veltro/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Milkessa97/Veltro/releases/tag/v0.1.0
