# SportsMind — Pipeline, AI Output & Layout Specification
**Version: 1.1.0 — Pipeline & Frontend Reference**
**Date: June 2026**

---

## Table of Contents

1. [The Master Orchestrator Pipeline](#1-the-master-orchestrator-pipeline)
2. [Module 1 — Performance Prediction Pipeline](#2-module-1--performance-prediction-pipeline)
3. [Module 2 — Injury Risk Prediction Pipeline](#3-module-2--injury-risk-prediction-pipeline)
4. [Module 3 — Tactical Analysis Pipeline](#4-module-3--tactical-analysis-pipeline)
5. [Module 4 — Commentary & RAG Pipeline](#5-module-4--commentary--rag-pipeline)
6. [How the AI Copilot Should Structure Its Output](#6-how-the-ai-copilot-should-structure-its-output)
7. [Page Layouts & Chart Specifications](#7-page-layouts--chart-specifications)
8. [Data Contract — What Each Module Returns](#8-data-contract--what-each-module-returns)
9. [Error States & Fallback Behaviour](#9-error-states--fallback-behaviour)

---

## 1. The Master Orchestrator Pipeline

### What it is

The Master Orchestrator is the single controller that sits between the user's query and the four ML modules. When the AI Copilot receives a question, it does not call each module independently — it calls the Master Orchestrator once, which is responsible for routing, running all modules in parallel, collecting their outputs, and packaging everything into a single unified response object.

Think of it as the conductor of an orchestra. Each module is a musician. The conductor tells them all to play simultaneously and combines their sound into one coherent piece.

### The Orchestrator's responsibilities

The Orchestrator has exactly five responsibilities, in strict order:

**Responsibility 1 — Query parsing**
Before running any model, the Orchestrator reads the incoming query and extracts the entities it needs. It identifies the player name being asked about, the opponent team if mentioned, the date or match context, and the type of question being asked (performance, injury, tactical, or general). This parsing step determines which modules need to run and what inputs they receive.

**Responsibility 2 — Parallel module execution**
The Orchestrator fires all four modules at the same time. It does not wait for Performance to finish before starting Injury. All four run concurrently. The Orchestrator waits until all four have returned their results before proceeding.

**Responsibility 3 — Result validation**
Before passing results to the LLM, the Orchestrator checks each module's output for completeness. If a module returns an error or empty data, the Orchestrator replaces it with a clearly labelled fallback value rather than passing broken data into the prompt. This prevents the LLM from hallucinating to fill gaps.

**Responsibility 4 — Unified prompt assembly**
The Orchestrator takes the validated outputs from all four modules and assembles them into a single structured prompt for the LLM. The prompt has a fixed format: system instructions first, then performance data, then injury data, then tactical data, then RAG context, then the original user query.

**Responsibility 5 — Response packaging**
After the LLM generates the narrative, the Orchestrator packages everything into one final response object. This object contains the LLM narrative text, the raw module outputs (so the frontend can render charts), and metadata like processing time and which data sources were used.

### The full orchestrator flow, step by step

```
User query arrives at /analyse endpoint
         │
         ▼
Step 1: Parse query → extract player, opponent, date, question type
         │
         ▼
Step 2: Resolve player ID and match ID from the database
         │
         ▼
Step 3: Fire all four modules simultaneously
    ┌────┬────┬────┐
    │    │    │    │
   M1   M2   M3   M4
   Perf Inj  Tac  RAG
    │    │    │    │
    └────┴────┴────┘
         │
         ▼
Step 4: Collect all four results — wait for the slowest module
         │
         ▼
Step 5: Validate each result — replace errors with fallbacks
         │
         ▼
Step 6: Assemble master prompt with all four outputs
         │
         ▼
Step 7: Send prompt to LLM → receive narrative text
         │
         ▼
Step 8: Package final response object
         │
         ▼
Step 9: Return unified JSON to React frontend
         │
         ▼
Frontend renders: charts from module data + narrative from LLM
```

### What triggers the Orchestrator

The Orchestrator is triggered in three ways:

The first is a direct AI Copilot query — the user types or clicks a quick prompt in the right sidebar and the frontend calls the `/analyse` endpoint.

The second is a page load trigger — when the user navigates to a specific module page (e.g., the Injury Risk page), that page automatically calls the Orchestrator with the currently selected player to pre-populate its charts with live data.

The third is a background refresh — every 5 minutes during a live match, the Live Match Center triggers the Orchestrator silently to update momentum and possession data without requiring user input.

### What the Orchestrator does NOT do

The Orchestrator does not train or retrain models. Model training is a separate offline process. The Orchestrator only calls pre-trained, already-loaded models for inference. It also does not store the conversation history — that is handled by the React Context layer in the frontend. The Orchestrator is stateless; every call is independent.

---

## 2. Module 1 — Performance Prediction Pipeline

### Purpose

This module answers the question: "How well will this player perform in the next match?" It outputs a predicted xG (Expected Goals) and xA (Expected Assists) score, along with a ranked list of the features that drove the prediction.

### Pipeline stages

**Stage 1 — Input collection**
The module receives three inputs from the Orchestrator: the player's unique ID, the opponent team's ID, and the match date. These are the only three things it needs to begin.

**Stage 2 — Feature retrieval from the Feature Store**
The module does not compute features from scratch on every call. Instead, it reads pre-computed features from the shared Feature Store (a SQLite table updated nightly). The features it retrieves are:

- Rolling average xG over the last 5 matches
- Rolling average key passes over the last 5 matches
- Rolling average progressive runs over the last 5 matches
- The player's xG performance specifically against this opponent in past meetings
- The opponent's PPDA (Passes Per Defensive Action) — a measure of how aggressively they press
- The opponent's defensive line height — how high or low they defend
- Whether this match is home or away for the player's team
- Days since the player's last competitive match
- The player's current season form score (a weighted composite of the last 10 match ratings)

**Stage 3 — XGBoost inference**
The retrieved features are assembled into a single row vector and passed through the pre-loaded XGBoost Regressor model. The model outputs two numbers: predicted xG and predicted xA for the upcoming match. These are regression outputs, not classifications — they are continuous values, not categories.

**Stage 4 — SHAP explanation generation**
After the model produces its prediction, the module runs the same feature vector through a SHAP TreeExplainer. SHAP assigns a numerical impact score to each feature, showing exactly how much each one pushed the prediction up or down. The module keeps the top 5 SHAP drivers, sorts them by absolute impact, and converts them into human-readable strings. For example, a raw SHAP value of +0.31 on the `rolling_xg_5` feature becomes "Strong recent form: +0.31 xG boost."

**Stage 5 — Confidence score calculation**
The module computes a confidence score for the prediction based on how much historical data exists for this player-opponent matchup. If the player has faced this opponent 10+ times, confidence is high. If they have never met before, confidence is lower and the module flags this in the output.

**Stage 6 — Output packaging**
The module returns a structured object containing the predicted xG, predicted xA, confidence score, the top 5 SHAP drivers as human-readable strings, and a raw SHAP array for the frontend chart to render.

### What can go wrong and how it is handled

If the player has no historical data in the Feature Store (a new signing, for example), the module returns a "data insufficient" flag and estimated values based on positional averages rather than refusing to respond. If the Feature Store is unavailable, the module returns cached values from the last successful run with a timestamp indicating how stale the data is.

---

## 3. Module 2 — Injury Risk Prediction Pipeline

### Purpose

This module answers: "Is this player at risk of a non-contact injury in the next 14 days?" It outputs a risk classification (Low, Medium, High), a risk probability score between 0 and 1, and an explanation of the primary risk factors.

### Pipeline stages

**Stage 1 — Input collection**
The module receives the player ID and the current date. It does not need a match ID because injury risk is assessed across the entire upcoming period, not for a specific fixture.

**Stage 2 — Workload data retrieval**
The module pulls the player's recent workload history from the Feature Store and the raw schedule data from the ingestion layer. The specific values it retrieves are:

- Total minutes played in the last 7 days (acute workload)
- Total minutes played in the last 28 days (chronic workload)
- Number of matches played in the last 14 days
- Number of days between the last match and today
- High-intensity running distance (sprints above 25 km/h) in each of the last 3 matches
- Number of high-intensity actions (tackles + pressures + aerial duels) per 90 minutes in the last 5 matches
- The player's cumulative minutes for the current season
- Player age
- The count of soft tissue injuries in the player's historical record

**Stage 3 — ACWR computation**
Before running the model, the module computes the Acute:Chronic Workload Ratio manually. This is the single most important injury risk signal. The acute workload is the total high-intensity minutes in the last 7 days. The chronic workload is the rolling 28-day average. The ratio is acute divided by chronic. A ratio between 0.8 and 1.3 is the "sweet spot" — the player is training at or near their normal level. A ratio above 1.5 means the player has dramatically spiked their workload recently, which is the primary predictor of soft tissue injury. A ratio below 0.5 means the player is severely undertrained, which carries its own injury risk when they return to high intensity.

**Stage 4 — XGBoost Classifier inference**
All workload features plus the computed ACWR are passed into the pre-loaded XGBoost Classifier. The classifier outputs a probability distribution across three classes: Low (0), Medium (1), and High (2) risk. The class with the highest probability is the predicted risk level. The raw probability for the High class is retained as the "risk score" shown in the frontend gauge.

**Stage 5 — SHAP explanation generation**
The same SHAP TreeExplainer process as Module 1 is applied here. The top 3 risk factors are identified and converted to plain English. For example, a high SHAP value on `matches_last_14_days` becomes "4 matches in 14 days: major fatigue accumulation." These explanations are what the AI Copilot reads out and what appears in the Current Assessment panel.

**Stage 6 — Rest recommendation generation**
Based on the risk level and the ACWR value, the module appends a simple recommendation string. At High risk, it recommends rotation and flags the specific muscle group most at risk based on which features are driving the prediction. At Medium risk, it recommends load monitoring. At Low risk, it confirms the player is within safe thresholds.

**Stage 7 — Output packaging**
The module returns the risk class, the risk probability score (0–1), the ACWR value, the top 3 SHAP explanations, the rest recommendation string, and the raw 30-day workload array for the frontend timeline chart.

---

## 4. Module 3 — Tactical Analysis Pipeline

### Purpose

This module answers: "What is this team's tactical shape, and where are they most vulnerable?" It does not predict a specific score or risk level — it produces a spatial and pattern-based description of how a team plays and where they concede.

### Pipeline stages

**Stage 1 — Input collection**
The module receives the opponent team ID. It does not need a player ID or date for its primary function, though it accepts a date to filter data to the most recent 10 matches of that team.

**Stage 2 — Event data retrieval**
The module pulls two types of data from the ingestion layer for the specified team across their last 10 matches:

First, it pulls StatsBomb 360° freeze frame data — the X and Y coordinate of every player on the pitch at the moment of every significant event. This is the raw spatial data for formation clustering.

Second, it pulls concession events — every goal, shot on target, and dangerous chance conceded, with their pitch coordinates and the match context (formation, opposition type, match state).

**Stage 3 — Formation detection via K-Means clustering**
The module takes the average positions of all 10 outfield players across multiple defensive phases (moments when the team is out of possession). These average positions form a 10-row matrix of X,Y coordinates. K-Means with n_clusters=4 is applied to group these positions into four lines: defensive line, midfield line, attacking line, and wide players. The centroid of each cluster represents the average position of that line. From the spatial arrangement of these four centroids, the module infers the team's formation. For example, if the defensive line has 4 positions, the midfield has 3, and the attacking line has 3, the formation is 4-3-3.

**Stage 4 — Zone vulnerability analysis**
The pitch is divided into 6 named zones: Wide Left, Half-Space Left, Zone 14 (central attacking midfield corridor), Box Centre, Half-Space Right, and Wide Right. For each concession event, the module records which zone the attack originated from and the xG of the resulting chance. It then computes a concession probability for each zone — the percentage of the team's total chances conceded that originated from that zone. This directly answers "where does this team leak?"

**Stage 5 — Tactical fingerprint scoring**
The module scores the team on 5 tactical dimensions, each on a 0–100 scale:
- High Press intensity: based on average PPDA across the last 10 matches
- Compactness: based on average distance between defensive and midfield lines
- Width: based on average horizontal spread of outfield players in possession
- Direct Play: based on ratio of long passes to short passes
- Counter Attack tendency: based on transition speed from defensive to attacking events

These 5 scores form the "Tactical Fingerprint" that is visualised as a pentagon radar chart on the frontend.

**Stage 6 — Vulnerability summary generation**
The module identifies the two highest-scoring vulnerability zones and writes a plain-English summary string. For example: "PSG concede 71% of dangerous chances through the central box and left half-space. Their high line leaves Zone 14 exposed to through balls."

**Stage 7 — Pitch heatmap data generation**
For frontend rendering, the module returns two datasets: the raw cluster centroid coordinates (for the formation dots on the pitch map) and a zone-level probability array (for the colour-coded concession heatmap). The frontend uses these coordinates directly to render the pitch visualisation without needing a pre-rendered image.

**Stage 8 — Output packaging**
The module returns the detected formation string, the zone vulnerability probabilities (6 values), the tactical fingerprint scores (5 values), the vulnerability summary string, the cluster centroid coordinates, and the raw concession event coordinates.

---

## 5. Module 4 — Commentary & RAG Pipeline

### Purpose

This module provides the historical memory and natural language voice of the platform. It retrieves semantically relevant historical facts about the player and match context from the vector database, and then — in combination with the Orchestrator — passes everything to the LLM to generate the final narrative.

### Pipeline stages

**Stage 1 — Input collection**
The module receives the original user query string. This is the only input it needs. The query is used both for semantic retrieval and as the final question the LLM must answer.

**Stage 2 — Query embedding**
The raw query text is passed through the sentence-transformers model (all-MiniLM-L6-v2). This converts the natural language query into a 384-dimensional vector embedding — a list of numbers that captures the semantic meaning of the question.

**Stage 3 — Qdrant semantic search**
The 384-dimensional query vector is sent to the Qdrant vector database with a request for the top 5 most similar records. Qdrant uses cosine distance to find the 5 stored match narratives whose embeddings are most semantically close to the query. These 5 records are the historical context chunks.

**Stage 4 — Context extraction and ranking**
The 5 retrieved records are sorted by relevance score (highest cosine similarity first). Each record is a plain-text narrative string such as "Lamine Yamal scored twice and provided an assist against PSG in the Champions League quarter-final on 16 April 2025, operating primarily from the right channel and completing 8 of 9 dribbles." Only the top 3 records are passed forward if all 5 are returned, to keep the prompt concise.

**Stage 5 — Context quality check**
Before passing context to the Orchestrator, the module checks that the retrieved records are actually relevant. If the top result has a cosine similarity below 0.6, the module flags the context as "low confidence" and passes an explicit note to the Orchestrator: "No strong historical precedent found for this matchup." This prevents the LLM from treating weakly-relevant context as authoritative.

**Stage 6 — Context packaging**
The module returns the top 3 retrieved narrative strings, their similarity scores, and the low-confidence flag if applicable. These are passed to the Orchestrator, which includes them in the master prompt assembly.

### What lives in the Qdrant vector database

The database contains three types of records, stored in separate collections:

The first collection is match narratives — one record per player per match, describing what happened: goals, assists, key moments, and contextual notes. Each record is 2–4 sentences. These come from StatsBomb event data transformed into text during the nightly ingestion process.

The second collection is player profiles — one record per player, summarising their long-term tendencies: preferred foot, dominant zones, pressing habits, historical performance under fatigue, and career injury record. These are updated monthly.

The third collection is tactical summaries — one record per team per season, describing their predominant formation, pressing style, and historical vulnerability zones. These are updated after every 5 matches.

---

## 6. How the AI Copilot Should Structure Its Output

### The core principle

The AI Copilot is not a chatbot and must not sound like one. It is a football analyst with access to quantitative data. Every response must be grounded in the actual numbers returned by the four modules. The AI must never generate a sentence that is not directly supported by either a module output or a retrieved historical fact. Vague football platitudes like "he is a talented player who will need to perform well" are unacceptable.

### The mandatory output structure

Every AI Copilot response, regardless of the question asked, must follow this exact five-paragraph structure. Each paragraph has a specific job.

**Paragraph 1 — The Verdict (1–2 sentences)**
Open with the single most important number or conclusion from the analysis. This is the answer to the user's question in plain English. Do not begin with "Based on our analysis..." or "According to the data...". Begin directly with the finding.

Examples of correct opening sentences:
- "Lamine Yamal is projected to create 1.4 expected goals tonight, making him the most dangerous threat in this fixture."
- "Rodri is at HIGH injury risk — an 87% probability driven by four matches in the last 12 days."
- "PSG's primary tactical weakness is the central box, where 68% of their conceded chances originate."

Examples of incorrect opening sentences:
- "Based on our XGBoost model, we predict that..."
- "The data suggests that Lamine Yamal may potentially..."
- "Great question! Let me break down what the analysis shows..."

**Paragraph 2 — The Evidence (2–3 sentences)**
Explain the top 2–3 SHAP drivers from the Performance or Injury module in plain English. Name the specific features and their direction of impact. Do not use technical jargon — translate SHAP values into football language. Do not say "the SHAP value for rolling_xg_5 is +0.31". Say "his form over the last five matches is the biggest single driver — he has averaged 1.1 xG per game in that window."

**Paragraph 3 — Historical context (1–2 sentences)**
Cite one specific historical fact retrieved from the Qdrant RAG layer. The sentence must reference a specific match, date, or season to prove it is a real retrieved fact rather than a generalization. If no high-confidence historical context was found, this paragraph is replaced with a single honest sentence: "There is limited historical data for this specific matchup, so this prediction is based primarily on recent form."

**Paragraph 4 — Tactical angle (1–2 sentences)**
Incorporate one insight from the Tactical Analysis module. This connects the player or team prediction to the spatial and positional context. For a performance question, this means noting how the opponent's tactical vulnerability aligns with the player's strengths. For an injury question, this means noting whether the upcoming fixture's high-intensity demands amplify the risk.

**Paragraph 5 — Closing signal (1 sentence)**
End with a single directional signal — a clear, opinionated conclusion. This is the summary a manager or analyst would write at the bottom of a scouting report. It should be actionable.

Examples:
- "Start him — the conditions favour a breakout performance."
- "Rotation is recommended; the risk of a hamstring injury outweighs the benefit of 90 minutes."
- "Exploit the left half-space aggressively in the first 20 minutes before they adjust."

### Tone rules

The AI must write in second person when addressing the user's team or tactical situation ("your team should exploit...") and in third person when describing a player or opponent. Sentences must be declarative, not hedged. Avoid "may", "might", "could possibly", and "it is possible that". Use "will", "is", and "shows".

### Length rules

The total response must be between 120 and 180 words. No longer. The AI Copilot sidebar is narrow and users read it quickly. A response that exceeds 180 words will feel overwhelming in the UI. A response under 100 words will feel incomplete.

### What the AI must never do

The AI must never mention the names of the ML models (XGBoost, K-Means, SHAP). Those are implementation details. It must never quote raw numbers from SHAP without translating them. It must never say "I don't have access to that information" — if data is missing, it uses the fallback paragraph from Paragraph 3 above. It must never ask clarifying questions mid-response. It must never use bullet points or headers in its output — the response is always flowing prose.

### Response variations by question type

**For performance questions** ("How will X perform?"): Lead Paragraph 1 with the xG prediction. Paragraph 2 covers the top SHAP drivers. Paragraph 3 cites a historical performance comparison. Paragraph 4 connects to the opponent's tactical vulnerability. Paragraph 5 gives a fantasy/selection signal.

**For injury questions** ("Is X fit?" / "Is X at risk?"): Lead Paragraph 1 with the risk classification and probability. Paragraph 2 covers the top workload factors (ACWR, matches played, days rest). Paragraph 3 cites a relevant historical injury pattern if one exists. Paragraph 4 notes the intensity demands of the upcoming fixture. Paragraph 5 gives a rotation/selection recommendation.

**For tactical questions** ("What is X's weakness?" / "How does X play?"): Lead Paragraph 1 with the formation and primary vulnerability zone. Paragraph 2 covers the top 2 vulnerability zones with their concession probabilities. Paragraph 3 cites a historical match where this vulnerability was exploited. Paragraph 4 connects to which player in your squad can exploit it. Paragraph 5 gives a specific tactical instruction.

**For general questions** ("Who should I watch tonight?" / "What is the key battle?"): The Orchestrator runs all four modules and the AI synthesises across all of them to give a holistic match preview. All five paragraphs apply but each draws from a different module.

---

## 7. Page Layouts & Chart Specifications

### Global layout reminder

Every page inside the dashboard uses the same 3-panel shell: the fixed left navigation sidebar, the scrollable centre viewport, and the fixed right AI Copilot sidebar. The specifications below describe only what goes in the centre viewport of each page.

---

### Page A — Command Center (Dashboard Hub)

**Purpose:** Entry point and system health overview.

**Layout structure:** A 2×2 grid of module cards, each occupying one quadrant of the centre panel. Below the grid, a single status bar runs the full width.

**Module card contents (each of the 4 cards):**
Each card displays the module name, a one-line description, an icon, an ONLINE / OFFLINE status dot that reflects whether the backend model is loaded and responsive, and a clickable area that navigates to that module's page.

**Status bar (below the grid):**
A horizontal bar showing four live system metrics: Qdrant DB connection status, XGBoost models loaded status, last data refresh timestamp, and current API response latency in milliseconds. This bar updates every 30 seconds via a health check ping to the backend.

**No charts on this page.** It is a navigation hub, not an analysis page.

---

### Page B — Live Match Center

**Purpose:** Real-time match telemetry during a live game.

**Layout structure:** Two columns in the centre panel. The left column takes 60% of the width and contains the live commentary feed. The right column takes 40% and contains the live metric widgets.

**Left column — Live commentary feed:**
A scrolling text area that displays timestamped AI-generated commentary events as they arrive. Each event has a match clock timestamp, a brief description of what happened, and a colour-coded category tag (Goal, Chance, Press, Defensive Action). New events appear at the bottom and the feed scrolls automatically.

**Right column — Live metric widgets:**

Widget 1 — Momentum bar: A single horizontal bar chart showing home team pressure vs away team pressure as opposing coloured fills from the centre. The bar updates every 30 seconds. This is not a time-series — it is a single snapshot bar showing the current momentum balance.

Widget 2 — xG Accumulator: A single large number showing the cumulative xG generated by the home team in this match. Below it, in smaller text, the away team's xG for comparison. This is a static number that updates, not a chart.

Widget 3 — Pass Completion tracker: A single percentage number showing the home team's pass completion rate in the current match. A thin progress arc around the number shows how this compares to their season average. If the current match completion is above the season average, the arc glows green. If below, it glows red.

Widget 4 — Match clock: A large digital timer in the top centre of the right column, counting up from 0:00. It shows the live minute and seconds.

**Chart type used on this page:** Horizontal progress bar (momentum), large numeric displays (xG, pass completion), digital counter (match clock). No complex charts — this page is about instant readability.

---

### Page C — Performance Predictor

**Purpose:** Display the XGBoost regression output for a selected player in an upcoming match.

**Layout structure:** Three zones stacked vertically in the centre panel.

**Zone 1 — AI Insight banner (top, full width):**
A single highlighted card at the top of the page. Contains a sparkle icon and one sentence of AI-generated insight derived from the SHAP output. This sentence is not the full AI Copilot response — it is a one-line headline pulled from Paragraph 2 of the AI response and displayed prominently at the top of the page. Example: "Player overperforms positional average in Progressive Runs and Key Passes, indicating elite playmaking form."

**Zone 2 — Predicted Impact panel (left, 40% width) + Form Timeline chart (right, 60% width):**
These two elements sit side by side in the middle zone.

The Predicted Impact panel on the left shows two key predicted metrics: Expected Goals (xG) as a large numeric display with a concentric target ring chart behind it (filled proportionally to the predicted value out of a maximum of 3.0 xG), and Key Passes as a secondary numeric display below it.

The Form Timeline chart on the right is a dual-axis line chart showing the player's actual xG performance over their last 5 matches plus the predicted value for the upcoming match as a dashed line extension. The solid line shows historical actuals. The dashed line shows the future prediction. The x-axis shows opponent names (abbreviated). The left y-axis shows xG values (0 to 2.0). The right y-axis shows Key Passes (0 to 5). Both metrics are plotted on the same chart as separate lines in different colours.

**Chart type for Form Timeline:** Recharts ComposedChart with Line for xG (solid), Line for Key Passes (solid), and a reference line or dashed Line for the prediction extension.

**Zone 3 — Profile Analysis radar (bottom, full width):**
A radar (spider) chart comparing the player's per-90 metrics against the positional average for their role. The chart has 6 axes: xG, xA, Key Passes, Progressive Runs, Dribbles, and Shots. Two overlapping polygons are drawn — one for the player (filled, brighter colour) and one for the positional average (outlined, muted colour). This answers "is this player above or below average on each dimension?"

**Chart type for Profile Analysis:** Recharts RadarChart with two datasets overlaid.

---

### Page D — Injury Risk Analyzer

**Purpose:** Display the XGBoost classifier output and workload history for a selected player.

**Layout structure:** Three zones in the centre panel — one banner at the top, then two columns below.

**Zone 1 — AI Risk Assessment banner (top, full width):**
Same format as the Performance page's AI Insight banner but with a warning icon instead. Displays one sentence summarising the risk level. Example: "Player is pushing the 85% danger threshold due to fixture congestion. Rest recommended."

**Zone 2 — Left column (40% width):**
Two stacked widgets occupy the left column.

Widget A — Current Assessment panel: A text panel showing the three SHAP-derived risk factor explanations in plain English. Each factor is listed as a short statement with a coloured severity indicator dot. This is where the Paragraph 2 content from the AI response is displayed in structured form for easy scanning.

Widget B — Risk Probability gauge: A large semicircular arc gauge showing the risk probability as a percentage from 0% to 100%. The arc fills from left to right. The colour of the filled arc transitions from green (0–40%), to amber (40–70%), to red (70–100%) depending on the current value. The percentage number is displayed large in the centre of the arc.

**Zone 3 — Right column (60% width):**
Two stacked charts occupy the right column.

Chart A — 30-Day Physical Workload Tracker: A line chart showing the player's daily workload intensity over the last 30 days. The x-axis shows dates. The y-axis shows a workload intensity score (a composite of minutes played, sprint distance, and high-intensity actions, normalised to 0–100). A horizontal dashed reference line is drawn at the 85 intensity level to mark the overload threshold. When the line crosses above this reference, the area under it is shaded red. When below, it is shaded amber or green depending on how close it is to the threshold.

**Chart type for Workload Tracker:** Recharts AreaChart with a reference line (ReferenceLine component) at the danger threshold.

Chart B — Squad Risk Clustering scatter plot: A scatter plot where each dot represents one player from the squad. The x-axis shows player age. The y-axis shows cumulative minutes played this season. Each dot is coloured by their current risk classification: green for Low, amber for Medium, red for High. This gives the coaching staff an at-a-glance view of which players across the entire squad are in the danger zone simultaneously. The currently selected player's dot is larger and outlined.

**Chart type for Squad Clustering:** Recharts ScatterChart with colour-coded dots.

---

### Page E — Tactical Analysis

**Purpose:** Display the K-Means formation detection and zone vulnerability analysis for a selected opponent team.

**Layout structure:** Three zones in the centre panel — one banner at the top, then two columns below.

**Zone 1 — Tactical Vulnerability banner (top, full width):**
Same banner format as other pages. Displays the AI-generated one-line tactical summary. Example: "Opponent plays an extremely high line but leaves the central box (Zone 14) highly vulnerable to through balls."

**Zone 2 — Left column (40% width):**
One chart occupies the left column.

Chart A — Pitch Formation Map: A top-down view of a football pitch rendered as an SVG or canvas element. The pitch has standard markings (centre circle, penalty areas, halfway line). On top of the pitch, 10 coloured dots are plotted at the K-Means cluster centroid coordinates — these represent the average defensive positions of each outfield player. The dots are grouped and colour-coded by their detected line (defenders in one colour, midfielders in another, forwards in a third). No player names are shown — the positions speak for themselves. Below the pitch, the detected formation string (e.g., "4-3-3") is displayed in large text.

**Chart type:** Custom SVG pitch with coordinate-mapped dots. Not a standard Recharts chart.

**Zone 3 — Right column (60% width):**
Two stacked charts occupy the right column.

Chart B — Team Tactical Fingerprint radar: A pentagon radar chart showing the team's scores on 5 tactical dimensions: High Press, Compactness, Counter Attack, Direct Play, Width. Each axis goes from 0 to 100. A single filled polygon shows the team's current tactical profile. This answers "what kind of team are they?" at a glance.

**Chart type:** Recharts RadarChart with a single dataset.

Chart C — Concession Probability by Zone bar chart: A horizontal bar chart with 6 bars, one per pitch zone (Zone 14, Half-Space L, Half-Space R, Box Centre, Wide Left, Wide Right). The bar length shows the percentage of chances conceded from that zone. Bars are colour-coded: red for zones above 50% probability, amber for 25–50%, green for below 25%. The longest bar is the primary exploitation recommendation.

**Chart type:** Recharts BarChart with horizontal layout and colour-coded fills.

---

### Page F — System Manual

**Purpose:** Tutorial and documentation page explaining how to use the platform.

**Layout structure:** A single scrollable column with no charts. Sections are separated by styled dividers. Content is written in the cyberpunk aesthetic but remains readable.

**Sections:**
Section 1 — AI Co-Pilot Interaction Guide: Explains the 3 types of questions the AI handles, with example prompts and what to expect in the response.

Section 2 — Module & Chart Explanations: One card per module (4 cards in a 2×2 grid), explaining in plain language what each module does, what data it uses, and how to read its charts.

Section 3 — Data Sources: A table listing the 4 data sources, what they provide, and how frequently they refresh.

Section 4 — Prompt Tips: A list of example queries organised by category (player performance, injury risk, tactical, general match preview) to help users get the best responses from the AI.

**No charts on this page.** Documentation only.

---

## 8. Data Contract — What Each Module Returns

This section defines exactly what JSON structure each module must return to the Orchestrator. The frontend depends on these structures to render its charts correctly. Any change to these structures must be reflected in both the backend module and the frontend rendering component.

### Module 1 — Performance Prediction returns:

- `predicted_xg` — a decimal number between 0.0 and 3.0
- `predicted_xa` — a decimal number between 0.0 and 2.0
- `confidence_score` — a decimal between 0.0 and 1.0
- `shap_drivers` — a list of 5 objects, each containing a `feature_label` (human-readable string) and an `impact_value` (signed decimal, positive = boosted prediction, negative = suppressed prediction)
- `form_timeline` — a list of 6 objects (5 historical + 1 predicted), each containing `opponent_abbr`, `actual_xg`, `actual_key_passes`, and `is_prediction` (boolean)
- `profile_radar` — an object with 6 keys: `xg`, `xa`, `key_passes`, `progressive_runs`, `dribbles`, `shots` — each containing `player_value` and `positional_average`

### Module 2 — Injury Risk Prediction returns:

- `risk_level` — a string: "LOW", "MEDIUM", or "HIGH"
- `risk_score` — a decimal between 0.0 and 1.0
- `acwr` — a decimal representing the Acute:Chronic Workload Ratio
- `shap_explanations` — a list of 3 plain-English strings describing the top risk factors
- `recommendation` — a single string: the rest or selection recommendation
- `workload_timeline` — a list of 30 objects (one per day), each containing `date` and `intensity_score` (0–100)
- `squad_scatter` — a list of objects (one per player), each containing `player_name`, `age`, `cumulative_minutes`, and `risk_level`

### Module 3 — Tactical Analysis returns:

- `formation_detected` — a string (e.g., "4-3-3" or "4-4-2")
- `zone_vulnerabilities` — an object with 6 keys (Zone14, HalfSpaceL, HalfSpaceR, BoxCentre, WideLeft, WideRight) each containing a `probability` (0–100) value
- `tactical_fingerprint` — an object with 5 keys (HighPress, Compactness, CounterAttack, DirectPlay, Width) each containing a score (0–100)
- `vulnerability_summary` — a plain-English string (1–2 sentences)
- `formation_centroids` — a list of 10 objects each containing `x`, `y`, and `line` (defender/midfielder/forward) for pitch rendering
- `concession_events` — a list of raw event coordinates for optional heatmap overlay

### Module 4 — RAG Commentary returns:

- `context_chunks` — a list of up to 3 plain-English strings (the retrieved historical facts)
- `similarity_scores` — a list of up to 3 decimal values (the cosine similarity of each chunk)
- `low_confidence_flag` — a boolean indicating whether the retrieved context met the 0.6 threshold
- `collections_searched` — a list of strings indicating which Qdrant collections were queried

### The Orchestrator's final response to the frontend returns:

- `analysis` — the full LLM narrative text (120–180 words)
- `ai_insight_headline` — a single sentence extracted from the narrative for the page banner
- `performance` — the full Module 1 output object
- `injury` — the full Module 2 output object
- `tactical` — the full Module 3 output object
- `rag_metadata` — the Module 4 output object (context and flags only, not the raw chunks)
- `processing_time_ms` — total time from request to response in milliseconds
- `data_sources_used` — a list of strings naming which data sources contributed to this response

---

## 9. Error States & Fallback Behaviour

Every page and every chart must have a defined behaviour for when data is unavailable. "No data loaded" as text in a blank chart area is the minimum — it is already implemented. The goal is to make the error state as informative as the data state.

### Module-level fallbacks

If Module 1 fails or returns no data, the Performance page shows the form timeline with all values as zero, the SHAP chart as empty with the label "Awaiting analysis data", and the profile radar with only the positional average polygon (no player polygon). The AI Copilot replaces its performance paragraph with: "Performance prediction data is currently unavailable for this player. Historical context is still available."

If Module 2 fails, the workload timeline shows a flatline at zero, the risk gauge shows "--%" with a grey arc, and the squad scatter shows only the average squad positions without individual dots. The AI replaces its injury paragraph with the player's last known risk status with a timestamp.

If Module 3 fails, the pitch formation map shows an empty pitch with the label "Formation data unavailable", the radar shows five equal axes at 50, and the zone bar chart shows all bars at equal height. The AI replaces its tactical paragraph with a generic note about the opponent's publicly known preferred formation.

If Module 4 fails or returns low-confidence context, the AI replaces Paragraph 3 with: "Limited historical data is available for this specific matchup — this analysis relies primarily on current-season form."

### Player not found

If the player name in the query cannot be resolved to a player ID in the database, the Orchestrator returns a specific error type. The AI Copilot responds with: "SportsMind does not have data for [player name] in the current dataset. The platform covers [list of available leagues]. Please check the player name or select from the quick prompt suggestions."

### No live match

When the Live Match Center is open but no match is currently being tracked, all widgets show their zero-state: the momentum bar is centred at 50/50, the xG accumulator shows 0.00 vs 0.00, the pass completion shows "--", and the match clock shows "WAITING FOR KICKOFF..." The commentary feed shows the most recent completed match's events as a historical replay with a clear "PREVIOUS MATCH" label.

---

*End of Pipeline & Layout Specification.*
*This document is the implementation reference for all four ML modules, the Master Orchestrator, the AI output format, and the frontend chart requirements.*
*Read alongside: `sportsmind.md` (architecture and build plan) and `comprehensive_documentation.md` (existing implementation details).*
