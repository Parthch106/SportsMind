"""
api/schemas.py
---------------
Pydantic models for all API request and response schemas.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


# ── Request schemas ───────────────────────────────────────────────────────────

class AnalyseRequest(BaseModel):
    query: str = Field(..., description="Natural language query about a player/match")
    player_name: Optional[str] = Field(None, description="Player name for targeted analysis")
    opponent_team: Optional[str] = Field(None, description="Opponent team name")
    match_date: Optional[str] = Field(None, description="Match date (YYYY-MM-DD)")
    context_data: Optional[dict[str, Any]] = Field(None, description="Current analysis context to support follow-up questions")


# ── Response schemas ──────────────────────────────────────────────────────────

class ShapDriver(BaseModel):
    feature: str
    value: float
    impact: str

class FormTimelineEvent(BaseModel):
    opponent_abbr: str
    actual_xg: float
    actual_key_passes: int
    is_prediction: bool

class ProfileRadarStat(BaseModel):
    player_value: float
    positional_average: float

class ProfileRadar(BaseModel):
    xg: ProfileRadarStat
    xa: ProfileRadarStat
    key_passes: ProfileRadarStat
    progressive_runs: ProfileRadarStat
    dribbles: ProfileRadarStat
    shots: ProfileRadarStat

class RawMatch(BaseModel):
    match_date: str
    opponent: str
    xg: float
    goals: int
    passes: int
    progressive_carries: int
    sprint_distance: float
    high_intensity: int
    minutes: int
    is_home: int

class Metric(BaseModel):
    label: str
    value: Any

class PerformanceResponse(BaseModel):
    player: str
    position: str = "Unknown"
    match_date: str
    opponent: str
    predicted_xg: float
    predicted_xa: float = 0.0
    predicted_key_passes: int
    confidence: float
    shap_top_drivers: list[ShapDriver]
    form_timeline: list[FormTimelineEvent] = Field(default_factory=list)
    profile_radar: Optional[ProfileRadar] = None
    raw_matches: list[RawMatch] = Field(default_factory=list)
    dynamic_metrics: list[Metric] = Field(default_factory=list)

class PlayerBio(BaseModel):
    age: int
    height: str
    foot: str

class InjuryExplanation(BaseModel):
    feature: str
    value: float
    impact: str

class WorkloadEvent(BaseModel):
    date: str
    intensity_score: float

class SquadScatterPlayer(BaseModel):
    player_name: str
    age: float
    cumulative_minutes: float
    risk_level: str

class InjuryResponse(BaseModel):
    player: str
    match_date: str
    risk_level: str          # LOW | MEDIUM | HIGH
    risk_score: float
    risk_color: str          # green | amber | red
    acwr: float = 1.0
    shap_explanation: list[InjuryExplanation]
    recommendation: str
    workload_timeline: list[WorkloadEvent] = Field(default_factory=list)
    squad_scatter: list[SquadScatterPlayer] = Field(default_factory=list)

class VulnerabilityZone(BaseModel):
    zone: str
    probability: float = 0.0
    concession_rate: float
    goals_conceded: int
    avg_xg_against: float

class TacticalFingerprint(BaseModel):
    HighPress: float
    Compactness: float
    CounterAttack: float
    DirectPlay: float
    Width: float

class FormationCentroid(BaseModel):
    x: float
    y: float
    line: str

class ConcessionEvent(BaseModel):
    x: float
    y: float

class TacticalResponse(BaseModel):
    team: str
    formation_detected: str
    formation_confidence: float
    vulnerability_zones: list[VulnerabilityZone]
    tactical_fingerprint: Optional[TacticalFingerprint] = None
    formation_centroids: list[FormationCentroid] = Field(default_factory=list)
    concession_events: list[ConcessionEvent] = Field(default_factory=list)
    heatmap_url: str
    tactical_summary: str
    vulnerability_summary: str = ""

class RagMetadata(BaseModel):
    context_chunks: list[str]
    similarity_scores: list[float]
    low_confidence_flag: bool
    collections_searched: list[str]

class AnalyseResponse(BaseModel):
    query: str
    player_name: str
    position: str = "Unknown"
    player_bio: Optional[PlayerBio] = None
    performance: Optional[PerformanceResponse] = None
    injury: Optional[InjuryResponse] = None
    tactical: Optional[TacticalResponse] = None
    analysis: str              # LLM-generated natural language synthesis
    ai_insight_headline: str = ""
    rag_metadata: Optional[RagMetadata] = None
    processing_time_ms: float
    is_full_analysis: bool = True
    data_sources_used: list[str] = Field(default_factory=list)

class HealthResponse(BaseModel):
    status: str
    version: str
    models_loaded: dict[str, bool]

