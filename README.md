# Veltro

> **Engineering team health dashboard powered by AI.**

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Milkessa97/Veltro/ci.yml?branch=main&style=flat-square&logo=github&label=CI)](https://github.com/Milkessa97/Veltro/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

Veltro connects to GitHub Apps and transforms raw pull request activity into actionable team velocity insights. It tracks PR cycle times, reviewer latency, contributor activity, and detects code review bottlenecks. Using Google Gemini, Veltro generates plain-English weekly engineering digests to keep team leads informed without manual reporting.

---

## 🎬 Demo

> 📸 **Screenshot Placeholder**: `docs/assets/dashboard-preview.png`

[![Watch Demo](https://img.shields.io/badge/▶_Watch_Demo-Veltro_Video-purple?style=for-the-badge)](https://youtube.com)

---

## ⚡ Features

- **🔑 GitHub Apps OAuth** — Repository-scoped authorization; users select exact repositories during installation before tokens are issued.
- **🔄 Repository Sync** — Automatic ingestion of PRs, reviews, commits, and contributors with pagination and GitHub rate limit handling.
- **⚡ Real-Time Webhooks** — Webhook listener processes GitHub events instantly to keep metrics up-to-date without manual syncs.
- **📊 Analytics Dashboard** — Instant metrics for average cycle time, review latency, open PR age, weekly deploy frequency, and trend charts.
- **⏳ PR Lifecycle Timeline** — Segmented Gantt-style visualization tracking time spent waiting for review (blue), in review (amber), and ready to merge (green).
- **👥 Contributor Bottleneck Flags** — Automatically highlights reviewers with 3+ pending reviews older than 48 hours.
- **🤖 AI Weekly Digest** — Gemini-generated engineering summaries cached for 24 hours, automatically refreshed every Monday via GitHub Actions.
- **🔍 AI Bottleneck Explanations** — Context-aware AI breakdowns explaining why specific contributors are bottlenecked and how to resolve it.
- **🔒 Encrypted API Keys** — Store user-provided Gemini API keys encrypted with Fernet, backed by a system fallback key.
- **📜 Sync History Log** — Complete log of every sync execution showing duration, status, records imported, and error tracebacks.
- **📚 Digest History** — Historical repository archive of all previous AI-generated digests for longitudinal review.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Framework** | Python 3.13, FastAPI |
| **Database & ORM** | PostgreSQL 15, SQLAlchemy, Alembic (Migrations) |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash`) |
| **Security & Auth** | GitHub Apps OAuth, JWT (jti blocklist), Fernet Encryption, HTTP-only Cookies |
| **Backend Infrastructure** | Docker, Docker Compose, Render |
| **Frontend Framework** | Next.js 15 (App Router), TypeScript |
| **UI & Styling** | Tailwind CSS, Radix UI Primitives, GSAP Animations |
| **Data Visualization** | Recharts |
| **Frontend Hosting** | Vercel |
| **CI/CD & Automation** | GitHub Actions (CI, Deployment, Weekly Digest Cron) |

---

## 🏗️ Architecture

For the complete architectural layout, see [`architecture.md`](docs/architecture.md).

```
┌─────────────────────────┐               ┌─────────────────────────┐
│ Next.js Frontend        │  /api/*       │ FastAPI Backend         │
│ (Vercel)                │──────────────►│ (Render)                │
└─────────────────────────┘  Rewrites     └────────────┬────────────┘
                                                       │
                                                       ▼
┌─────────────────────────┐               ┌─────────────────────────┐
│ GitHub Webhooks & Cron  │──────────────►│ PostgreSQL Database     │
│ (GitHub Actions)        │               │ (Render Managed)        │
└─────────────────────────┘               └─────────────────────────┘
```

- **Rewrites Proxy**: Next.js proxies `/api/*` requests to the FastAPI backend to eliminate cross-origin cookie issues.
- **Data Persistence**: Managed PostgreSQL database stores encrypted tokens, repository metrics, pull requests, and sync histories.
- **Automated Workflows**: GitHub Actions executes CI on pull requests, deploys on merge to `main`, and calls `/digest/weekly` every Monday at 08:00 UTC.

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js 18+](https://nodejs.org/) (for local frontend development)
- A registered [GitHub App](https://github.com/settings/apps)

### Quickstart

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Milkessa97/Veltro.git
   cd Veltro
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start backend services with Docker:**
   ```bash
   docker compose up -d
   ```

4. **Run database migrations:**
   ```bash
   docker compose exec backend alembic upgrade head
   ```

5. **Start the frontend development server:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Open the application:**
   Visit [`http://localhost:3000`](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Name | Required | Description |
| :--- | :---: | :--- |
| `DATABASE_URL` | Yes | PostgreSQL connection URI |
| `GITHUB_APP_ID` | Yes | GitHub App ID |
| `GITHUB_APP_SLUG` | Yes | GitHub App slug identifier |
| `GITHUB_PRIVATE_KEY` | Yes | RSA private key content for GitHub App authentication |
| `SECRET_KEY` | Yes | Secret key for signing JWT tokens |
| `ENCRYPTION_KEY` | Yes | Fernet key for encrypting stored credentials |
| `GEMINI_API_KEY` | No | System fallback Gemini API key for AI digests |
| `JWT_ALGORITHM` | Yes | Signing algorithm for JWT (e.g. `HS256`) |
| `ENVIRONMENT` | Yes | Environment stage (`development` / `production`) |
| `FRONTEND_URL` | Yes | Base URL of the client application |

### Frontend (`frontend/.env`)

| Name | Required | Description |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | Target backend API URL for Next.js rewrites |
| `RESEND_API_KEY` | Yes | API key for Resend email notifications |
| `RESEND_FROM_EMAIL` | No | Custom sender email address for Resend |

---

## 🧪 Running Tests

Run the backend unit and integration test suite inside the running Docker container:

```bash
docker compose exec backend python -m pytest
```

---

## 📁 Project Structure

```text
Veltro/
├── .github/
│   └── workflows/            # GitHub Actions CI/CD & Cron workflows
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── routes/           # FastAPI endpoint routes
│   │   ├── services/         # GitHub sync, AI digest, & auth services
│   │   ├── config.py         # App configuration & settings validation
│   │   └── main.py           # FastAPI application entry point
│   ├── alembic/              # Database migration scripts
│   ├── tests/                # Pytest test suite
│   ├── Dockerfile.dev        # Development Docker configuration
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── app/                  # Next.js App Router pages & server actions
│   ├── components/           # UI components, layout, & dashboard charts
│   ├── lib/                  # API client modules, utils, & types
│   ├── public/               # Static assets & icons
│   └── package.json          # Node dependencies & scripts
├── docs/                     # Architecture & design documentation
├── docker-compose.yml        # Multi-container orchestration config
└── README.md                 # Project documentation
```

---

## 🌐 Deployment

- **Backend (Render)**: FastAPI app deployed as a Web Service connected to a managed Render PostgreSQL database.
- **Frontend (Vercel)**: Next.js app deployed on Vercel. Proxy rewrites defined in `next.config.mjs` redirect `/api/*` calls seamlessly to the Render backend, preventing cross-domain cookie issues.

---

## 🤝 Contributing

Contributions are welcome! Please adhere to the following workflow:

1. **Branch Naming**: Use prefixed branch names: `feature/feature-name`, `fix/bug-description`, or `docs/update-name`.
2. **Commit Messages**: Follow standard conventional commit formatting:
   - `feat: add reviewer bottleneck detection`
   - `fix: resolve double resend call in auth workflow`
   - `docs: update deployment environment variable table`
3. **Pull Request Process**: Open a PR against `main`. Ensure all automated GitHub Actions checks pass before requesting review.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Built By

Built as a full-stack portfolio project by **[Milkessa Kebu](https://github.com/Milkessa97)** to master modern backend architecture, OAuth pipelines, and AI-assisted developer analytics.
