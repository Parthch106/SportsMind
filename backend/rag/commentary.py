"""
rag/commentary.py
------------------
Unified LLM synthesis layer. Assembles the outputs of all four modules
into a single prompt and calls the OpenAI GPT-5 API (via GitHub Models)
to produce a coherent natural language analysis.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from openai import OpenAI

from rag.retrieve import retrieve_all_context

logger = logging.getLogger(__name__)

# GitHub Models endpoint — swap for api.openai.com if using a direct key
GITHUB_MODELS_BASE_URL = "https://models.inference.ai.azure.com"
GPT5_MODEL = "gpt-4o"
MAX_TOKENS = 600

SYSTEM_PROMPT = """You are SportsMind, an elite football analyst. You synthesise ML model outputs, SHAP feature explanations, and historical context into concise, expert-level football analysis.

CRITICAL RULES:
- If the "Player" field in the data below is EXACTLY "Unknown Player" AND the user is asking about a specific player, your ENTIRE response must be exactly one sentence: "I'm sorry, but that player is not present in the SportsMind database." Ignore the 5-paragraph rule in this case.
- However, if the user's query is about a TEAM or a TACTICAL setup (e.g. "Arsenal", "Real Madrid", "tactics"), do NOT refuse! Even if the Player field says "Unknown Player", you must provide the full tactical analysis for the team.
- Otherwise, your response MUST be structured using Markdown. Use `###` for section headers, `**` for bolding key metrics, and bullet points where appropriate to make the analysis highly readable.
- Include the following sections:
  ### The Verdict
  Lead with the most important number or conclusion (xG, injury risk, or formation vulnerability) in 1-2 sentences.
  ### The Evidence
  Use bullet points to explain the top 2-3 SHAP drivers in plain English without jargon.
  ### Historical Context
  Cite one specific historical fact from the retrieved context. If no strong context exists, state: "There is limited historical data for this specific matchup, so this prediction is based primarily on recent form."
  ### Tactical Angle
  Connect the prediction to the spatial or positional context (e.g., how opponent vulnerability aligns with player strengths).
  ### Recommendation
  End with a single directional, actionable conclusion (e.g., "**Start him**" or "**Rotation recommended**").

TONE:
- Use second person ("your team") or third person ("he/they").
- Be declarative ("will", "is", "shows"). NO hedging ("may", "could").
- Never mention "XGBoost", "K-Means", "SHAP", or the AI models.
- Maximum 150-180 words."""


def get_ai_insight_headline(analysis: str) -> str:
    """Extract a single sentence from Paragraph 2 (The Evidence) to use as the page banner."""
    paragraphs = [p for p in analysis.split('\n') if p.strip()]
    if len(paragraphs) >= 2:
        sentences = paragraphs[1].split('. ')
        if sentences:
            return sentences[0].strip() + ('.' if not sentences[0].endswith('.') else '')
    return "AI insights have been calculated based on the latest performance data."


def _get_client() -> OpenAI:
    """
    Returns an OpenAI client pointed at GitHub Models.
    Set GITHUB_TOKEN to your GitHub personal access token (with Models access).
    Alternatively, set OPENAI_API_KEY to use the standard OpenAI endpoint.
    """
    github_token = os.getenv("GITHUB_TOKEN")
    openai_key = os.getenv("OPENAI_API_KEY")

    if github_token:
        # GitHub Models endpoint (GPT-5 access via GitHub)
        return OpenAI(
            base_url=GITHUB_MODELS_BASE_URL,
            api_key=github_token,
            max_retries=0,
        )
    elif openai_key:
        # Direct OpenAI endpoint
        return OpenAI(api_key=openai_key, max_retries=0)
    else:
        raise EnvironmentError(
            "No LLM API key found. Set either GITHUB_TOKEN (for GitHub Models / GPT-5) "
            "or OPENAI_API_KEY in your .env file."
        )


def _format_context(context: dict[str, list[str]]) -> str:
    parts = []
    for source, chunks in context.items():
        if chunks:
            parts.append(f"[{source.replace('_', ' ').title()}]\n" + "\n".join(f"• {c}" for c in chunks))
    return "\n\n".join(parts) if parts else "No historical context available."


def generate_commentary(
    query: str,
    performance_data: dict[str, Any],
    injury_data: dict[str, Any],
    tactical_data: dict[str, Any],
    player_name: str = "",
) -> tuple[str, str, dict[str, Any]]:
    """
    Generate a unified natural language analysis from all four module outputs.

    Returns:
        tuple containing (analysis_text, ai_insight_headline, rag_metadata)
    """
    # Retrieve historical context from Qdrant
    context = retrieve_all_context(query, player_name=player_name)
    rag_context = _format_context(context)
    
    rag_metadata = {
        "context_chunks": [c for chunks in context.values() for c in chunks],
        "similarity_scores": [0.85] * sum(len(chunks) for chunks in context.values()),  # Mocked scores
        "low_confidence_flag": not bool(context),
        "collections_searched": list(context.keys())
    }

    # Format SHAP drivers
    shap_text = "\n".join(
        f"  • {d['feature']}: {d['impact']}"
        for d in performance_data.get("shap_top_drivers", [])
    )
    injury_text = "\n".join(
        f"  • {e['feature']}: {e['value']} — {e['impact']}"
        for e in injury_data.get("shap_explanation", [])
    )

    player_name_str = performance_data.get("player") or "Unknown Player"
    position_str = performance_data.get("position") or "Unknown"

    user_prompt = f"""QUERY: {query}

PERFORMANCE PREDICTION:
  Player: {player_name_str}
  Position: {position_str}
  Predicted xG: {performance_data.get("predicted_xg", 0)}
  Predicted Key Passes: {performance_data.get("predicted_key_passes", 0)}
  Confidence: {performance_data.get("confidence", 0):.0%}
  Top SHAP Drivers:
{shap_text}

INJURY RISK:
  Risk Level: {injury_data.get("risk_level", "UNKNOWN")}
  Risk Score: {injury_data.get("risk_score", 0):.0%}
  Recommendation: {injury_data.get("recommendation", "")}
  Factors:
{injury_text}

TACTICAL ANALYSIS:
  Team: {tactical_data.get("team", "")}
  Formation: {tactical_data.get("formation_detected", "Unknown")}
  Top Vulnerability: {tactical_data.get("vulnerability_zones", [{}])[0].get("zone", "N/A") if tactical_data.get("vulnerability_zones") else "N/A"}
  Summary: {tactical_data.get("tactical_summary", "")}

HISTORICAL CONTEXT (retrieved from vector DB):
{rag_context}

Write a concise, expert analysis following EXACTLY the 5-paragraph structure from the system instructions.
CRITICAL: The player's primary position is {performance_data.get("position", "Unknown")}. Tailor your analysis to the expectations of this position (e.g. do not criticize a Center Back for low xG, instead focus on their playmaking, passes, or defensive solidity)."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=GPT5_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
        )
        analysis_text = response.choices[0].message.content or ""
    except Exception as e:
        logger.warning(f"Failed to generate commentary: {e}")
        analysis_text = generate_fallback_commentary(performance_data, injury_data, tactical_data)

    headline = get_ai_insight_headline(analysis_text)
    return analysis_text, headline, rag_metadata


def generate_followup_commentary(
    query: str,
    context_data: dict[str, Any]
) -> str:
    """Generate a conversational response based on existing dashboard context."""
    player_name = context_data.get("player_name", "Unknown Player")
    perf = context_data.get("performance") or {}
    inj = context_data.get("injury") or {}
    tac = context_data.get("tactical") or {}
    
    system_prompt = "You are SportsMind, an elite football analyst AI. You are having a conversation with a user about a dashboard they are viewing. Answer their follow-up question concisely and conversationally. Do not use the 5-paragraph structure here. Just answer directly using the provided context."
    
    user_prompt = f"""FOLLOW-UP QUERY: {query}
    
DASHBOARD CONTEXT:
Player: {player_name}
Position: {context_data.get("position", "Unknown")}
Predicted xG: {perf.get("predicted_xg", "N/A")}
Predicted xA: {perf.get("predicted_xa", "N/A")}
Predicted Key Passes: {perf.get("predicted_key_passes", "N/A")}
Injury Risk Level: {inj.get("risk_level", "N/A")}
Opponent Team: {tac.get("team", "Unknown")}

Please answer the user's query briefly based on the above."""

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=GPT5_MODEL,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        return response.choices[0].message.content or "I couldn't generate a response."
    except Exception as e:
        logger.warning(f"Failed to generate follow-up commentary: {e}")
        return "I'm sorry, I'm having trouble connecting to the AI models right now."


def generate_fallback_commentary(
    performance_data: dict[str, Any],
    injury_data: dict[str, Any],
    tactical_data: dict[str, Any],
) -> str:
    """
    Fallback template-based commentary when Claude API is unavailable.
    Used in development or when the API key is missing.
    """
    player = performance_data.get("player", "The player")
    xg = performance_data.get("predicted_xg", 0)
    kp = performance_data.get("predicted_key_passes", 0)
    risk = injury_data.get("risk_level", "UNKNOWN")
    formation = tactical_data.get("formation_detected", "Unknown")
    top_zone = (
        tactical_data.get("vulnerability_zones", [{}])[0].get("zone", "central areas")
        if tactical_data.get("vulnerability_zones")
        else "central areas"
    )
    shap = performance_data.get("shap_top_drivers", [])
    driver_text = (
        f"  - **Recent form (5-match xG average):** The biggest single driver — he has averaged high xG per game in that window."
    )

    p1 = f"### The Verdict\n{player} is projected to create **{xg:.2f} expected goals** tonight, making him the most dangerous threat in this fixture."
    p2 = f"### The Evidence\n{driver_text}"
    p3 = "### Historical Context\nThere is limited historical data for this specific matchup, so this prediction is based primarily on recent form."
    p4 = f"### Tactical Angle\nThe opponent is playing a **{formation}** and is vulnerable in the **{top_zone}**, which aligns with his preferred operating zones."
    p5 = f"### Recommendation\n**Start him** — the conditions favour a breakout performance."

    return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}\n\n{p5}"
