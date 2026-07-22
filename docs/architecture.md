# Veltro — System Architecture & Design Specification

This document provides a comprehensive technical overview of the Veltro system architecture, data flows, security mechanisms, and deployment infrastructure.

---

## 1. Executive Summary

Veltro is designed as a decoupled, multi-tenant engineering health platform that aggregates GitHub pull request activity into real-time metrics, Gantt-style lifecycle timelines, and AI-generated executive summaries. 

The architecture prioritizes **zero-trust security**, **strict data isolation**, **low latency analytics**, and **cost-isolated AI workloads**. Key architectural choices include:
- **Frontend Proxying**: Using Next.js rewrites to eliminate cross-domain HTTP-only cookie restrictions between Vercel and Render.
- **GitHub Apps Integration**: Enforcing fine-grained, repository-scoped access instead of broad account-wide OAuth scopes.
- **Hybrid Data Processing**: Combining FastAPI's asynchronous routing with optimized raw SQL for complex temporal analytics and window functions.
- **Encrypted Multi-Tenancy**: Utilizing Fernet symmetric encryption for token persistence and jti-based token blocklisting for stateless JWT revocation.

---

## 2. System Architecture Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   USER BROWSER                                   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                   HTTPS / Cookie Auth   │  User Interactions
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js on Vercel)                          │
│  - App Router (Server & Client Components)                                       │
│  - next.config.mjs Proxy Rewrites (/api/* ──► Render Backend)                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                     Proxied HTTPS       │  API Requests & Auth Headers
                     (Bypasses CORS)     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (FastAPI on Render)                           │
│  - Routes Layer (app/routes/)        ── Http Handlers & Auth Dependencies       │
│  - Services Layer (app/services/)    ── Business Logic & Ingestion Pipelines    │
│  - Models Layer (app/models/)        ── SQLAlchemy Database Models              │
└──────────────┬─────────────────────────┬─────────────────────────┬───────────────┘
               │                         │                         │
  Async SQL    │            HMAC-SHA256  │           Encrypted     │  Gemini 2.0
  Queries      │            Webhooks     │           API Requests  │  Prompts
               ▼                         ▲                         ▼
┌───────────────────────────┐ ┌──────────┴──────────┐ ┌───────────────────────────┐
│ DATABASE                  │ │ GITHUB PLATFORM     │ │ GOOGLE GEMINI API         │
│ (PostgreSQL 15 on Render) │ │ - Apps & Webhooks   │ │ - gemini-3.5-flash        │
│ - 10 Relational Tables    │ │ - REST & GraphQL API│ │ - User / Fallback Keys    │
│ - Fernet Encrypted Tokens │ └──────────▲──────────┘ └───────────────────────────┘
│ - Token Blocklist         │            │
└───────────────────────────┘            │ Scheduled Trigger (Monday 8AM UTC)
                                         │ & CI/CD Pipelines
                              ┌──────────┴──────────┐
                              │ GITHUB ACTIONS      │
                              │ - ci.yml            │
                              │ - deploy.yml        │
                              │ - digest.yml        │
                              └─────────────────────┘
```

---

## 3. Key Architectural Decisions

### 3.1 Vercel Proxy Rewrite for Cross-Domain Cookies
- **Choice**: Proxy all backend requests through Next.js `rewrites` in `next.config.mjs` (`/api/:path*` ──► `https://veltro-backend.onrender.com/:path*`).
- **Why**: Browsers block third-party `SameSite=Strict` or `SameSite=Lax` HTTP-only cookies across different root domains (e.g., `veltro.vercel.app` vs `veltro-api.onrender.com`). Proxying requests through the Next.js origin ensures cookies remain strictly first-party, eliminating cross-domain cookie restrictions without sacrificing security or exposing tokens to JavaScript.

### 3.2 GitHub Apps over Legacy OAuth Apps
- **Choice**: Integrate exclusively via GitHub Apps.
- **Why**: Legacy OAuth Apps grant broad, user-level permissions across all accessible repositories. GitHub Apps allow users to explicitly select specific repositories during installation (`installation_id`), enforcing principle of least privilege and providing granular repository-scoped tokens.

### 3.3 HTTP-Only Cookies over LocalStorage
- **Choice**: Store JWT access and refresh tokens exclusively in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Why**: Tokens stored in `localStorage` or `sessionStorage` are vulnerable to Cross-Site Scripting (XSS) attacks. Storing tokens in HTTP-only cookies guarantees that client-side JavaScript (including third-party npm packages) cannot read or exfiltrate authentication credentials.

### 3.4 JTI-Based JWT Token Blocklist
- **Choice**: Include a unique `jti` (JWT ID) UUID claim in every issued token and maintain a `token_blocklist` database table.
- **Why**: Standard JWTs are stateless and cannot be invalidated before expiration. When a user logs out or updates credentials, Veltro writes the token's `jti` and expiration timestamp to `token_blocklist`. The `get_current_user` dependency checks this blocklist on every protected request.

### 3.5 Raw SQL for Analytics Queries
- **Choice**: Use raw SQL via SQLAlchemy `text()` for temporal aggregation and metric calculations instead of ORM methods.
- **Why**: Calculating metrics like 90th percentile cycle time, review latency window functions, and weekly buckets across thousands of PRs requires complex `GROUP BY`, `EXTRACT(EPOCH)`, and window queries. Raw SQL executes in single-digit milliseconds at the database engine level, whereas ORM model hydration introduces massive memory and CPU overhead.

### 3.6 User-Provided Gemini API Keys
- **Choice**: Allow users to store their own encrypted Google Gemini API key in `user_preferences`, with a fallback to a system-wide key.
- **Why**: Isolates API rate limits and AI usage costs per user. High-volume teams can use their own quota without impacting other tenants or inflating platform operating expenses.

### 3.7 Opportunistic Blocklist Cleanup
- **Choice**: Purge expired `token_blocklist` entries inline during user logout requests (`DELETE FROM token_blocklist WHERE expires_at < NOW()`).
- **Why**: Eliminates the operational overhead of running a separate background cron job or celery task worker just to clean up expired revocation entries.

### 3.8 Storing `installation_id` instead of Installation Tokens
- **Choice**: Persist only the GitHub `installation_id` in the database, generating short-lived installation access tokens on demand.
- **Why**: GitHub installation tokens expire after 1 hour. Persisting temporary tokens creates complex token refresh loops and invalidation risks. Storing the permanent `installation_id` allows Veltro to mint fresh 1-hour installation tokens via JWT signatures signed with the App's private key (`GITHUB_PRIVATE_KEY`) whenever sync jobs execute.

---

## 4. Request Lifecycle Traces

### 4.1 Authenticated API Request (`GET /analytics/cycle-time`)

```text
[ Browser ] ──► (1) GET /api/analytics/cycle-time?repo_id=123 (Cookie: access_token=jwt...)
     │
     ▼
[ Next.js Proxy (Vercel) ] ──► (2) Rewrites path to https://backend/analytics/cycle-time
     │
     ▼
[ FastAPI Route Handler ] ──► (3) Invokes `get_current_user` dependency
     │                           ├── Extract JWT from cookie
     │                           ├── Decode & verify signature with SECRET_KEY
     │                           ├── Check `jti` in `token_blocklist` table
     │                           └── Hydrate User model from DB
     │
     ▼
[ Analytics Service ] ──► (4) Executes raw SQL via `db.execute(text(...))`
     │                       ├── Filter by `repository_id` AND `user_id` (FK validation)
     │                       ├── Calculate cycle times: EXTRACT(EPOCH FROM (merged_at - opened_at))
     │                       └── Return aggregated P50/P90 buckets
     │
     ▼
[ FastAPI Serialization ] ──► (5) Pydantic validates response shape
     │
     ▼
[ Browser ] ◄── (6) Receives JSON payload with HTTP 200 OK
```

### 4.2 GitHub Webhook Arriving (`pull_request.opened`)

```text
[ GitHub Event Bus ] ──► (1) POST /webhooks/github (Header: X-Hub-Signature-256)
     │
     ▼
[ FastAPI Webhook Route ]  ├── (2) Verifies HMAC-SHA256 signature using `WEBHOOK_SECRET`
     │                     |    └── If invalid: returns HTTP 401 Unauthorized
     │                     └── (3) Extract repository `github_repo_id` & payload details
     │
     ▼
[ Webhook Ingestion Service ]
     ├── (4) Locate `repositories` table record matching `github_repo_id`
     ├── (5) Upsert `pull_requests` record using ON CONFLICT (github_pr_id) DO UPDATE
     ├── (6) Upsert `contributors` record for PR author
     └── (7) Mark active `digests` for repository as `is_stale = true`
     │
     ▼
[ GitHub Event Bus ] ◄── (8) Returns HTTP 202 Accepted
```

---

## 5. Security & Isolation Model

### 5.1 Token Storage & Transmission
- **In Transit**: All traffic is enforced over TLS 1.3.
- **At Rest**: GitHub OAuth user access tokens and private user keys are encrypted prior to insertion into PostgreSQL using **Fernet symmetric encryption** (`ENCRYPTION_KEY`).
- **In Browser**: Auth tokens exist solely inside HTTP-only cookies configured with:
  - `HttpOnly`: Accessible only by HTTP requests, hidden from `document.cookie`.
  - `Secure`: Transmitted strictly over HTTPS.
  - `SameSite=Lax`: Mitigates Cross-Site Request Forgery (CSRF).

### 5.2 Webhook Signature Verification
Every payload received at `/webhooks/github` is validated before execution:
```python
expected_signature = "sha256=" + hmac.new(
    WEBHOOK_SECRET.encode(), payload_body, hashlib.sha256
).hexdigest()
if not hmac.compare_digest(expected_signature, request.headers.get("X-Hub-Signature-256")):
    raise HTTPException(status_code=401, detail="Invalid webhook signature")
```

### 5.3 Multi-Tenant Data Isolation
Data isolation is strictly enforced via database relational constraints and backend dependency scoping:

```
[ users ] ── (1:N) ──► [ user_repositories ] ── (N:1) ──► [ repositories ]
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │ (1:N)                   │ (1:N)
                                                    ▼                         ▼
                                           [ pull_requests ]           [ digests ]
                                                    │
                                                    ▼ (1:N)
                                               [ reviews ]
```

- All metrics endpoints accept a `repository_id`.
- The backend verifies that the authenticated `user_id` possesses an active linkage in `user_repositories` for that `repository_id`.
- Queries filter explicitly on validated `repository_id` foreign keys, preventing cross-tenant data leakage.

### 5.4 GitHub App Permission Scopes Requested
Veltro requests minimal read-only permissions during App registration:
- `Pull Requests`: Read-only (access to PRs, diff sizes, lifecycle timestamps).
- `Metadata`: Read-only (access to repository names, branch names, commit hashes).
- `Members`: Read-only (access to organization contributors and public avatars).

---

## 6. Data Ingestion & Synchronization

Veltro combines periodic full-sync reconciliation with event-driven real-time updates.

```
                     ┌───────────────────────────┐
                     │ Manual / Scheduled Sync   │
                     └─────────────┬─────────────┘
                                   │  PAGINATED REST FETCH
                                   ▼
┌──────────────────┐  UPSERT ON    ┌───────────────────────────┐
│ GitHub API       │──────────────►│ PostgreSQL Database       │
└──────────────────┘ UNIQUE KEYS   │ - UNIQUE(github_pr_id)    │
        │                          │ - UNIQUE(github_review_id)│
        │ REAL-TIME WEBHOOK        └───────────────────────────┘
        ▼                                  ▲
┌──────────────────┐                       │
│ /webhooks/github │───────────────────────┘
└──────────────────┘  EVENT UPSERT
```

### Unique Constraints & Upsert Pattern
To prevent duplicate records when manual syncs overlap with incoming webhooks, database tables enforce unique constraints on GitHub's global IDs:
- `pull_requests.github_pr_id` (Unique)
- `reviews.github_review_id` (Unique)
- `contributors.github_user_id` (Unique)

Ingestion pipelines utilize PostgreSQL upserts:
```sql
INSERT INTO pull_requests (github_pr_id, title, state, opened_at, merged_at, ...)
VALUES (:github_pr_id, :title, :state, :opened_at, :merged_at, ...)
ON CONFLICT (github_pr_id) DO UPDATE SET
    title = EXCLUDED.title,
    state = EXCLUDED.state,
    merged_at = EXCLUDED.merged_at;
```

---

## 7. Deployment & Automation Infrastructure

### 7.1 Infrastructure Topology

| Component | Provider | Configuration |
| :--- | :--- | :--- |
| **Frontend** | Vercel | Next.js App Router, automatic edge deployments from `main` branch |
| **Backend** | Render | FastAPI Web Service (Docker container), auto-deploy from `main` |
| **Database** | Render | PostgreSQL 15 Managed Instance with automated daily backups |
| **CI/CD & Cron** | GitHub Actions | Workflows for testing, deployment notifications, and cron digests |

### 7.2 GitHub Actions Workflows

1. **`ci.yml` (Continuous Integration)**
   - Triggers: On every Pull Request to `main`.
   - Actions: Runs `ruff check .` for linting and `pytest` for unit/integration testing inside Docker container environments.

2. **`deploy.yml` (Continuous Deployment)**
   - Triggers: On merge to `main`.
   - Actions: Triggers Render build webhooks for the backend service and notifies Vercel deployment hooks.

3. **`digest.yml` (Weekly Cron Job)**
   - Triggers: Scheduled cron (`0 8 * * 1` — Mondays at 08:00 UTC).
   - Process:
     ```text
     GitHub Actions Cron (08:00 UTC Monday)
       │
       ├── Send POST request to /api/digest/weekly/all
       │   └── Authorization: Bearer <SERVICE_TOKEN>
       │
       ▼
     FastAPI Backend
       ├── Query repositories with activity in past 7 days
       ├── Aggregate weekly metrics (P50 cycle time, review latency, PR count)
       ├── Prompt Gemini 2.0 API with structured metric context
       ├── Persist generated summary into `digests` table
       └── Mark `is_stale = false`
     ```
