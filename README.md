# SportsMind — AI Football Intelligence Platform

> A unified ML/AI platform that predicts player performance, assesses injury risk, generates tactical analysis, and narrates match insights using natural language.

![SportsMind](https://img.shields.io/badge/SportsMind-v1.0-emerald?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-teal?style=flat-square)

---

## Core Output Example

**Query:** *"How will Lamine Yamal perform vs PSG?"*

```
SportsMind predicts 1.4 xG and 3 key passes for Yamal tonight.

Top drivers (SHAP): PSG's high defensive line (+0.4 xG), Yamal's
right-channel dominance in the last 6 matches (+0.3 xG), and PSG
missing Marquinhos (+0.2 xG).

Historical context (RAG): In his last 4 appearances against French
clubs, Yamal has averaged 2.1 xG and scored twice from outside the box.

Injury risk: Low. 4 days rest since last match, within safe thresholds.

Tactical note: PSG concede 62% of goals from the right channel.
```

---

## Architecture

```
StatsBomb · FBref · Transfermarkt
           ↓
  backend/ — Python ETL + SQLite Feature Store
           ↓
┌─────────────────────────────────┐
│  XGBoost  │  XGBoost  │ K-Means │  Qdrant RAG
│  Perf.    │  Injury   │ Tactics │  + GPT-5 (GitHub Models)
└─────────────────────────────────┘
           ↓
    backend/api/ — FastAPI (port 8000)
           ↓
    frontend/ — Next.js 15 (port 3000)
```

---

## Quick Start

### 1. Python backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your GITHUB_TOKEN (or OPENAI_API_KEY)
```

### 2. Qdrant (via Docker)

```bash
docker-compose up -d qdrant
```

### 3. Ingest data + train models

```bash
# Run from the backend/ directory with venv active
python -m ingestion.statsbomb          # Download StatsBomb La Liga data
python -m ingestion.embed_narratives   # Embed into Qdrant
python -m models.performance.train     # Train performance model
python -m models.injury.train          # Train injury model
```

### 4. Start the API

```bash
# From backend/
uvicorn api.main:app --reload --port 8000
```

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## ☁️ Deployment

The project is structured as a Monorepo and optimized for zero-config deployments. Since the database is lightweight and read-only at runtime, the SQLite and Qdrant databases are checked into the repository and deployed directly inside the backend container.

### 1. Deploy the Backend (Railway / Render)
Host the Python FastAPI backend on a containerized platform like [Railway.app](https://railway.app/) or [Render.com](https://render.com/).
1. Create a new Web Service and connect your GitHub repository.
2. Set the **Root Directory** to `backend`.
3. The platform will automatically detect the `Dockerfile` and build your backend.
4. Add your `.env` variables (e.g. `GITHUB_TOKEN` for the OpenAI LLM).
5. Once deployed, copy your backend URL.

### 2. Deploy the Frontend (Vercel)
Host the Next.js frontend on [Vercel](https://vercel.com/).
1. Import your GitHub repository into Vercel.
2. Under **Root Directory**, click "Edit" and select `frontend`. Vercel will automatically configure it for Next.js.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: `<YOUR_BACKEND_URL_FROM_STEP_1>`
4. Click Deploy.

---

## Project Structure

```
sportsmind/
├── backend/                    ← All Python / ML / API code
│   ├── ingestion/              # Data loaders (StatsBomb, FBref, Transfermarkt, embed)
│   ├── features/               # Unified feature computation + SQLite cache
│   ├── models/
│   │   ├── performance/        # XGBoost xG prediction + SHAP
│   │   ├── injury/             # XGBoost injury risk classifier + SHAP
│   │   └── tactical/           # K-Means formation + mplsoccer heatmaps
│   ├── rag/                    # Qdrant retrieval + GPT-5 commentary
│   ├── api/                    # FastAPI backend
│   ├── data/                   # Raw + processed data, SQLite DB
│   ├── outputs/heatmaps/       # Generated pitch heatmap PNGs
│   ├── notebooks/              # Jupyter notebooks
│   ├── tests/                  # pytest suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/                   ← Next.js 15 + TypeScript + Tailwind
│   └── src/
│       ├── app/
│       └── components/
│
├── docker-compose.yml          # Qdrant + API + Frontend
├── .gitignore
└── README.md
```

---

## 📊 Datasets Used

This platform uses the free, open-source event data provided by **StatsBomb**, supplemented with demographic metadata from **FBref**.

The built-in database (`features.db`) is pre-loaded with comprehensive event and match data from the following historical competitions:
- **FIFA World Cup 2022**
- **UEFA Champions League 2018/2019**
- **UEFA Euro 2024**
- **Copa America 2024**
- **La Liga (2015/2016)**
- **Premier League (2003/2004 - Arsenal Invincibles)**

*Note: As this relies on open-source datasets, real-time tracking for the current active seasons is not available. The AI models and insights are strictly evaluated on these historical tournaments.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data | StatsBomb open data, FBref, Transfermarkt |
| ML | XGBoost, scikit-learn, SHAP |
| Tactical | K-Means, mplsoccer |
| Vector DB | Qdrant |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| LLM | OpenAI GPT-5 (via GitHub Models) |
| API | FastAPI, Uvicorn |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| Infra | Docker, GitHub Actions |

---

*Built with StatsBomb open data, XGBoost, SHAP, Qdrant, mplsoccer, FastAPI, Next.js, and OpenAI GPT-5 (GitHub Models).*
