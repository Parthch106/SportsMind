# SportsMind Platform Master Documentation
**Version: 1.0.0**
**Date: June 2026**

---

## Executive Summary

SportsMind is an elite, end-to-end artificial intelligence platform built specifically for football (soccer) intelligence. Unlike isolated ML notebooks or simple statistical dashboards, SportsMind provides a unified natural language synthesis layer that actively interprets complex machine learning predictions on the fly. 

The platform is designed to answer highly specific football queries, such as:
- *"How will Lamine Yamal perform vs PSG tonight?"*
- *"Is Rodri at high injury risk given the last 3 weeks of fixtures?"*
- *"What tactical weakness does Arsenal expose against a high press?"*

By combining XGBoost predictive modeling, SHAP explainability, K-Means tactical clustering, and a GPT-powered Retrieval-Augmented Generation (RAG) system, SportsMind delivers one coherent answer to the user—presented inside a deeply stylized, cyberpunk-themed Command Center.

This document serves as the comprehensive "Master File" covering every technical aspect of the platform: the frontend pages, the layout placements, the backend pipeline, the underlying data sources, and the ML mathematical models.

---

## 1. Global System Architecture

At a high level, the SportsMind platform is divided into a React/Next.js frontend and a Python/FastAPI backend.

### Data Flow Overview
1. **Ingestion:** Python scripts pull event and match data from APIs (StatsBomb, FBref, Transfermarkt) into a local SQLite/PostgreSQL database.
2. **Feature Store:** A centralized store pre-computes rolling averages, workloads, and historical matchups for every player.
3. **Concurrent ML Modules:** When the frontend requests an analysis, the FastAPI backend fires three ML models simultaneously (Performance, Injury, Tactics).
4. **LLM Synthesis:** The output of those three models, plus historically retrieved data from a Qdrant Vector Database, is fed into an LLM (Claude/GPT-4o) to generate a fluent paragraph.
5. **Frontend Rendering:** The React application receives the JSON and dynamically renders the SHAP charts, heatmaps, and the AI text.

---

## 2. Frontend Layout & AI Copilot Integration

The user interface of SportsMind is built with Next.js (App Router), Tailwind CSS, and Framer Motion. The UI is designed to feel like a "Command Center" (`bg-[#060d14]`, neon emeralds, roses, and blues, terminal-like fonts).

### The 3-Panel Global Layout
The entire application (outside of the landing page) utilizes a persistent **3-Panel Dashboard Layout** found in `app/(dashboard)/layout.tsx`.

1. **Left Panel (Navigation Sidebar):** 
   - A fixed `w-64` left-hand navigation pane.
   - Contains links to all core modules and the System Manual.
   - Displays real-time system status (e.g., Qdrant DB connection, XGB Models loaded).

2. **Center Panel (Main Viewport):**
   - Takes up the flexible remaining space (`flex-1`).
   - This is where the core module pages (Live, Performance, Injury, Tactics) and their respective charts render.
   
3. **Right Panel (AI Copilot Sidebar):**
   - A fixed `w-96` right-hand sidebar.
   - This is the **most critical layout feature**: The AI Copilot is *never* hidden. It is a permanent fixture of the dashboard.
   - **"Follows the User":** Because it is implemented at the root `layout.tsx` level, as the user clicks from "Tactical Analysis" to "Injury Risk", the AI Copilot remains seamlessly on screen, retaining its chat history and context.

### Inside the AI Copilot
Located at `components/layout/AICopilot.tsx`, this component manages the chat interface.
- **State Management:** Maintains an array of `messages` representing the conversation history.
- **Empty State & Quick Prompts:** If the user has not asked a question yet, the AI automatically displays a series of clickable chips (e.g., *"How will Lamine Yamal perform vs PSG?"*). Clicking a chip instantly queries the backend.
- **API Hookup:** Submitting a query calls `analyseQuery()` from `src/lib/api.ts`, which sends a `POST` request to the backend's `/analyse` endpoint.

---

## 3. Page Directory & Placements

The frontend contains several distinct pages, each serving a specific analytical purpose.

### A. Landing Page (`app/page.tsx`)
- **Purpose:** The entry point. It sets the aesthetic tone.
- **Features:** A full-screen video background, decrypted text animations, an infinite scrolling ticker showing live system statuses ("XGBoost Regressor Loaded"), and a bento-grid showcasing the 4 main modules.

### B. Command Center (`app/(dashboard)/dashboard/page.tsx`)
- **Purpose:** The central hub.
- **Layout:** A large 2x2 grid in the Center Panel displaying the 4 core modules. It acts as a launchpad. It pings the backend `checkHealth()` endpoint to show whether models are ONLINE or OFFLINE.

### C. Live Match Center (`app/(dashboard)/live/page.tsx`)
- **Purpose:** Real-time telemetry.
- **Metrics/Charts:** Displays **Momentum Gauges**. These gauges fill up based on ball possession zones, final third passes, and intense presses per minute.

### D. Performance Predictor (`app/(dashboard)/performance/page.tsx`)
- **Purpose:** Displays XGBoost regression outputs for xG (Expected Goals) and xA (Expected Assists).
- **Chart Placement:** Renders the **`ShapChart` Component**. This is a Recharts bar chart showing the SHAP values (how much each feature contributed to the final prediction).

### E. Injury Risk Analyzer (`app/(dashboard)/injury/page.tsx`)
- **Purpose:** Workload tracking and non-contact injury forecasting.
- **Chart Placement:** Renders the **`RiskBadge` Component**. A highly stylized visual indicator that glows green, amber, or red based on the Acute:Chronic Workload Ratio (ACWR).

### F. Tactical Analysis (`app/(dashboard)/tactics/page.tsx`)
- **Purpose:** Automated formation detection.
- **Chart Placement:** Renders the **`PitchHeatmap` Component**. A visual mapping of pitch coordinates overlaying a soccer field background, showing the "centroids" of player clusters.

### G. System Manual (`app/(dashboard)/guide/page.tsx`)
- **Purpose:** The tutorial page, heavily stylized, explaining exactly how to prompt the AI and how to read the complex machine learning charts.

---

## 4. Backend FastAPI Architecture

The backend is written in Python using FastAPI. It is designed for high concurrency so that heavy ML tasks don't block the API.

### The `/analyse` Endpoint
Found in `backend/api/routes/analyse.py`, this is the heart of the platform.

```python
@router.post("/analyse", response_model=AnalyseResponse)
async def analyse(request: AnalyseRequest):
    # 1. Start timer
    start = time.time()

    # 2. Concurrently execute the three heavy data modules
    performance, injury, tactical = await asyncio.gather(
        _run_performance(player_name, match_date, opponent),
        _run_injury(player_name, match_date),
        _run_tactical(opponent),
    )

    # 3. Pass the JSON results to the LLM Commentary generator
    analysis_text = await _run_commentary(
        request.query, performance, injury, tactical, player_name
    )

    # 4. Return unified response
    return AnalyseResponse(..., analysis=analysis_text)
```
Because XGBoost and Scikit-Learn (K-Means) are synchronous CPU-bound operations, FastAPI runs them in a ThreadPoolExecutor using `asyncio.get_event_loop().run_in_executor()`. This ensures the web server remains responsive.

---

## 5. The Four ML Modules Deep-Dive

### Module 1: Performance Prediction
- **Algorithm:** `xgboost.XGBRegressor`
- **Target:** Expected Goals (xG) and Expected Assists (xA) for an upcoming match.
- **Features:** `rolling_xg_5` (average over last 5 games), `opponent_press_intensity` (PPDA), `days_since_last_match`.
- **Explainability:** We run the trained model through `shap.TreeExplainer`. This generates an array of impacts (e.g., "Home Advantage: +0.2 xG"). The backend returns these to the frontend to render the `ShapChart`.

### Module 2: Injury Risk Prediction
- **Algorithm:** `xgboost.XGBClassifier`
- **Target:** 3-class classification (0 = Low, 1 = Medium, 2 = High Risk).
- **Features:** 
  - `sprint_distance_last_3`
  - `cumulative_minutes_season`
  - **ACWR (Acute:Chronic Workload Ratio):** The ratio of the last 7 days of workload vs the 28-day rolling average. If ACWR > 1.5, the model flags a massive spike in injury risk.
- **Output:** The Risk level drives the `RiskBadge` component on the frontend.

### Module 3: Tactical Analysis
- **Algorithm:** Unsupervised `sklearn.cluster.KMeans`
- **Data:** StatsBomb 360° freeze frames (every player's X,Y coordinate at the moment of an event).
- **Process:** We feed the average locations of players into K-Means with `n_clusters=10` (outfield players). The resulting `cluster_centers_` automatically expose the team's true spatial formation (e.g., exposing that a nominal 4-3-3 is actually defending as a deep 4-4-2).
- **Visualization:** Handled via Python's `mplsoccer` and returned as image URLs, or rendered natively via coordinates in the `PitchHeatmap` React component.

### Module 4: Commentary Generator (RAG)
- **Database:** Qdrant Vector DB (running via Docker on port 6333).
- **Embeddings:** We use `sentence-transformers` (`all-MiniLM-L6-v2`) to turn historical match summaries into 384-dimensional vector embeddings.
- **Process:** 
  1. The user's query (e.g., *"How does Yamal play vs PSG?"*) is embedded.
  2. Qdrant performs a Cosine Distance search to find the 5 most semantically similar historical matches.
  3. These historical facts are injected into a massive master prompt alongside the live XGBoost and K-Means predictions.
  4. The LLM (Claude/GPT) generates the final 150-word synthesis.

---

## 6. Data Sources & ETL

No ML platform functions without data. SportsMind utilizes a multi-source ETL (Extract, Transform, Load) ingestion layer.

1. **StatsBomb Open Data:** Accessed via `statsbombpy`. Provides incredibly detailed event-level data and 360-degree freeze frames. Used heavily for Tactical Clustering and xG rolling averages.
2. **FBref:** Accessed via HTML scraping or `soccerdata`. Provides season-long fatigue metrics, per-90 workload stats, and pressure counts.
3. **Transfermarkt:** Used strictly for schedule congestion data (e.g., calculating exactly how many resting hours a player had between flights and fixtures).
4. **API-Football:** A real-time REST API used to populate the Live Match Center with ticking game clocks and live events.

All data is parsed by pandas in the `backend/ingestion` directory and cached in a local SQLite database to prevent redundant API calls during development.

---

## Summary of the User Journey

1. The user lands on the highly stylized `app/page.tsx` and clicks "Deploy Command Center".
2. They are taken to `/dashboard`. They see the navigation on the left, 4 modules in the center, and the AI Copilot waiting on the right.
3. They click the "How will Lamine Yamal perform vs PSG?" quick prompt in the AI Copilot.
4. The React frontend sends this string to `/analyse`.
5. The FastAPI backend fires XGBoost, K-Means, and Qdrant in parallel.
6. Claude synthesizes the data and streams it back.
7. The user reads the analysis in the AI Copilot sidebar.
8. Curious about the tactics mentioned, the user clicks "Tactical Analysis" in the left sidebar.
9. The center panel navigates to `/tactics`, rendering the `PitchHeatmap`.
10. The AI Copilot remains seamlessly docked on the right, retaining the conversation history about Lamine Yamal, allowing the user to seamlessly ask follow-up questions while looking at the pitch heatmap.

---
*End of Comprehensive Documentation.*
