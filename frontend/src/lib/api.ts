// lib/api.ts
// Axios client for all SportsMind FastAPI endpoints

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShapDriver {
  feature: string;
  value: number;
  impact: string;
}

export interface FormTimelineEvent {
  opponent_abbr: string;
  actual_xg: number;
  actual_key_passes: number;
  is_prediction: boolean;
}

export interface ProfileRadarStat {
  player_value: number;
  positional_average: number;
}

export interface ProfileRadar {
  xg: ProfileRadarStat;
  xa: ProfileRadarStat;
  key_passes: ProfileRadarStat;
  progressive_runs: ProfileRadarStat;
  dribbles: ProfileRadarStat;
  shots: ProfileRadarStat;
}

export interface RawMatch {
  match_date: string;
  opponent: string;
  xg: number;
  goals: number;
  passes: number;
  progressive_carries: number;
  sprint_distance: number;
  high_intensity: number;
  minutes: number;
  is_home: number;
}

export interface Metric {
  label: string;
  value: string | number;
}

export interface PerformanceData {
  player: string;
  position?: string;
  match_date: string;
  opponent: string;
  predicted_xg: number;
  predicted_xa: number;
  predicted_key_passes: number;
  confidence: number;
  shap_top_drivers: ShapDriver[];
  form_timeline: FormTimelineEvent[];
  profile_radar: ProfileRadar;
  raw_matches?: RawMatch[];
  dynamic_metrics: Metric[];
}

export interface PlayerBio {
  age: number;
  height: string;
  foot: string;
}

export interface InjuryExplanation {
  feature: string;
  value: number;
  impact: string;
}

export interface WorkloadEvent {
  date: string;
  intensity_score: number;
}

export interface SquadScatterPlayer {
  player_name: string;
  age: number;
  cumulative_minutes: number;
  risk_level: string;
}

export interface InjuryData {
  player: string;
  match_date: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_score: number;
  risk_color: string;
  acwr: number;
  shap_explanation: InjuryExplanation[];
  recommendation: string;
  workload_timeline: WorkloadEvent[];
  squad_scatter: SquadScatterPlayer[];
}

export interface VulnerabilityZone {
  zone: string;
  probability: number;
  concession_rate: number;
  goals_conceded: number;
  avg_xg_against: number;
}

export interface TacticalFingerprint {
  HighPress: number;
  Compactness: number;
  CounterAttack: number;
  DirectPlay: number;
  Width: number;
}

export interface FormationCentroid {
  x: number;
  y: number;
  line: string;
}

export interface ConcessionEvent {
  x: number;
  y: number;
}

export interface TacticalData {
  team: string;
  formation_detected: string;
  formation_confidence: number;
  vulnerability_zones: VulnerabilityZone[];
  tactical_fingerprint?: TacticalFingerprint;
  formation_centroids: FormationCentroid[];
  concession_events: ConcessionEvent[];
  heatmap_url: string;
  tactical_summary: string;
  vulnerability_summary: string;
}

export interface RagMetadata {
  context_chunks: string[];
  similarity_scores: number[];
  low_confidence_flag: boolean;
  collections_searched: string[];
}

export interface AnalyseResponse {
  query: string;
  player_name: string;
  position: string;
  player_bio?: PlayerBio;
  performance: PerformanceData | null;
  injury: InjuryData | null;
  tactical: TacticalData | null;
  analysis: string;
  ai_insight_headline: string;
  rag_metadata: RagMetadata | null;
  processing_time_ms: number;
  is_full_analysis: boolean;
  data_sources_used: string[];
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function analyseQuery(
  query: string,
  contextData?: any,
  playerName?: string,
  opponentTeam?: string,
  matchDate?: string,
): Promise<AnalyseResponse> {
  const { data } = await api.post<AnalyseResponse>('/analyse', {
    query,
    player_name: playerName || undefined,
    opponent_team: opponentTeam || undefined,
    match_date: matchDate || undefined,
    context_data: contextData || undefined,
  });
  return data;
}

export async function getPerformance(
  playerId: string,
  matchDate?: string,
  opponent?: string,
): Promise<PerformanceData> {
  const { data } = await api.get<PerformanceData>(
    `/performance/${encodeURIComponent(playerId)}`,
    { params: { match_date: matchDate, opponent } },
  );
  return data;
}

export async function getInjuryRisk(
  playerId: string,
  matchDate?: string,
): Promise<InjuryData> {
  const { data } = await api.get<InjuryData>(
    `/injury/${encodeURIComponent(playerId)}`,
    { params: { match_date: matchDate } },
  );
  return data;
}

export async function getTactical(teamName: string): Promise<TacticalData> {
  const { data } = await api.get<TacticalData>(
    `/tactical/${encodeURIComponent(teamName)}`,
  );
  return data;
}

export async function checkHealth(): Promise<{
  status: string;
  models_loaded: Record<string, boolean>;
}> {
  const { data } = await api.get('/health');
  return data;
}
