<div align="center">

<img src="frontend/public/veltro-logo-dark-bg.svg" alt="Veltro Logo" height="60" />

# Veltro

**Engineering analytics for GitHub teams — powered by AI.**

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Milkessa97/Veltro/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/Milkessa97/Veltro/actions)
[![License](https://img.shields.io/badge/License-MIT-6366f1.svg?style=flat-square)](LICENSE)

[**Live Demo**](https://veltro.vercel.app) · [**Documentation**](docs/architecture.md) · [**Report a Bug**](https://github.com/Milkessa97/Veltro/issues)

</div>

---

## Overview

Veltro turns raw GitHub pull request activity into clear, actionable engineering signals. Connect it to any repository via a GitHub App installation and get instant visibility into cycle times, reviewer latency, contributor bottlenecks, and weekly AI-generated team digests — all without writing a single report.

> Built as a full-stack portfolio project by **[Milkessa Kebu](https://github.com/Milkessa97)** to master production-grade backend architecture, OAuth security pipelines, and AI-assisted developer analytics.

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| 🔑 **GitHub App OAuth** | Repository-scoped authorization — users select exact repos during installation before tokens are issued |
| 🔄 **Repository Sync** | Ingests PRs, reviews, commits, and contributors with pagination and rate limit handling |
| ⚡ **Real-Time Webhooks** | Webhook listener processes GitHub events instantly to keep metrics current without manual syncs |
| 📊 **Analytics Dashboard** | KPI cards for cycle time, review latency, open PR age, deploy frequency, and trend charts |
| ⏳ **PR Timeline View** | Segmented Gantt-style visualization — waiting (blue), in review (amber), ready to merge (green) |
| 👥 **Bottleneck Detection** | Automatically flags reviewers with 3+ pending reviews older than 48 hours |
| 🤖 **AI Weekly Digest** | Gemini-generated engineering summaries, cached 24 hours and auto-refreshed every Monday via cron |
| 🔒 **Database-Backed Rate Limiting** | Three-layer sync throttling: per-user concurrency lock, 1-minute user-wide cooldown, and 10-minute per-repo cooldown |
| 🔐 **Encrypted Secrets** | User Gemini API keys encrypted at rest with Fernet (AES-128 CBC + HMAC-SHA256); system fallback key supported |
| 📜 **Sync History Log** | Full log of every sync run — status, duration, records imported, and error traces |
| 📚 **Digest History** | Persistent archive of all AI-generated digests for longitudinal review |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.13, FastAPI |
| **Database & ORM** | PostgreSQL 15, SQLAlchemy, Alembic |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash`) |
| **Auth & Security** | GitHub Apps OAuth, JWT with `jti` blocklist, Fernet encryption, HTTP-only cookies |
| **Infrastructure** | Docker, Docker Compose, Render |
| **Frontend** | Next.js 15 (App Router), TypeScript |
| **UI & Styling** | Tailwind CSS, Radix UI, Vanilla CSS animations, GSAP |
| **Data Visualization** | Recharts |
| **Hosting** | Vercel (frontend) · Render (backend + database) |
| **CI/CD** | GitHub Actions (CI, deployment, weekly digest cron) |

---

## 🏗️ Architecture

```
┌───────────────────────────┐                 ┌───────────────────────────┐
│  Next.js Frontend         │  /api/* Proxy   │  FastAPI Backend          │
│  (Vercel)                 │────────────────►│  (Render Web Service)     │
└───────────────────────────┘                 └───────────┬───────────────┘
                                                          │
                          ┌───────────────────────────────┤
                          │                               │
                          ▼                               ▼
          ┌───────────────────────────┐   ┌───────────────────────────┐
          │  GitHub Webhooks          │   │  PostgreSQL Database      │
          │  GitHub Actions Cron      │   │  (Render Managed)         │
          └───────────────────────────┘   └───────────────────────────┘
```

- **Proxy Rewrites:** Next.js proxies all `/api/*` traffic to the FastAPI backend, ensuring session cookies remain first-party and avoiding all cross-origin restrictions.
- **Data Security:** Managed PostgreSQL with per-user database-level data isolation enforced via relational foreign key chains. All tokens encrypted at rest.
- **Automation:** GitHub Actions runs CI on every PR, triggers deployment on merge to `main`, and calls `/digest/weekly` at `08:00 UTC` every Monday.

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js 18+](https://nodejs.org/)
- A registered [GitHub App](https://github.com/settings/apps)

### Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Milkessa97/Veltro.git

# 2. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# → Fill in all required values (see table below)

# 3. Start backend services
docker compose up --build -d

# 4. Apply database migrations
docker compose exec backend alembic upgrade head

# 5. Start the frontend dev server
cd frontend
npm install
npm run dev

# 6. Open in browser
# → http://localhost:3000
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`

| Variable | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | ✅ | PostgreSQL connection URI |
| `GITHUB_APP_ID` | ✅ | GitHub App numeric ID |
| `GITHUB_APP_SLUG` | ✅ | GitHub App slug identifier |
| `GITHUB_PRIVATE_KEY` | ✅ | RSA private key content for GitHub App JWT auth |
| `SECRET_KEY` | ✅ | Secret key for signing JWT access & refresh tokens |
| `ENCRYPTION_KEY` | ✅ | Fernet key for encrypting stored user credentials |
| `JWT_ALGORITHM` | ✅ | JWT signing algorithm (e.g. `HS256`) |
| `ENVIRONMENT` | ✅ | Deployment stage — `development` or `production` |
| `FRONTEND_URL` | ✅ | Base URL of the client application (for CORS & redirects) |
| `CONTACT_EMAIL` | ✅ | Contact email address for the frontend |
| `GEMINI_API_KEY` | ✅ | System fallback Gemini API key for AI digest generation |
| `RESEND_API_KEY` | ✅ | API key for Resend email notifications |
| `RESEND_FROM_EMAIL` | ✅ | Custom sender address for transactional emails |

### Frontend — `frontend/.env`

| Variable | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL (used for Next.js rewrite target) |
---

## 🧪 Running Tests

```bash
# Run the full backend test suite inside Docker
docker compose exec backend python -m pytest

# Run with verbose output
docker compose exec backend python -m pytest -v
```

---

## 📁 Project Structure

```text
Veltro/
├── .github/
│   └── workflows/            # GitHub Actions — CI, deployment, weekly cron
├── docs/                       # Documentation
│   ├── architecture.md
│   └── database-schema.md
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── routes/           # FastAPI API endpoint routers
│   │   ├── services/         # Business logic — sync, auth, AI digests, rate limiting
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── db/               # Database session & Alembic configuration
│   │   ├── tests/            # FastAPI application tests
│   │   ├── config.py         # Settings validation & app configuration
│   │   └── main.py           # FastAPI application entry point
│   ├── alembic               # Database migration scripts
│   ├── .dockerignore         # Docker ignore file
│   ├── Dockerfile            # Production Docker image
│   ├── Dockerfile.dev        # Development Docker image
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── app/                  # Next.js App Router — pages, server actions, legal routes
│   ├── components/           # UI components, dashboard charts, repo context
│   ├── hooks/                # Custom React hooks (useToast, etc.)
│   ├── lib/                  # API client modules, utilities, and types
│   ├── public/               # Static assets and icons
│   └── package.json          # Node.js dependencies and scripts
├── docs/                     # Architecture & design documentation
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

---

## 🌐 Deployment

| Service | Platform | Notes |
| :--- | :--- | :--- |
| **Backend** | [Render](https://render.com) | FastAPI Web Service connected to a Render managed PostgreSQL instance |
| **Frontend** | [Vercel](https://vercel.com) | Next.js app with `/api/*` proxy rewrites pointing to the Render backend |
| **Database** | Render PostgreSQL | Managed, persistent, used for metrics, sync logs, and encrypted credential storage |

---

## 🤝 Contributing

Contributions are welcome! Please follow this workflow:

1. **Branch naming** — Use prefixed names: `feature/my-feature`, `fix/bug-name`, `docs/update-name`
2. **Commit style** — Follow [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add reviewer bottleneck detection
   fix: resolve double resend call in auth workflow
   docs: update environment variable table
   ```
3. **Pull requests** — Open a PR against `main`. All GitHub Actions checks must pass before requesting a review.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">

**[Terms of Service](https://veltro.vercel.app/terms)** · **[Privacy Policy](https://veltro.vercel.app/privacy)**

Made with ♥ by **[Milkessa Kebu](https://github.com/Milkessa97)**

</div>
