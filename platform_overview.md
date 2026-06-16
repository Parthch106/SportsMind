# SportsMind Platform Architecture & Structure

This document outlines the current state of the SportsMind platform, detailing the pages, backend mechanics, and the placement of charts and AI components.

## 1. Page Structure & Navigation

The frontend is built using Next.js (App Router) and features a unified **3-Panel Dashboard Layout**:
- **Left Panel:** Global Navigation Sidebar (64px wide).
- **Center Panel:** The main content view.
- **Right Panel:** The persistent AI Copilot chatbot (96px wide), ever-present and context-aware.

### Available Pages:
1. **Landing Page (`/`)**: A high-impact hero page with an infinite ticker, bento grid features, and video background.
2. **Command Center (`/dashboard`)**: The central hub displaying a 2x2 grid of the four core modules.
3. **Live Match Center (`/live`)**: Displays real-time telemetry and match momentum.
4. **Performance Prediction (`/performance`)**: Focuses on player performance metrics like Expected Goals (xG).
5. **Injury Risk (`/injury`)**: Monitors rolling workloads to flag soft tissue injury risks.
6. **Tactical Analysis (`/tactics`)**: Uses clustering to visualize team formations.
7. **System Manual (`/guide`)**: A detailed tutorial explaining the ML models and how to query the AI.

---

## 2. Component & Chart Placement

The platform uses custom React components to visualize complex Machine Learning outputs. All charts are rendered in the **Center Panel** based on the active page.

| Page / Module | Main Component | Description |
|---|---|---|
| **Performance Prediction** | `ShapChart` | A bar chart visualizing SHAP values. Red bars show features that positively impacted a prediction (e.g., high xG), while blue bars show negative impact. |
| **Injury Risk** | `RiskBadge` | A visual indicator triggered by Acute:Chronic Workload Ratios (ACWR). Warns of "Critical Risk" when the ratio exceeds 1.5. |
| **Tactical Analysis** | `PitchHeatmap` | A visualization powered by K-Means clustering that maps pitch coordinate density to expose spatial vulnerabilities. |
| **All Dashboard Pages** | `AICopilot` | **Placement: Fixed Right Sidebar**. It is the central intelligence node, providing natural language explanations of any chart or metric on screen. |

---

## 3. Backend Architecture

The backend operates as a highly concurrent ML synthesis engine, powered by Python and FastAPI.

### How it works:
1. **Data Ingestion**: The backend consumes raw data from StatsBomb, FBref, and Transfermarkt, storing computed features in a central SQLite database.
2. **Four Concurrent Modules**: When a query is received, the backend executes four processes simultaneously:
   - **XGBoost Regression**: Predicts xG and key passes.
   - **XGBoost Classifier**: Determines injury risk probabilities.
   - **K-Means Clustering**: Calculates tactical shape and centroids.
   - **Qdrant Vector DB (RAG)**: Retrieves historical match context based on the query.
3. **LLM Synthesis Layer (`/analyse` endpoint)**: 
   - All the JSON data from the four modules above is aggregated into a single mega-prompt.
   - This prompt is sent to the LLM (GPT-5/Claude).
   - The LLM synthesizes a fluent, natural language response (max 150 words) that leads with predictions, explains SHAP drivers, adds historical flavor, and closes with tactics.
4. **API Layer**: The FastAPI backend serves this unified response to the React frontend, where it is instantly displayed by the AI Copilot.

---

*This document serves as a high-level map of the codebase and application flow as of version 1.0.*
