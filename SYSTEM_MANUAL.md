# SportsMind - System Manual & Architecture Guide

## 1. Executive Summary
SportsMind is an advanced AI-powered football analytics platform designed to synthesize raw event data, track workloads, and generate real-time predictive insights for professional football teams. This manual provides a comprehensive overview of the system's architecture, frontend pages, charting mechanisms, backend machine learning pipelines, and the integrated AI Copilot.

---

## 2. Frontend Architecture & Application Pages
The frontend is built on **Next.js 14+** using the App Router, styled with **Tailwind CSS**, and features dynamic charts powered by **Recharts**. The layout is designed to maximize data density while keeping the AI Copilot constantly accessible.

### Global Layout Structure
The application uses a persistent layout wrapped in `DashboardLayout`:
1. **Left Sidebar (`w-64`)**: Contains primary navigation links to all modules.
2. **Main Content Area**: The dynamic center view where specific modules and charts render.
3. **Right Sidebar (`w-96`)**: The AI Copilot panel is permanently pinned to the right side of the screen across all pages, allowing users to query insights regardless of which module they are viewing.

### The 4 Core Pages
1. **Command Center (Home)**: A high-level overview of the squad's health, upcoming fixtures, and quick tactical alerts.
2. **Performance Predictor (`/performance`)**: Focuses on individual player output (e.g., expected goals, key passes) using predictive ML models.
3. **Injury Risk (`/injury`)**: Monitors player workload and calculates the probability of injury using the Acute:Chronic Workload Ratio (ACWR).
4. **Tactical Analysis (`/tactics`)**: Analyzes positional data, action zones, and opponent vulnerabilities.

---

## 3. Backend Architecture & Data Flow
The backend is a high-performance **FastAPI** Python server that handles data ingestion, machine learning inference, and Large Language Model (LLM) orchestration.

### Core Components
- **Data Ingestion (`ingestion/run_ingestion.py`)**: Connects to StatsBomb (via `statsbombpy`) for event-level match data and FBref (via `soccerdata`) for season-long profile statistics.
- **Feature Store (`features.db`)**: A SQLite database that computes and caches complex metrics like "5-match rolling xG" and "3-match sprint distances". This ensures the API remains incredibly fast (sub-100ms) without needing to re-aggregate thousands of events on every request.
- **Model Layer (`models/`)**: Contains the standalone training scripts and inference endpoints for the XGBoost and Scikit-Learn models.
- **API Orchestrator (`api/routes/analyse.py`)**: The central brain of the backend. When a query is received, this route spins up asynchronous threads to simultaneously execute the Performance, Injury, and Tactical models, merging their outputs into a single unified JSON response.

---

## 4. Modules & Visualizations (The Charts)
SportsMind relies heavily on data visualization to make complex ML outputs digestible.

### Module 1: Performance Predictor (XGBoost Regressor)
**Backend:** Uses an XGBoost model trained on historical La Liga match data. It takes in rolling averages and match context to predict Expected Goals (xG) and Expected Assists (xA).
**Charts (`PerformancePage`):**
- **Profile Analysis (Radar Chart)**: Compares a player's season averages (xG, Key Passes, Dribbles) against positional baselines.
- **Form Timeline (Line Chart)**: Displays the player's last 5 matches sequentially, appending the AI's prediction for the current match at the very end of the timeline.
- **Top SHAP Drivers (Bar Chart)**: Explains the "why" behind the prediction. It shows which features (e.g., Form, Minutes Load, Opponent Strength) positively or negatively impacted the XGBoost prediction.

### Module 2: Injury Risk Predictor
**Backend:** Uses Workload algorithms (ACWR) and Isolation Forests to detect anomalous physical loads that precede soft-tissue injuries.
**Charts (`InjuryPage`):**
- **Workload Timeline (Area/Line Chart)**: Maps the daily intensity score over the last 30 days. Spikes represent intense match days, while the baseline represents training load.
- **Squad Risk Scatter Plot (Scatter Chart)**: Maps the entire squad by Age vs Cumulative Minutes. The color of the dot (Green/Yellow/Red) indicates the ML model's assigned risk tier.

### Module 3: Tactical Analysis
**Backend:** Evaluates spatial data and pass clustering to identify formations and vulnerabilities (e.g., wide channel exposure).
**Charts (`TacticsPage`):**
- **Pitch Heatmap (Action Zones)**: A custom UI component that draws a football pitch and overlays heatmap blobs indicating where a player or team is most active (or where they concede the most chances).
- **Tactical Fingerprint (Radar Chart)**: Evaluates the team's style of play across axes like High Press, Compactness, and Direct Play.

---

## 5. The AI Copilot & RAG Pipeline
The AI Copilot is the defining feature of SportsMind. It bridges the gap between raw statistical output and actionable managerial advice.

### Placement & User Experience
The Copilot is anchored to the right side of the screen (`AICopilot.tsx`). Users can type natural language questions (e.g., *"How will Messi perform against Real Madrid?"*). The system immediately sends this query to the backend.

### How it Works (The RAG Flow)
1. **Intent Extraction**: The query is parsed to identify the target player and match date.
2. **Concurrent ML Inference**: The backend runs the XGBoost, Injury, and Tactical models silently in the background to get hard numbers.
3. **Retrieval Augmented Generation (RAG)**: 
   - The query is embedded using a `SentenceTransformer` (`all-MiniLM-L6-v2`).
   - The embedded vector is sent to **Qdrant** (a local vector database) to retrieve semantic context from historical match reports, tactical patterns, and player profiles.
4. **LLM Synthesis**: The hard ML predictions (e.g., Predicted xG: 0.8) and the soft RAG context are injected into a highly specific system prompt.
5. **Streaming Output**: The prompt is sent to an Azure-hosted LLM (like GPT-4o), which streams a comprehensive, natural-language analysis back to the frontend chat panel. 

### Graceful Degradation
To ensure the system never breaks during a live match scenario:
- If Qdrant is empty or offline, the RAG retriever instantly catches the error, logs `Collection not found`, and bypasses the vector search, relying purely on the live ML data.
- If an ML model is untrained or fails, the API catches the exception and gracefully injects fallback mock data into the LLM context to keep the UI functioning smoothly.
