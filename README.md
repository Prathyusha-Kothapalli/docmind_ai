# DocMind AI — Enterprise AI Document & Knowledge Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)](https://python.org)
[![Database](https://img.shields.io/badge/Database-SQLite%20FTS5-lightgrey.svg)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://docker.com)

**DocMind AI** is a production-quality, enterprise-grade AI Document & Knowledge Management Platform built using JavaScript (ES6+), HTML5, CSS3, Python 3.10+, Node.js, Express, and a local SQLite database. It features local AI summarization, keyword extraction, document vector similarity matching, indexed full-text search (FTS5), workspace organization, interactive notes/highlights, real-time analytics, auto-seeding, comprehensive test coverage, Docker support, and a responsive glassmorphic UI.

---

## 🌟 Key Core Features

- 🔐 **Authentication & RBAC**: Role-based access control for **Admin** and **User** roles with bcrypt password hashing and JWT token authentication.
- 📁 **Workspace Management**: Isolate documents across project domains (`AI Research`, `Finance`, `Operations`) with storage metrics and color coding.
- 📄 **Multi-Format Document Upload**: Ingest `.pdf`, `.docx`, `.xlsx`, and `.txt` files up to 25MB with automated text parsing.
- 🤖 **100% Local AI Engine**:
  - **Extractive Summarization**: Local TextRank & TF-IDF sentence weight algorithm.
  - **Keyword Extraction**: Term frequency & score analysis.
  - **Reading Time Estimation**: Automated WPM reading speed calculation.
  - **Document Vector Similarity**: Cosine similarity matching across document vectors.
- 🔍 **Indexed Full-Text Search**: SQLite FTS5 virtual table indexing title, content, and summaries with live search match highlighting (`<mark>`).
- 📝 **Interactive Reader & Annotations**: In-browser document viewer with AI Insights sidebar, text highlighting, bookmarking, and linked note creation.
- 📊 **Analytics Dashboard**: Storage usage charts, file format breakdown, top AI keywords cloud, and system activity audit feed.
- 🎨 **Enterprise UI/UX Design**: Responsive glassmorphism aesthetic with light/dark theme toggle, micro-animations, and keyboard shortcuts (`Ctrl + K`).

---

## 🔑 Auto-Seeded Demo Accounts

The system automatically initializes and seeds demo data on launch:

| Role | Email | Password | Pre-seeded Workspaces & Access |
|---|---|---|---|
| **Admin** | `admin@docmind.ai` | `Demo@123` | Full access, user management, global analytics |
| **User** | `demo@docmind.ai` | `Demo@123` | Standard workspace management, uploads, notes |

### Pre-Seeded Sample Documents (6 Files)
1. `Machine Learning Notes.pdf` (AI Research Workspace)
2. `Project Proposal.docx` (AI Research Workspace)
3. `Financial Budget 2026.xlsx` (Finance Workspace)
4. `Employee Handbook.pdf` (Operations Workspace)
5. `Cybersecurity Guide.pdf` (Operations Workspace)
6. `Meeting Minutes.txt` (AI Research Workspace)

---

## 🛠️ Architecture & Tech Stack

```
DocMind AI Architecture
┌────────────────────────────────────────────────────────┐
│                   Frontend (SPA)                       │
│    HTML5 • CSS3 Glassmorphism • JS ES6+ Modules       │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / JWT)
┌───────────────────────────▼────────────────────────────┐
│              Backend (Node.js + Express)               │
│   src/controllers • src/services • src/middleware     │
└───────┬───────────────────┬───────────────────┬────────┘
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  SQLite FTS5   │  │ Local JS/Python│  │ Local File     │
│  Database      │  │ Local AI Engine│  │ Upload Storage │
└────────────────┘  └────────────────┘  └────────────────┘
```

- **Frontend**: Vanilla JS (ES6+), HTML5, Vanilla CSS3 (Custom Design Tokens & Glassmorphism), Chart visualizers.
- **Backend API**: Node.js v22+, Express.js, JWT, BcryptJS, Multer.
- **Database**: SQLite3 with FTS5 virtual full-text search table and triggers.
- **Python NLP Utilities**: Python 3.10+ scripts (`ai_engine.py`, `doc_parser.py`).
- **DevOps**: Docker, Docker Compose, Makefile, Jest, Pytest.

---

## 🚀 Quick Start & Installation Guide

### Prerequisites
- Node.js (v18+ or v22+) & npm
- Python 3.10+ (standard library + pytest)
- Make (optional)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/docmind_ai.git
cd docmind_ai

# Install npm dependencies
npm install

# Install Python requirements
pip install -r requirements.txt
```

### 2. Auto-Seed the Database
```bash
npm run seed
# or
node scripts/seed.js
```

### 3. Launch Server
```bash
npm start
# or for development mode:
npm run dev
```

Open your browser and navigate to: **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

DocMind AI includes 6 automated test files covering backend APIs, local AI algorithms, search indexing, and Python utilities:

```bash
# Run Node.js Jest test suite (5 test files, 14 tests)
npm test

# Run Python 3.10 Pytest suite
python -m pytest tests/test_python_ai.py

# Or run using Makefile
make test
make test-python
```

---

## 🐳 Docker Deployment

DocMind AI includes multi-stage container build configurations:

```bash
# Build and launch stack with Docker Compose
docker-compose up --build -d

# Stop container stack
docker-compose down

# Or using Makefile targets:
make docker-up
make docker-down
```

The app will be accessible at `http://localhost:3000` with persistent SQLite storage mounted to docker volumes.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & get JWT token | Public |
| `POST` | `/api/auth/register` | Register new account | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Bearer |
| `GET` | `/api/documents` | List documents with workspace/type filters | Bearer |
| `POST` | `/api/documents/upload` | Upload file (PDF/DOCX/XLSX/TXT) & run local AI | Bearer |
| `GET` | `/api/documents/:id` | Get document details, keywords, & similarity | Bearer |
| `POST` | `/api/documents/:id/bookmark` | Toggle document bookmark | Bearer |
| `GET` | `/api/workspaces` | List all workspaces & storage metrics | Bearer |
| `POST` | `/api/workspaces` | Create new workspace | Bearer |
| `GET` | `/api/search?q=...` | Execute FTS5 full-text search with highlighting | Bearer |
| `POST` | `/api/notes` | Add note to document | Bearer |
| `GET` | `/api/analytics/dashboard` | Fetch storage, keyword, and activity metrics | Bearer |

---

## 📅 Development Phases (Git Commits & PR History)

- **Phase 1: Core Architecture & Authentication Foundation**
  - Express server, SQLite DB schema, JWT auth middleware, dark/light theme design system.
- **Phase 2: Workspaces & Document Management**
  - File upload engine (Multer), text parsing, Workspace CRUD, Tag management.
- **Phase 3: Local AI & Full-Text Search Engine**
  - TF-IDF summarizer, RAKE keyword extractor, Cosine similarity, SQLite FTS5 index.
- **Phase 4: Notes, Analytics & Enterprise UI/UX**
  - Interactive reader modal, annotation tools, analytics charts, Ctrl+K search modal.
- **Phase 5: Auto-Seeding, Testing, Docker & Packaging**
  - Auto-seeder with 6 documents, 6 test files, Dockerfile, docker-compose, Makefile, README.

---

## 📄 License
This project is licensed under the MIT License.
