# SportsMind: Comprehensive Project Overview

## 1. What is the Project?

**SportsMind** is an elite, end-to-end artificial intelligence platform built specifically for football (soccer) intelligence. It goes beyond isolated machine learning notebooks or simple statistical dashboards by providing a unified natural language synthesis layer that actively interprets complex machine learning predictions on the fly.

The platform is designed to answer highly specific football queries, such as:
- *"How will Lamine Yamal perform vs PSG tonight?"*
- *"Is Rodri at high injury risk given the last 3 weeks of fixtures?"*
- *"What tactical weakness does Arsenal expose against a high press?"*

By combining predictive modeling, explainability tools, tactical clustering, and a Retrieval-Augmented Generation (RAG) system, SportsMind delivers a single coherent answer to the user. This analysis is presented inside a deeply stylized, cyberpunk-themed Command Center interface.

The platform is structured into four core analytical modules:
1. **Live Match Center**: Real-time telemetry and momentum tracking.
2. **Performance Predictor**: Expected Goals (xG) and Expected Assists (xA) forecasting.
3. **Injury Risk Analyzer**: Workload tracking and non-contact injury forecasting.
4. **Tactical Analysis**: Automated formation detection and pitch heatmaps.

---

## 2. What Technologies It Uses

The platform uses a modern, high-performance tech stack divided into Frontend, Backend, Machine Learning, and Infrastructure layers.

### Frontend Technologies
- **Next.js 15 (App Router)**: Core React framework for building the user interface.
- **TypeScript**: For static typing and robust code structure.
- **Tailwind CSS**: For utility-first styling, creating the neon cyberpunk aesthetic (`bg-[#060d14]`, neon emeralds).
- **Framer Motion**: For fluid animations and decrypted text effects.
- **Recharts**: For rendering data visualizations (e.g., SHAP bar charts).

### Backend Technologies
- **Python 3.11**: The primary language for all backend, ETL, and ML operations.
- **FastAPI**: Asynchronous web framework for building the REST API.
- **Uvicorn**: ASGI web server implementation for Python.

### Machine Learning & AI
- **XGBoost**: Gradient boosting framework used for regression (Performance) and classification (Injury) tasks.
- **scikit-learn**: Used specifically for unsupervised K-Means clustering (Tactics).
- **SHAP (SHapley Additive exPlanations)**: For model explainability, breaking down why a model made a specific prediction.
- **mplsoccer**: Python library for drawing soccer pitches and visualizing tactical heatmaps.
- **sentence-transformers (`all-MiniLM-L6-v2`)**: For converting text data into vector embeddings.
- **OpenAI GPT-5 (via GitHub Models)**: The Large Language Model (LLM) that powers the AI Copilot commentary.

### Data & Infrastructure
- **Qdrant**: Vector database for storing and querying text embeddings (RAG).
- **SQLite / PostgreSQL**: Local relational database (`features.db`) serving as the central Feature Store.
- **pandas**: For data manipulation during the ETL process.
- **Docker & Docker Compose**: For containerizing the application, specifically running the Qdrant instance and coordinating the API and Frontend containers.

### Data Sources
- **StatsBomb Open Data**: Event-level data and 360-degree freeze frames.
- **FBref**: Demographic metadata, fatigue metrics, and per-90 workload stats.
- **Transfermarkt**: Schedule congestion data and resting hours.
- **API-Football**: Real-time REST API for live match telemetry.

---

## 3. How the Technologies are Used

This section details how the technologies intertwine to create the seamless SportsMind experience.

### A. The Next.js Frontend Layout & AI Copilot
The UI is constructed using **Next.js 15** and heavily styled with **Tailwind CSS**. The core of the application utilizes a persistent 3-Panel Dashboard Layout:
1. **Navigation Sidebar**: Contains links to all core modules.
2. **Main Viewport**: Renders the specific module pages (e.g., Performance, Tactics) and their respective charts (built with **Recharts**).
3. **AI Copilot Sidebar**: A persistent chat interface that "follows the user" across pages. Submitting a query here triggers a REST API call to the FastAPI backend's `/analyse` endpoint.

### B. FastAPI High-Concurrency Backend
**FastAPI** is designed to handle multiple tasks concurrently. When the frontend sends a prompt to `/analyse`, FastAPI uses Python's `ThreadPoolExecutor` and `asyncio` to run three CPU-bound Machine Learning tasks simultaneously without blocking the web server:
- `_run_performance()`
- `_run_injury()`
- `_run_tactical()`

### C. The Machine Learning Modules

**1. Performance Prediction (XGBoost & SHAP)**
The system uses `xgboost.XGBRegressor` to predict a player's Expected Goals (xG) and Expected Assists (xA). It takes features like a 5-game rolling xG average and opponent press intensity. The trained model is passed through `shap.TreeExplainer`, which outputs the specific impact of each feature (e.g., "Home Advantage: +0.2 xG"). These SHAP values are sent to the frontend to render the Recharts bar chart.

**2. Injury Risk Prediction (XGBoost)**
Using `xgboost.XGBClassifier`, the system calculates injury risk across three classes (Low, Medium, High). A critical feature calculated via **pandas** is the Acute:Chronic Workload Ratio (ACWR)—comparing the last 7 days of workload against a 28-day rolling average. The resulting prediction dynamically updates the glowing `RiskBadge` component on the frontend.

**3. Tactical Analysis (scikit-learn & mplsoccer)**
Using **StatsBomb** 360° freeze frame data, the backend extracts player coordinate locations. It feeds this data into `sklearn.cluster.KMeans` (with `n_clusters=10` for outfield players) to automatically discover the team's true spatial formation, which might differ from their nominal lineup. **mplsoccer** is used to plot these cluster centroids onto a pitch heatmap visualization.

### D. The RAG System & LLM Synthesis
SportsMind implements a Retrieval-Augmented Generation pipeline to give context to its AI Copilot:
1. Historical match summaries are converted into 384-dimensional vector embeddings using the **sentence-transformers** library.
2. These embeddings are stored in a **Qdrant** vector database (running via **Docker**).
3. When a user asks a question, the query is embedded, and Qdrant performs a Cosine Distance search to retrieve the most semantically similar historical matches.
4. The retrieved context, along with the real-time outputs from the XGBoost and K-Means models, are aggregated into a massive prompt.
5. This prompt is sent to **GPT-5**, which synthesizes the complex data into a fluent, easy-to-read 150-word paragraph displayed in the Next.js frontend.

### E. Data ETL Pipeline
Before any predictions occur, Python scripts extract data from **StatsBomb**, **FBref**, and **Transfermarkt**. **pandas** transforms this raw data into unified features (like rolling averages and workloads), which are loaded into a local **SQLite** database (`features.db`). This Feature Store ensures fast, sub-second data retrieval during live model inference.

---

## 4. The Comprehensive Pipeline Architecture

The platform relies on a "Master Orchestrator" that acts as the central controller between the user query and the underlying modules. It executes these steps sequentially to generate the final response:

1. **Query Parsing**: The Orchestrator extracts the player, opponent, date, and question type from the query.
2. **Parallel Module Execution**: All four ML/AI modules run concurrently (no waiting for one to finish before starting another).
3. **Result Validation**: Outputs are checked, and any missing data is replaced with explicit fallbacks to prevent LLM hallucination.
4. **Unified Prompt Assembly**: Outputs from all modules are combined into a structured prompt containing system instructions, performance data, injury risk data, tactical analysis, RAG context, and the original query.
5. **Response Packaging**: The LLM synthesizes the data into a strict 5-paragraph narrative, which is then packaged alongside the raw module metrics for the frontend charts to render.

### The Four Pipelines

**Module 1: Performance Prediction Pipeline**
- Pulls rolling averages, opponent defensive pressure (PPDA), and match history from the Feature Store.
- Passes features into an **XGBoost Regressor** to predict expected goals (xG) and expected assists (xA).
- Runs **SHAP TreeExplainer** to identify the top 5 drivers behind the prediction (e.g., "Strong recent form: +0.31 xG").

**Module 2: Injury Risk Prediction Pipeline**
- Retrieves workload data including sprint distances, high-intensity actions, and cumulative minutes.
- Calculates the **Acute:Chronic Workload Ratio (ACWR)** (last 7 days vs rolling 28 days).
- Feeds data into an **XGBoost Classifier** to predict Low, Medium, or High risk, retaining the top 3 SHAP explanations and suggesting a rest/rotation recommendation.

**Module 3: Tactical Analysis Pipeline**
- Processes StatsBomb 360° freeze frame data and concession events for an opponent's last 10 matches.
- Uses **K-Means clustering (n=10)** on outfield player coordinates to detect the true spatial formation.
- Computes concession probabilities across 6 pitch zones to identify the opponent's primary vulnerability (e.g., Zone 14 or Half-Spaces).
- Generates a 5-dimension "Tactical Fingerprint" (High Press, Compactness, Counter Attack, Direct Play, Width).

**Module 4: Commentary & RAG Pipeline**
- Embeds the user's query into a 384-dimensional vector using **sentence-transformers**.
- Performs a cosine distance search in **Qdrant** against three collections: match narratives, player profiles, and tactical summaries.
- Retrieves the top 3 most semantically similar historical facts, ensuring a confidence threshold is met, to inject factual memory into the final LLM prompt.
