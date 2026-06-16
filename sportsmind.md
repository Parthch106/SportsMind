# SportsMind — AI Football Intelligence Platform

> A unified ML/AI platform that predicts player performance, assesses injury risk, generates tactical analysis, and narrates match insights using natural language — all powered by a shared data pipeline and LLM synthesis layer.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Data Sources](#4-data-sources)
5. [Module 1 — Performance Prediction](#5-module-1--performance-prediction)
6. [Module 2 — Injury Risk Prediction](#6-module-2--injury-risk-prediction)
7. [Module 3 — Tactical Analysis](#7-module-3--tactical-analysis)
8. [Module 4 — Commentary Generator (RAG)](#8-module-4--commentary-generator-rag)
9. [Shared Core — Feature Store & Vector DB](#9-shared-core--feature-store--vector-db)
10. [LLM Synthesis Layer](#10-llm-synthesis-layer)
11. [API Layer — FastAPI](#11-api-layer--fastapi)
12. [Frontend — React](#12-frontend--react)
13. [Week-by-Week Build Plan](#13-week-by-week-build-plan)
14. [Folder Structure](#14-folder-structure)
15. [Environment Setup](#15-environment-setup)
16. [Portfolio Presentation Tips](#16-portfolio-presentation-tips)

---

## 1. Project Overview

### What it is

SportsMind is a football intelligence platform that answers questions like:

- *"How will Pedri perform against Liverpool on Tuesday?"*
- *"Is Rodri at high injury risk given the last 3 weeks of fixtures?"*
- *"What tactical weakness does Arsenal expose against a high press?"*
- *"Give me live commentary on tonight's match with historical context."*

The platform produces a single, unified natural language response per query — combining ML model outputs, SHAP explanations, RAG-retrieved historical context, and LLM narration.

### Why it stands out

Most ML portfolios are Jupyter notebooks. SportsMind is a **deployed, end-to-end system** with:

- A real data ingestion and feature engineering pipeline
- Multiple trained ML models sharing a common feature store
- A vector database for semantic retrieval of match history
- An LLM integration that synthesises everything into readable output
- A FastAPI backend and React frontend

Every layer is a talking point in an interview.

### Core output example

**Query:** *"How will Lamine Yamal perform vs PSG?"*

```
SportsMind predicts 1.4 xG and 3 key passes for Yamal tonight.

Top drivers (SHAP): PSG's high defensive line (+0.4 xG), Yamal's 
right-channel dominance in the last 6 matches (+0.3 xG), and PSG 
missing Marquinhos (+0.2 xG).

Historical context (RAG): In his last 4 appearances against French 
clubs, Yamal has averaged 2.1 xG and scored twice from outside the box.

Injury risk: Low. 4 days rest since last match, well within safe 
workload thresholds.

Tactical note: PSG concede 62% of goals from the right channel when 
pressing high — Yamal's preferred zone.
```

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      DATA SOURCES                       │
│  StatsBomb · FBref · Transfermarkt · API-Football       │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                      │
│         Python ETL scripts · Pandas · SQLite            │
└──────────────┬────────────────────┬────────────────────┘
               │                    │
               ▼                    ▼
┌──────────────────────┐  ┌─────────────────────────────┐
│    FEATURE STORE     │  │       VECTOR DB (Qdrant)    │
│  Pre-computed ML     │  │  Embedded match history,    │
│  features, shared    │  │  player trends, tactical    │
│  across all models   │  │  patterns (for RAG)         │
└──────┬───────────────┘  └────────────────┬────────────┘
       │                                    │
       ▼                                    │
┌─────────────────────────────────────────────────────────┐
│                    FOUR ML MODULES                      │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │   Performance   │    │     Injury Risk         │    │
│  │   Prediction    │    │     Prediction          │    │
│  │  XGBoost + SHAP │    │    XGBoost + SHAP       │    │
│  └────────┬────────┘    └────────────┬────────────┘    │
│           │                          │                  │
│  ┌────────▼────────┐    ┌────────────▼────────────┐    │
│  │    Tactical     │    │    Commentary + RAG     │    │
│  │    Analysis     │    │    Qdrant retrieval     │    │
│  │  K-Means + viz  │    │    + LLM narration      │    │
│  └────────┬────────┘    └────────────┬────────────┘    │
└───────────┼──────────────────────────┼─────────────────┘
            │                          │
            └──────────┬───────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  LLM SYNTHESIS LAYER                    │
│     Unified prompt assembly → Claude / GPT-4o API      │
│     One coherent natural language response per query   │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   FASTAPI BACKEND                       │
│              REST endpoints · async · CORS              │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  REACT FRONTEND                         │
│   Search bar · Stat cards · Narrative panel · Pitchmap  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Backend / ML

| Layer | Technology | Purpose |
|---|---|---|
| Data ingestion | Python, Pandas | ETL from APIs and CSV dumps |
| Database | SQLite (dev) / PostgreSQL (prod) | Raw and processed data storage |
| ML models | XGBoost, scikit-learn | Performance and injury prediction |
| Explainability | SHAP | Feature importance per prediction |
| Clustering | scikit-learn K-Means | Formation and tactical pattern detection |
| Pitch visualisation | mplsoccer, matplotlib | Heatmaps, passing networks (backend-rendered) |
| Vector database | Qdrant | Semantic search over match history |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) | Embedding player/match narratives |
| LLM | Anthropic Claude API or OpenAI GPT-4o | Natural language synthesis |
| API | FastAPI, Uvicorn | REST backend |

### Frontend

| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Recharts | Stat visualisation |
| Axios | API calls |

### Infra

| Tool | Purpose |
|---|---|
| Docker | Containerisation |
| Railway / Render | Free deployment |
| GitHub Actions | CI/CD |

---

## 4. Data Sources

### StatsBomb Open Data ⭐ (Primary)

- **URL:** https://github.com/statsbomb/open-data
- **What it contains:** Event-level data (every pass, shot, tackle), 360° freeze frames (positions of all players at event time), lineups, match metadata
- **Competitions available free:** La Liga, Women's Super League, UEFA Euro, World Cup, Champions League (select seasons)
- **How to access:**

```python
from statsbombpy import sb

# List available competitions
competitions = sb.competitions()

# Get all matches in La Liga 2015/16
matches = sb.matches(competition_id=11, season_id=27)

# Get events for a specific match
events = sb.events(match_id=3788741)

# Get 360 freeze frames
frames = sb.frames(match_id=3788741)
```

### FBref

- **URL:** https://fbref.com
- **What it contains:** Season-level player stats (xG, progressive passes, pressures), squad workload, per-90 metrics
- **How to access:** `soccerdata` Python library or direct HTML scraping with `pandas.read_html()`

```python
import soccerdata as sd

fbref = sd.FBref(leagues="ENG-Premier League", seasons="2023-2024")
player_stats = fbref.read_player_season_stats(stat_type="standard")
```

### Transfermarkt

- **URL:** https://www.transfermarkt.com
- **What it contains:** Fixture congestion data, days between matches, player age and injury history
- **How to access:** `soccerdata` library

```python
tm = sd.Transfermarkt(leagues="ESP-La Liga", seasons="2023-2024")
schedule = tm.read_schedule()
```

### API-Football (for live data)

- **URL:** https://www.api-football.com
- **Free tier:** 100 requests/day
- **What it contains:** Live match events, lineups, real-time scores

```python
import requests

url = "https://v3.football.api-sports.io/fixtures"
headers = {"x-apisports-key": "YOUR_KEY"}
params = {"live": "all"}
response = requests.get(url, headers=headers, params=params)
```

---

## 5. Module 1 — Performance Prediction

### Goal

Predict a player's performance metrics for an upcoming match: xG (expected goals), key passes, progressive carries, and a composite performance score.

### Input features

| Feature | Source | Description |
|---|---|---|
| `rolling_xg_5` | StatsBomb | Player's average xG over last 5 matches |
| `rolling_passes_5` | StatsBomb | Average progressive passes, last 5 matches |
| `opponent_defensive_rating` | FBref | Opponent's defensive actions per 90 |
| `opponent_press_intensity` | StatsBomb | Opponent PPDA (passes allowed per defensive action) |
| `is_home` | Match data | Binary: home or away |
| `days_since_last_match` | Transfermarkt | Rest days before this fixture |
| `xg_vs_opponent_historic` | StatsBomb | Player's historical xG against this specific opponent |
| `season_form_score` | Computed | Weighted average of last 10 match ratings |

### Model

```python
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import shap

# Train
X_train, X_test, y_train, y_test = train_test_split(X, y_xg, test_size=0.2)

model = xgb.XGBRegressor(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
model.fit(X_train, y_train)

# SHAP explanation
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
```

### Output

```json
{
  "player": "Lamine Yamal",
  "match": "FC Barcelona vs PSG",
  "predicted_xg": 1.4,
  "predicted_key_passes": 3.1,
  "confidence": 0.81,
  "shap_top_drivers": [
    {"feature": "opponent_defensive_line_height", "impact": "+0.4 xG"},
    {"feature": "rolling_xg_5", "impact": "+0.3 xG"},
    {"feature": "opponent_marquinhos_absent", "impact": "+0.2 xG"}
  ]
}
```

---

## 6. Module 2 — Injury Risk Prediction

### Goal

Classify each player as low / medium / high injury risk before each match, using workload and physical load features.

### Input features

| Feature | Source | Description |
|---|---|---|
| `matches_last_14_days` | Transfermarkt | Number of matches played in 2 weeks |
| `minutes_last_14_days` | FBref | Total minutes played recently |
| `days_since_last_match` | Transfermarkt | Recovery window |
| `sprint_distance_last_3` | StatsBomb | High-speed running over last 3 matches |
| `high_intensity_actions` | StatsBomb | Tackles + pressures + sprints per 90 |
| `player_age` | Transfermarkt | Age (older players need more recovery) |
| `previous_injury_count` | Manual / Transfermarkt | Historical injury susceptibility |
| `cumulative_minutes_season` | FBref | Fatigue accumulation across full season |

### Model

```python
from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder

# Target: 0 = low risk, 1 = medium risk, 2 = high risk
le = LabelEncoder()
y_encoded = le.fit_transform(y_risk)

injury_model = XGBClassifier(
    n_estimators=150,
    max_depth=3,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='mlogloss'
)
injury_model.fit(X_train, y_encoded)
```

### Output

```json
{
  "player": "Rodri",
  "risk_level": "HIGH",
  "risk_score": 0.87,
  "shap_explanation": [
    {"feature": "matches_last_14_days", "value": 4, "impact": "major risk factor"},
    {"feature": "minutes_last_14_days", "value": 360, "impact": "elevated fatigue"},
    {"feature": "days_since_last_match", "value": 2, "impact": "insufficient recovery"}
  ],
  "recommendation": "Consider rotation — high hamstring strain probability."
}
```

---

## 7. Module 3 — Tactical Analysis

### Goal

Detect formation patterns, identify tactical weaknesses, and visualise where a team concedes or creates chances.

### Sub-components

#### 3a. Formation detection with K-Means

```python
from sklearn.cluster import KMeans
from mplsoccer import Pitch
import numpy as np

# Extract average player positions from StatsBomb freeze frames
def get_team_positions(freeze_frame, team_id):
    players = [p for p in freeze_frame if p['teammate'] == True]
    return np.array([[p['location'][0], p['location'][1]] for p in players])

# Cluster into formation shape
kmeans = KMeans(n_clusters=4, random_state=42)  # 4 outfield lines
kmeans.fit(positions)
formation_centroids = kmeans.cluster_centers_
```

#### 3b. Zone weakness detection

```python
# Identify which pitch zones an opponent concedes from
def get_concession_zones(events_df, team_name):
    conceded = events_df[
        (events_df['type'] == 'Shot') &
        (events_df['shot_outcome'] == 'Goal') &
        (events_df['team'] != team_name)
    ]
    return conceded[['location_x', 'location_y', 'shot_xg']]
```

#### 3c. Pitch visualisation (mplsoccer)

```python
pitch = Pitch(pitch_type='statsbomb', line_color='white')
fig, ax = pitch.draw(figsize=(10, 7))

# Heatmap of concession zones
pitch.kdeplot(
    concession_df['location_x'],
    concession_df['location_y'],
    ax=ax,
    cmap='Reds',
    fill=True,
    levels=10,
    alpha=0.6
)

fig.savefig('outputs/tactical_heatmap.png', dpi=150, bbox_inches='tight')
```

### Output

```json
{
  "team": "PSG",
  "formation_detected": "4-3-3",
  "vulnerability_zones": [
    {"zone": "right channel", "concession_rate": 0.68, "avg_xg_against": 0.34},
    {"zone": "set pieces", "concession_rate": 0.24, "avg_xg_against": 0.21}
  ],
  "heatmap_url": "/outputs/psg_concession_heatmap.png",
  "tactical_summary": "PSG concede 68% of goals from the right channel when pressing high."
}
```

---

## 8. Module 4 — Commentary Generator (RAG)

### Goal

Retrieve relevant historical context from the vector database and generate natural language commentary that narrates the match with statistical depth.

### Step 1: Embed and store match narratives

```python
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, VectorParams, Distance

model = SentenceTransformer('all-MiniLM-L6-v2')
client = QdrantClient(host="localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="match_history",
    vectors_config=VectorParams(size=384, distance=Distance.COSINE)
)

# Build narrative strings from match data and embed them
def build_narrative(row):
    return (
        f"{row['player']} scored {row['goals']} goals with {row['xg']:.2f} xG "
        f"against {row['opponent']} on {row['date']}. "
        f"The team played a {row['formation']} formation."
    )

narratives = df.apply(build_narrative, axis=1).tolist()
embeddings = model.encode(narratives)

points = [
    PointStruct(id=i, vector=embeddings[i].tolist(), payload={"text": narratives[i]})
    for i in range(len(narratives))
]
client.upsert(collection_name="match_history", points=points)
```

### Step 2: Retrieve relevant context

```python
def retrieve_context(query: str, top_k: int = 5) -> list[str]:
    query_vector = model.encode(query).tolist()
    results = client.search(
        collection_name="match_history",
        query_vector=query_vector,
        limit=top_k
    )
    return [r.payload["text"] for r in results]
```

### Step 3: Generate commentary with LLM

```python
import anthropic

def generate_commentary(
    query: str,
    performance_data: dict,
    injury_data: dict,
    tactical_data: dict
) -> str:
    context_chunks = retrieve_context(query)
    rag_context = "\n".join(context_chunks)

    client = anthropic.Anthropic()

    prompt = f"""You are SportsMind, an elite football analyst. Answer the following query
using the structured data and historical context provided.

QUERY: {query}

PERFORMANCE PREDICTION:
{performance_data}

INJURY RISK:
{injury_data}

TACTICAL ANALYSIS:
{tactical_data}

HISTORICAL CONTEXT (retrieved):
{rag_context}

Write a concise, expert analysis in 4–5 sentences. Lead with the prediction,
explain the key drivers, add historical context, and close with a tactical insight.
Do not use bullet points. Write in flowing prose."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
```

---

## 9. Shared Core — Feature Store & Vector DB

### Feature store design

All four modules share a common set of base features computed once per player per matchweek, stored in SQLite and loaded on demand.

```python
# features/compute_features.py

def compute_player_features(player_id: int, match_date: str) -> dict:
    """
    Computes and caches all features for a player ahead of a given match.
    Called once; results shared by performance, injury, and tactical modules.
    """
    return {
        # Rolling stats (5-match window)
        "rolling_xg_5": get_rolling_xg(player_id, match_date, window=5),
        "rolling_passes_5": get_rolling_passes(player_id, match_date, window=5),
        "rolling_sprint_distance_3": get_sprint_load(player_id, match_date, window=3),

        # Workload
        "days_since_last_match": get_rest_days(player_id, match_date),
        "matches_last_14_days": get_match_count(player_id, match_date, days=14),
        "minutes_last_14_days": get_minutes(player_id, match_date, days=14),
        "cumulative_minutes_season": get_season_minutes(player_id, match_date),

        # Context
        "is_home": get_home_away(player_id, match_date),
        "player_age": get_age(player_id),
        "season_form_score": get_form_score(player_id, match_date),
    }
```

### Qdrant setup (local via Docker)

```bash
docker pull qdrant/qdrant
docker run -p 6333:6333 -v $(pwd)/qdrant_storage:/qdrant/storage qdrant/qdrant
```

### What gets embedded

| Collection | Content embedded | Used by |
|---|---|---|
| `match_history` | Per-match player narratives | Commentary module |
| `tactical_patterns` | Formation + zone summaries per team | Tactical module |
| `player_profiles` | Career trend summaries | All modules |

---

## 10. LLM Synthesis Layer

### Prompt assembly

Every API query triggers all four modules in parallel, collects their JSON outputs, then calls the LLM once with a unified prompt.

```python
import asyncio

async def run_all_modules(query: str, player_id: int, match_id: int) -> str:
    # Run modules concurrently
    perf, injury, tactical = await asyncio.gather(
        predict_performance(player_id, match_id),
        predict_injury_risk(player_id, match_id),
        get_tactical_analysis(match_id)
    )

    # Compose unified response
    return generate_commentary(query, perf, injury, tactical)
```

### Prompt design principles

- Lead with the prediction number (most scannable)
- Follow with top 3 SHAP drivers in plain English
- Insert 1–2 RAG facts for historical depth
- Close with a tactical angle
- Hard limit: 150 words output max for UI display

---

## 11. API Layer — FastAPI

### Endpoints

```python
# api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SportsMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    player_name: str | None = None
    match_id: int | None = None

@app.post("/analyse")
async def analyse(request: QueryRequest):
    """Main endpoint — runs all 4 modules and returns unified analysis."""
    result = await run_all_modules(
        query=request.query,
        player_id=resolve_player(request.player_name),
        match_id=request.match_id
    )
    return {"analysis": result}

@app.get("/performance/{player_id}")
async def get_performance(player_id: int, match_id: int):
    return await predict_performance(player_id, match_id)

@app.get("/injury/{player_id}")
async def get_injury_risk(player_id: int):
    return await predict_injury_risk(player_id)

@app.get("/tactical/{team_id}")
async def get_tactical(team_id: int):
    return await get_tactical_analysis(team_id)
```

### Run locally

```bash
uvicorn api.main:app --reload --port 8000
```

---

## 12. Frontend — React

### Key components

```
src/
├── components/
│   ├── SearchBar.tsx         # Main query input
│   ├── NarrativePanel.tsx    # LLM-generated analysis display
│   ├── StatCard.tsx          # Predicted score + SHAP breakdown
│   ├── RiskBadge.tsx         # Injury risk indicator (Low/Med/High)
│   ├── PitchHeatmap.tsx      # Rendered tactical heatmap image
│   └── ShapChart.tsx         # Recharts bar chart for SHAP values
├── api/
│   └── sportsmind.ts         # Axios calls to FastAPI
└── App.tsx
```

### Example search flow

```typescript
// api/sportsmind.ts
import axios from 'axios';

export const analyseQuery = async (query: string) => {
  const response = await axios.post('http://localhost:8000/analyse', {
    query,
  });
  return response.data;
};
```

```tsx
// components/SearchBar.tsx
const [query, setQuery] = useState('');
const [result, setResult] = useState(null);

const handleSearch = async () => {
  const data = await analyseQuery(query);
  setResult(data);
};
```

### UI layout (wireframe)

```
┌─────────────────────────────────────────────────────┐
│  🔍  "How will Lamine Yamal perform vs PSG?"        │
├──────────────┬──────────────┬───────────────────────┤
│  Predicted   │  Injury Risk │   Top SHAP Drivers    │
│   xG: 1.4   │    LOW       │  ▓▓▓ Press intensity  │
│  KP: 3.1    │              │  ▓▓  Rolling xG       │
│              │              │  ▓   Home advantage   │
├──────────────┴──────────────┴───────────────────────┤
│  SportsMind Analysis                                 │
│  Yamal is predicted to be decisive tonight...        │
│  [Full LLM narrative paragraph]                      │
├─────────────────────────────────────────────────────┤
│  Tactical Heatmap — PSG concession zones            │
│  [Pitch image rendered by mplsoccer]                │
└─────────────────────────────────────────────────────┘
```

---

## 13. Week-by-Week Build Plan

### Week 1 — Shared foundation

**Goal:** Working data pipeline and feature store.

- [ ] Set up Python virtual environment and install dependencies
- [ ] Pull StatsBomb open data for La Liga 2015/16 (Messi season — rich data)
- [ ] Pull FBref player stats via `soccerdata`
- [ ] Pull Transfermarkt fixture data for workload features
- [ ] Build `compute_features.py` — unified feature computation function
- [ ] Store features in SQLite database
- [ ] Set up Qdrant locally via Docker
- [ ] Embed and index match narratives into Qdrant

**Milestone:** Given a player ID and match date, `compute_features()` returns a complete feature dict.

---

### Week 2 — ML models (performance + injury)

**Goal:** Two trained, evaluated, explainable models.

- [ ] Build training dataset from feature store + historical outcomes
- [ ] Train XGBoost performance prediction model (target: xG per match)
- [ ] Train XGBoost injury risk classifier (target: low/medium/high)
- [ ] Evaluate both models (MAE for regression, F1 for classifier)
- [ ] Generate SHAP values and verify explanations make football sense
- [ ] Save trained models with `joblib`
- [ ] Write unit tests for prediction functions

**Milestone:** `predict_performance(player_id, match_id)` and `predict_injury_risk(player_id)` return structured JSON with SHAP explanations.

---

### Week 3 — Tactical analysis

**Goal:** Formation detection and zone visualisation.

- [ ] Parse StatsBomb 360° freeze frame data
- [ ] Extract average player positions per team per match
- [ ] Build K-Means formation clustering pipeline
- [ ] Detect top 4 formations used per team across a season
- [ ] Compute zone-level concession rates (divide pitch into 6 zones)
- [ ] Generate mplsoccer heatmaps for concession zones
- [ ] Save heatmaps as PNG files served by FastAPI

**Milestone:** `get_tactical_analysis(team_id)` returns formation, zone vulnerability data, and heatmap path.

---

### Week 4 — Commentary + RAG + LLM synthesis

**Goal:** The full natural language pipeline.

- [ ] Refine Qdrant embeddings — add player profiles and tactical summaries
- [ ] Build `retrieve_context(query)` with semantic search
- [ ] Design and test the unified LLM prompt template
- [ ] Wire all four module outputs into `generate_commentary()`
- [ ] Add `asyncio.gather()` to run modules concurrently
- [ ] Test end-to-end: query in → natural language analysis out
- [ ] Handle edge cases (player not found, no historical data)

**Milestone:** Full pipeline working end-to-end from a single Python function call.

---

### Week 5 — API + Frontend + Deployment

**Goal:** Deployed, publicly accessible product.

- [ ] Build FastAPI with all endpoints
- [ ] Write React frontend with SearchBar, StatCard, NarrativePanel, PitchHeatmap
- [ ] Connect frontend to API with Axios
- [ ] Add loading states and error handling in the UI
- [ ] Dockerise the backend
- [ ] Deploy backend to Railway (free tier)
- [ ] Deploy frontend to Vercel (free tier)
- [ ] Write `README.md` with live demo link, architecture diagram, and sample outputs

**Milestone:** Live URL you can share with recruiters and put on your CV.

---

## 14. Folder Structure

```
sportsmind/
├── data/
│   ├── raw/                    # Downloaded StatsBomb JSON, FBref CSV
│   ├── processed/              # Cleaned, merged datasets
│   └── features.db             # SQLite feature store
│
├── ingestion/
│   ├── statsbomb.py            # StatsBomb data loader
│   ├── fbref.py                # FBref scraper
│   ├── transfermarkt.py        # Transfermarkt fixture loader
│   └── embed_narratives.py     # Qdrant embedding pipeline
│
├── features/
│   └── compute_features.py     # Unified feature computation
│
├── models/
│   ├── performance/
│   │   ├── train.py
│   │   ├── predict.py
│   │   └── model.joblib        # Saved model (after training)
│   ├── injury/
│   │   ├── train.py
│   │   ├── predict.py
│   │   └── model.joblib
│   └── tactical/
│       ├── clustering.py
│       ├── heatmaps.py
│       └── analyse.py
│
├── rag/
│   ├── embed.py                # Embedding utilities
│   ├── retrieve.py             # Qdrant search
│   └── commentary.py           # LLM prompt + response
│
├── api/
│   ├── main.py                 # FastAPI app
│   ├── schemas.py              # Pydantic models
│   └── routes/
│       ├── analyse.py
│       ├── performance.py
│       ├── injury.py
│       └── tactical.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── outputs/
│   └── heatmaps/               # Saved PNG pitch visualisations
│
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   ├── 02_feature_engineering.ipynb
│   ├── 03_model_training.ipynb
│   └── 04_shap_analysis.ipynb
│
├── tests/
│   ├── test_features.py
│   ├── test_models.py
│   └── test_api.py
│
├── docker-compose.yml          # Qdrant + API
├── requirements.txt
├── .env.example
└── README.md
```

---

## 15. Environment Setup

### Clone and install

```bash
git clone https://github.com/yourusername/sportsmind.git
cd sportsmind

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### requirements.txt

```
# Data
statsbombpy==1.1.3
soccerdata==0.5.0
pandas==2.1.4
numpy==1.26.2

# ML
xgboost==2.0.3
scikit-learn==1.4.0
shap==0.44.0
joblib==1.3.2

# Visualisation
mplsoccer==1.2.4
matplotlib==3.8.2

# Vector DB
qdrant-client==1.7.1
sentence-transformers==2.2.2

# LLM
anthropic==0.21.3

# API
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3

# Frontend (managed by npm separately)
```

### Environment variables

```bash
# .env
ANTHROPIC_API_KEY=your_key_here
QDRANT_HOST=localhost
QDRANT_PORT=6333
DATABASE_URL=sqlite:///data/features.db
```

### Start Qdrant

```bash
docker-compose up -d qdrant
```

### Run the API

```bash
uvicorn api.main:app --reload --port 8000
```

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 16. Portfolio Presentation Tips

### What to say in an interview

> "SportsMind is a football intelligence platform I built end-to-end. It has four ML modules — performance prediction, injury risk, tactical analysis, and a RAG-powered commentary generator — all sharing a common data pipeline and funnelling their outputs into a single LLM call. The interesting engineering challenge was making SHAP explanations readable to non-technical users, and designing the prompt so the LLM synthesises four separate JSON payloads into one coherent paragraph."

### What to show

1. **Live demo first** — search for a real player, show the output in 30 seconds
2. **Architecture diagram** — walk through the data flow
3. **SHAP chart** — explain one prediction in plain English using the feature importances
4. **Pitch heatmap** — most visually impressive, shows domain depth
5. **Code** — show `compute_features.py` as proof of clean, shared design

### README must-haves

- Live demo link (Vercel + Railway)
- Architecture diagram (embed the one from this doc)
- 3 example queries with full output shown
- Clear setup instructions
- Honest note on hardware constraints and dataset limitations

### Hugging Face Model Card (bonus)

If you fine-tune a small model on football commentary style, push it to Hugging Face with a model card explaining your dataset, training setup, and VRAM constraints. Even a modest improvement in football-domain fluency is worth documenting.

---

*Built with StatsBomb open data, FBref, XGBoost, SHAP, Qdrant, mplsoccer, FastAPI, React, and Claude API.*
