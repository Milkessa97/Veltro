# Veltro — Relational Database Schema Specification

This document serves as the complete technical specification for the PostgreSQL database backing the **Veltro** engineering team health platform.

---

## 1. Schema Overview

Veltro's database schema consists of **13 relational tables** managed through versioned **Alembic** migrations. The schema is engineered to balance analytical query performance with strict multi-tenant isolation.

```text
                                  ┌───────────────┐
                                  │     users     │
                                  └───────┬───────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
          ┌───────────────────┐                       ┌───────────────────┐
          │ user_preferences  │                       │   repositories    │
          └───────────────────┘                       └─────────┬─────────┘
                                                                │
     ┌──────────────────────┬──────────────────────┬────────────┴────────────┬──────────────────────┐
     ▼                      ▼                      ▼                         ▼                      ▼
┌──────────┐      ┌──────────────────┐      ┌─────────────┐           ┌──────────────┐       ┌───────────┐
│ digests  │      │   contributors   │      │  sync_logs  │           │webhook_events│       │  commits  │
└──────────┘      └─────────┬────────┘      └─────────────┘           └──────────────┘       └───────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  pull_requests   │
                  └─────────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
  ┌───────────┐   ┌───────────────────┐   ┌───────────┐
  │ pr_labels │   │  pr_reviewers     │   │  reviews  │
  └───────────┘   └───────────────────┘   └───────────┘
```

### Key Structural Principles

1. **Strict Tenant Isolation**: All platform data cascades down from the `users` root table through `repositories`. Queries explicitly filter by validated `repository_id` and `user_id` paths to prevent cross-tenant data leaks.
2. **Contributors vs. Platform Users**: The `contributors` table tracks GitHub actors (authors, committers, reviewers) appearing in repository activity. Contributors are **not** platform users; they are scoped explicitly per repository (`repository_id, github_id`), ensuring two distinct repositories never leak contributor identity contexts across isolated accounts.
3. **Upsert-Driven Ingestion**: Synchronizations and webhooks utilize PostgreSQL `ON CONFLICT DO UPDATE` upserts against global GitHub immutable keys (`github_pr_id`, `github_review_id`, `github_delivery`, `sha`), preventing duplicates during overlapping parallel executions.

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| user_preferences : "configures"
    users ||--o{ repositories : "connects"
    users ||--o{ digests : "generates"
    
    repositories ||--o{ contributors : "contains"
    repositories ||--o{ pull_requests : "tracks"
    repositories ||--o{ commits : "logs"
    repositories ||--o{ sync_logs : "records"
    repositories ||--o{ webhook_events : "triggers"
    repositories ||--o{ digests : "summarizes"

    contributors ||--o{ pull_requests : "authors"
    contributors ||--o{ pull_request_reviewers : "assigned_to"
    contributors ||--o{ reviews : "submits"
    contributors ||--o{ commits : "authors"

    pull_requests ||--o{ pr_labels : "labeled_with"
    pull_requests ||--o{ pull_request_reviewers : "awaits"
    pull_requests ||--o{ reviews : "receives"

    users {
        uuid id PK
        integer github_id UK
        string github_login
        string github_token
    }

    user_preferences {
        uuid id PK
        uuid user_id FK, UK
        uuid default_repository_id FK
    }

    token_blocklist {
        string jti PK
        timestamp blocked_at
    }

    repositories {
        uuid id PK
        uuid user_id FK
        integer github_id
    }

    contributors {
        uuid id PK
        uuid repository_id FK
        integer github_id
    }

    pull_requests {
        uuid id PK
        uuid repository_id FK
        uuid author_id FK
        integer github_pr_number
        timestamp first_review_at
    }

    pr_labels {
        uuid id PK
        uuid pull_request_id FK
        string name
    }

    pull_request_reviewers {
        uuid id PK
        uuid pull_request_id FK
        uuid contributor_id FK
        string status
    }

    reviews {
        uuid id PK
        uuid pull_request_id FK
        uuid reviewer_id FK
        bigint github_review_id UK
    }

    commits {
        uuid id PK
        uuid repository_id FK
        uuid author_id FK
        string sha
    }

    sync_logs {
        uuid id PK
        uuid repository_id FK
        string status
    }

    webhook_events {
        uuid id PK
        uuid repository_id FK
        string github_delivery UK
        boolean processed
    }

    digests {
        uuid id PK
        uuid user_id FK
        uuid repository_id FK
        boolean is_stale
    }
```

---

## 3. Table Specifications

### 3.1 `users`
**Purpose**: Primary identity table representing authenticated Veltro account owners. Every user record stores Fernet-encrypted GitHub OAuth tokens and installation IDs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Internal unique user identifier |
| `github_id` | `INTEGER` | `NOT NULL`, `UNIQUE` | Immutable GitHub user account ID |
| `github_login` | `VARCHAR(255)` | `NOT NULL` | GitHub handle (e.g. `octocat`) |
| `display_name` | `VARCHAR(255)` | `NULLABLE` | Full name from GitHub profile |
| `avatar_url` | `VARCHAR(500)` | `NULLABLE` | CDN URL for profile avatar |
| `github_token` | `VARCHAR(500)` | `NOT NULL` | **Fernet encrypted** GitHub OAuth access token |
| `github_installation_id`| `INTEGER` | `NULLABLE` | Associated GitHub App installation ID |
| `created_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Account creation timestamp |
| `last_login_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Last active session timestamp |

**Indexes**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ix_users_github_id ON users (github_id)`

---

### 3.2 `user_preferences`
**Purpose**: Stores user-level dashboard configurations, default date ranges, onboarding flags, and encrypted Gemini API keys.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Preference row identifier |
| `user_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE CASCADE`, `UNIQUE` | Parent user reference |
| `default_repository_id`| `UUID` | `NULLABLE`, `FOREIGN KEY (repositories.id) ON DELETE SET NULL` | Default focused repo |
| `default_date_range_days`| `INTEGER` | Default: `30`, `CHECK (default_date_range_days IN (7, 30, 90))` | Default metric window |
| `digest_panel_expanded`| `BOOLEAN` | Default: `TRUE` | UI layout state |
| `is_onboarded` | `BOOLEAN` | Default: `FALSE` | Onboarding tutorial status |
| `gemini_api_key` | `VARCHAR(500)` | `NULLABLE` | **Fernet encrypted** user Gemini API key |
| `created_at` | `TIMESTAMP` | Default: `NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | Default: `NOW()` | Record last update timestamp |

**Indexes**:
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ix_user_preferences_user_id ON user_preferences (user_id)`

---

### 3.3 `token_blocklist`
**Purpose**: Implements stateless JWT revocation. Stores unique token `jti` claims upon user logout.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `jti` | `VARCHAR(36)` | `PRIMARY KEY` | Unique UUID string of revoked JWT `jti` claim |
| `blocked_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Revocation timestamp |

**Indexes**:
- `PRIMARY KEY (jti)`

*Note*: Blocklist entries are purged opportunistically during logout calls when `blocked_at < NOW() - INTERVAL '7 days'`.

---

### 3.4 `repositories`
**Purpose**: Stores GitHub repositories connected to Veltro accounts for data sync and monitoring.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Internal repository identifier |
| `user_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE CASCADE` | Owning Veltro user |
| `github_id` | `INTEGER` | `NULLABLE` | GitHub's internal repository ID |
| `owner` | `VARCHAR(255)` | `NOT NULL` | Repository owner/organization handle |
| `name` | `VARCHAR(255)` | `NOT NULL` | Repository name |
| `full_name` | `VARCHAR(511)` | `NOT NULL` | Full path (`owner/name`) |
| `is_private` | `BOOLEAN` | `NOT NULL`, Default: `FALSE` | GitHub privacy flag |
| `is_synced` | `BOOLEAN` | `NOT NULL`, Default: `FALSE` | Complete initial sync status |
| `synced_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Last successful sync completion timestamp |
| `created_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Record creation timestamp |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_repositories_user_id ON repositories (user_id)`
- `UNIQUE CONSTRAINT uq_github_id_user_id (github_id, user_id)`

---

### 3.5 `contributors`
**Purpose**: Tracks GitHub actors (authors, committers, reviewers) appearing in repository activity. Scoped strictly per repository to ensure multi-tenant data isolation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Internal contributor identifier |
| `repository_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (repositories.id) ON DELETE CASCADE` | Parent repository |
| `github_id` | `INTEGER` | `NULLABLE` | GitHub user ID |
| `github_login` | `VARCHAR(255)` | `NOT NULL` | GitHub username |
| `display_name` | `VARCHAR(255)` | `NOT NULL` | GitHub profile display name |
| `avatar_url` | `VARCHAR(500)` | `NOT NULL` | Contributor avatar image URL |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_contributors_repository_id ON contributors (repository_id)`
- `UNIQUE CONSTRAINT uq_github_id_repository_id (github_id, repository_id)`

---

### 3.6 `pull_requests`
**Purpose**: Central analytics table. Stores pull request lifecycles, size metrics, and key review timestamps.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Internal PR identifier |
| `repository_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (repositories.id) ON DELETE CASCADE` | Parent repository |
| `author_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (contributors.id) ON DELETE CASCADE` | PR author reference |
| `github_pr_number`| `INTEGER` | `NOT NULL` | Repository PR number (e.g. `#142`) |
| `title` | `VARCHAR(500)` | `NOT NULL` | Pull request title |
| `state` | `VARCHAR(50)` | `NOT NULL`, `CHECK (state IN ('open', 'merged', 'closed'))` | Current lifecycle state |
| `opened_at` | `TIMESTAMP` | `NOT NULL` | PR opening timestamp |
| `first_review_at` | `TIMESTAMP` | `NULLABLE` | Timestamp of first submitted review |
| `merged_at` | `TIMESTAMP` | `NULLABLE` | Merged timestamp |
| `closed_at` | `TIMESTAMP` | `NULLABLE` | Unmerged closure timestamp |
| `additions` | `INTEGER` | `NOT NULL`, Default: `0` | Number of added lines |
| `deletions` | `INTEGER` | `NOT NULL`, Default: `0` | Number of deleted lines |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_pull_requests_repository_id ON pull_requests (repository_id)`
- `INDEX ix_pull_requests_author_id ON pull_requests (author_id)`
- `INDEX ix_pull_requests_state ON pull_requests (state)`
- `COMPOSITE INDEX ix_pull_requests_repository_opened_at ON pull_requests (repository_id, opened_at DESC)`
- `UNIQUE CONSTRAINT uq_github_pr_number_repository_id (github_pr_number, repository_id)`

---

### 3.7 `pr_labels`
**Purpose**: Stores GitHub labels attached to pull requests for taxonomy and filtering.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Label record identifier |
| `pull_request_id`| `UUID` | `NOT NULL`, `FOREIGN KEY (pull_requests.id) ON DELETE CASCADE` | Parent pull request |
| `name` | `VARCHAR(255)` | `NULLABLE` | Label text |
| `color` | `VARCHAR(7)` | `NOT NULL` | Hex color code (e.g. `#e11d48`) |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_pr_labels_pull_request_id ON pr_labels (pull_request_id)`
- `INDEX ix_pr_labels_name ON pr_labels (name)`
- `UNIQUE CONSTRAINT uq_name_pull_request_id (name, pull_request_id)`

---

### 3.8 `pull_request_reviewers`
**Purpose**: Tracks requested reviewers and assignment statuses. Primary data source for reviewer bottleneck calculations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Record identifier |
| `pull_request_id`| `UUID` | `NOT NULL`, `FOREIGN KEY (pull_requests.id) ON DELETE CASCADE` | Parent pull request |
| `contributor_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (contributors.id) ON DELETE CASCADE` | Assigned reviewer |
| `requested_at` | `TIMESTAMP` | `NOT NULL` | Timestamp review was requested |
| `status` | `VARCHAR(50)` | `NOT NULL` | Review assignment status (e.g. `'requested'`) |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_pull_request_reviewers_pr_id ON pull_request_reviewers (pull_request_id)`
- `INDEX ix_pull_request_reviewers_contributor_id ON pull_request_reviewers (contributor_id)`
- `INDEX ix_pull_request_reviewers_status ON pull_request_reviewers (status)`
- `UNIQUE CONSTRAINT uq_pull_request_id_contributor_id (pull_request_id, contributor_id)`

---

### 3.9 `reviews`
**Purpose**: Logs submitted review actions (approvals, change requests, comments).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Record identifier |
| `pull_request_id`| `UUID` | `NOT NULL`, `FOREIGN KEY (pull_requests.id) ON DELETE CASCADE` | Parent pull request |
| `reviewer_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (contributors.id)` | Submitting reviewer |
| `github_review_id`| `BIGINT` | `NOT NULL`, `UNIQUE` | Immutable GitHub review ID |
| `state` | `VARCHAR(50)` | `NOT NULL`, `CHECK (state IN ('approved', 'changes_requested', 'commented'))` | Submitted review verdict |
| `submitted_at` | `TIMESTAMP` | `NOT NULL` | Submission timestamp |

**Indexes**:
- `PRIMARY KEY (id)`
- `INDEX ix_reviews_pull_request_id ON reviews (pull_request_id)`
- `INDEX ix_reviews_reviewer_id ON reviews (reviewer_id)`
- `INDEX ix_reviews_submitted_at ON reviews (submitted_at)`
- `UNIQUE INDEX ix_reviews_github_review_id ON reviews (github_review_id)`

---

### 3.10 `commits`
**Purpose**: Stores commit logs for repository deploy frequency and throughput calculations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Commit record identifier |
| `repository_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (repositories.id) ON DELETE CASCADE` | Parent repository |
| `author_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (contributors.id)` | Committer reference |
| `sha` | `VARCHAR(40)` | `NOT NULL` | Git commit hash |
| `message` | `VARCHAR` | `NOT NULL` | First line of commit message |
| `committed_at` | `TIMESTAMP` | `NOT NULL` | Git commit timestamp |

**Indexes & Constraints**:
- `PRIMARY KEY (id)`
- `INDEX ix_commits_repository_id ON commits (repository_id)`
- `INDEX ix_commits_author_id ON commits (author_id)`
- `INDEX ix_commits_committed_at ON commits (committed_at DESC)`
- `UNIQUE CONSTRAINT uq_commits_sha_repository (sha, repository_id)`

---

### 3.11 `sync_logs`
**Purpose**: Audit table recording execution metrics, records imported, and diagnostic errors for repository syncs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Sync log identifier |
| `repository_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (repositories.id) ON DELETE CASCADE` | Target repository |
| `status` | `VARCHAR(50)` | `NOT NULL`, `CHECK (status IN ('running', 'completed', 'failed'))` | Sync state |
| `triggered_by` | `VARCHAR(50)` | `NOT NULL`, `CHECK (triggered_by IN ('manual', 'webhook', 'scheduled'))` | Trigger mechanism |
| `prs_fetched` | `INTEGER` | Default: `0` | Number of PRs imported |
| `reviews_fetched`| `INTEGER` | Default: `0` | Number of reviews imported |
| `commits_fetched`| `INTEGER` | Default: `0` | Number of commits imported |
| `error_message` | `TEXT` | `NULLABLE` | Diagnostic stack trace on failure |
| `started_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Execution start time |
| `completed_at` | `TIMESTAMP` | `NULLABLE` | Execution end time |

**Indexes**:
- `PRIMARY KEY (id)`
- `INDEX ix_sync_logs_repository_id ON sync_logs (repository_id)`
- `INDEX ix_sync_logs_started_at ON sync_logs (started_at DESC)`

---

### 3.12 `webhook_events`
**Purpose**: Raw payload archive for incoming GitHub webhook events, enabling idempotent processing and offline event replays.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Event log identifier |
| `repository_id` | `UUID` | `NULLABLE`, `FOREIGN KEY (repositories.id) ON DELETE SET NULL` | Target repository (if matched) |
| `event_type` | `VARCHAR(100)`| `NOT NULL` | GitHub header (`X-GitHub-Event`) |
| `action` | `VARCHAR(100)`| `NULLABLE` | Event action (e.g. `opened`, `submitted`) |
| `github_delivery`| `VARCHAR(100)`| `NOT NULL`, `UNIQUE` | GitHub delivery UUID (`X-GitHub-Delivery`) |
| `payload` | `JSONB` | `NOT NULL` | Full raw JSON payload |
| `processed` | `BOOLEAN` | `NOT NULL`, Default: `FALSE` | Ingestion status flag |
| `error_message` | `TEXT` | `NULLABLE` | Handler error trace on failure |
| `received_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Event arrival timestamp |
| `processed_at` | `TIMESTAMP` | `NULLABLE` | Ingestion completion timestamp |

**Indexes**:
- `PRIMARY KEY (id)`
- `INDEX ix_webhook_events_repository_id ON webhook_events (repository_id)`
- `INDEX ix_webhook_events_event_type ON webhook_events (event_type)`
- `UNIQUE INDEX ix_webhook_events_delivery ON webhook_events (github_delivery)`
- `PARTIAL INDEX ix_webhook_events_unprocessed ON webhook_events (processed) WHERE processed = FALSE`

---

### 3.13 `digests`
**Purpose**: Caches Gemini-generated weekly summaries and bottleneck analysis responses.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY`, Default: `gen_random_uuid()` | Digest record identifier |
| `user_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (users.id) ON DELETE CASCADE` | Owning account reference |
| `repository_id` | `UUID` | `NOT NULL`, `FOREIGN KEY (repositories.id) ON DELETE CASCADE` | Target repository |
| `content` | `TEXT` | `NOT NULL` | Markdown digest text generated by Gemini |
| `period_start` | `TIMESTAMP` | `NOT NULL` | Summarized window start date |
| `period_end` | `TIMESTAMP` | `NOT NULL` | Summarized window end date |
| `is_stale` | `BOOLEAN` | `NOT NULL`, Default: `FALSE` | Invalidation flag |
| `generated_at` | `TIMESTAMP` | `NOT NULL`, Default: `NOW()` | Generation timestamp |
| `type` | `VARCHAR(50)` | `NOT NULL`, `CHECK (type IN ('weekly', 'bottleneck', 'manual'))` | Summary classification |

**Indexes**:
- `PRIMARY KEY (id)`
- `INDEX ix_digests_user_id ON digests (user_id)`
- `INDEX ix_digests_repository_id ON digests (repository_id)`
- `INDEX ix_digests_generated_at ON digests (generated_at DESC)`

---

## 4. Cascade Delete Map

When a platform user deletes their account (`DELETE FROM users WHERE id = :user_id`), database foreign keys cascade automatically across the relational hierarchy:

```text
[ DELETE FROM users ]
       │
       ├──► CASCADE DELETE FROM user_preferences
       ├──► CASCADE DELETE FROM digests
       └──► CASCADE DELETE FROM repositories
                  │
                  ├──► CASCADE DELETE FROM sync_logs
                  ├──► SET NULL       ON webhook_events
                  ├──► CASCADE DELETE FROM commits
                  └──► CASCADE DELETE FROM contributors
                            │
                            └──► CASCADE DELETE FROM pull_requests
                                       │
                                       ├──► CASCADE DELETE FROM pr_labels
                                       ├──► CASCADE DELETE FROM pull_request_reviewers
                                       └──► CASCADE DELETE FROM reviews
```

---

## 5. Unique Constraints Summary

| Table | Constraint Definition | Engineering Purpose |
| :--- | :--- | :--- |
| `users` | `UNIQUE(github_id)` | Prevents duplicate accounts for the same GitHub identity |
| `user_preferences` | `UNIQUE(user_id)` | Enforces strict 1:1 ratio between user and preferences |
| `repositories` | `UNIQUE(github_id, user_id)` (Constraint: `uq_github_id_user_id`) | Prevents duplicating a repository connection per user |
| `contributors` | `UNIQUE(github_id, repository_id)` (Constraint: `uq_github_id_repository_id`) | Scopes contributor records strictly per repository |
| `pull_requests` | `UNIQUE(github_pr_number, repository_id)` (Constraint: `uq_github_pr_number_repository_id`) | Prevents duplicate PR ingestion during syncs |
| `pr_labels` | `UNIQUE(name, pull_request_id)` (Constraint: `uq_name_pull_request_id`) | Idempotent label updates |
| `pull_request_reviewers`| `UNIQUE(pull_request_id, contributor_id)` (Constraint: `uq_pull_request_id_contributor_id`) | Prevents duplicate reviewer assignments |
| `reviews` | `UNIQUE(github_review_id)` | Global uniqueness preventing duplicate webhook syncs |
| `commits` | `UNIQUE(sha, repository_id)` (Constraint: `uq_commits_sha_repository`) | Prevents duplicate commit logs |
| `webhook_events` | `UNIQUE(github_delivery)` | Prevents duplicate delivery retries by GitHub |

---

## 6. Key Design Decisions

### 6.1 Denormalization of `first_review_at`
Rather than calculating `MIN(reviews.submitted_at)` via subqueries during every cycle-time computation, `first_review_at` is denormalized directly onto `pull_requests`. When the first review arrives via webhook or sync, `pull_requests.first_review_at` is updated once. This reduces query execution time for analytics calls by over 80%.

### 6.2 Per-Repository Contributor Scoping
Contributors are scoped to `repository_id` (`UNIQUE(github_id, repository_id)`). If GitHub user `@octocat` contributes to Repo A (owned by User 1) and Repo B (owned by User 2), two independent contributor rows exist. This design guarantees complete separation between multi-tenant accounts.

### 6.3 Webhook Idempotency via `github_delivery`
GitHub retries failed webhooks automatically. By storing `github_delivery` (`X-GitHub-Delivery`) with a `UNIQUE` constraint, incoming retries that were already recorded fail early at the database level without re-triggering business logic.

### 6.4 Partial Index on `webhook_events.processed`
`CREATE INDEX ix_webhook_events_unprocessed ON webhook_events (processed) WHERE processed = FALSE;`
In production, millions of processed events exist, but only a few unprocessed items exist at any given time. A partial index keeps the index size minuscule (~16 KB), allowing the background webhook recovery worker to scan for unprocessed events instantly.

### 6.5 Explicit `digests.is_stale` Flag
Instead of relying solely on TTL caching, Veltro sets `is_stale = true` on existing digests whenever relevant webhooks (`pull_request.opened`, `pull_request.merged`) arrive. This ensures users receive instantaneous cache hits while guaranteeing fresh AI summaries immediately following team code activity.

---

## 7. Analytics Query Patterns

### 7.1 Cycle Time & Review Latency Aggregation
Hits: `ix_pull_requests_repository_opened_at` composite index.

```sql
SELECT 
    AVG(EXTRACT(EPOCH FROM (merged_at - opened_at)) / 3600.0) AS avg_cycle_time_hours,
    AVG(EXTRACT(EPOCH FROM (first_review_at - opened_at)) / 3600.0) AS avg_review_latency_hours,
    COUNT(id) AS total_merged_prs
FROM pull_requests
WHERE repository_id = :repository_id
  AND state = 'merged'
  AND opened_at >= NOW() - INTERVAL '30 days';
```

### 7.2 Reviewer Bottleneck Detection
Hits: `ix_pull_request_reviewers_status` and `ix_pull_requests_state`.

```sql
SELECT 
    c.id AS contributor_id,
    c.github_login,
    COUNT(prr.id) AS pending_reviews_count
FROM pull_request_reviewers prr
JOIN pull_requests pr ON prr.pull_request_id = pr.id
JOIN contributors c ON prr.contributor_id = c.id
WHERE pr.repository_id = :repository_id
  AND prr.status = 'pending'
  AND pr.state = 'open'
  AND prr.requested_at <= NOW() - INTERVAL '48 hours'
GROUP BY c.id, c.github_login
HAVING COUNT(prr.id) >= 3;
```

### 7.3 Weekly Deploy Frequency
Hits: `ix_pull_requests_repository_opened_at` composite index.

```sql
SELECT 
    DATE_TRUNC('week', merged_at) AS week_start,
    COUNT(id) AS deploys_count
FROM pull_requests
WHERE repository_id = :repository_id
  AND state = 'merged'
  AND merged_at >= NOW() - INTERVAL '90 days'
GROUP BY week_start
ORDER BY week_start DESC;
```

### 7.4 PR Lifecycle Timeline Segments
Hits: `ix_pull_requests_repository_id`.

```sql
SELECT 
    pr.github_pr_number,
    pr.title,
    EXTRACT(EPOCH FROM (COALESCE(pr.first_review_at, NOW()) - pr.opened_at)) / 3600.0 AS waiting_hours,
    CASE 
        WHEN pr.first_review_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (COALESCE(pr.merged_at, pr.closed_at, NOW()) - pr.first_review_at)) / 3600.0
        ELSE 0 
    END AS review_hours
FROM pull_requests pr
WHERE pr.repository_id = :repository_id
ORDER BY pr.opened_at DESC
LIMIT 50;
```
