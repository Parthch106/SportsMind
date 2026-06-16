import logging
import pandas as pd
from statsbombpy import sb
from typing import Tuple, List

logger = logging.getLogger(__name__)

# La Liga 20/21 and Premier League 15/16
COMPETITIONS = [
    {"comp_id": 11, "season_id": 90, "name": "La Liga 20/21"},
    {"comp_id": 2,  "season_id": 27, "name": "Premier League 15/16"}
]

def classify_flank(y_coord: float) -> str:
    """Classify the flank based on StatsBomb y-coordinate (0-80)."""
    if y_coord < 26.6:
        return "left flank"
    elif y_coord > 53.3:
        return "right flank"
    else:
        return "center"

def generate_rag_data(limit_matches: int = None) -> Tuple[List[str], List[str], List[str]]:
    """
    Fetches raw StatsBomb event data, performs mathematical analysis on tactics,
    and returns natural language sentences for RAG ingestion.
    """
    player_profiles = []
    match_history = []
    tactical_patterns = []

    for comp in COMPETITIONS:
        logger.info(f"Generating data for {comp['name']}...")
        try:
            matches = sb.matches(competition_id=comp["comp_id"], season_id=comp["season_id"])
            matches_to_process = matches.head(limit_matches) if limit_matches else matches
        except Exception as e:
            logger.error(f"Failed to fetch matches for {comp['name']}: {e}")
            continue

        for _, match in matches_to_process.iterrows():
            match_id = match["match_id"]
            home_team = match["home_team"]
            away_team = match["away_team"]
            score = f"{match['home_score']}-{match['away_score']}"
            
            match_history.append(
                f"In the {comp['name']} match between {home_team} and {away_team}, the final score was {score}."
            )

            try:
                events = sb.events(match_id=match_id)
            except Exception as e:
                logger.error(f"Failed to fetch events for match {match_id}: {e}")
                continue

            if events.empty:
                continue

            # 1. Tactical Patterns (Team attacking flanks)
            passes = events[events["type"] == "Pass"].copy()
            if not passes.empty and "location" in passes.columns:
                passes = passes.dropna(subset=["location"])
                passes["y"] = passes["location"].apply(lambda loc: loc[1] if isinstance(loc, list) and len(loc) > 1 else 40)
                passes["flank"] = passes["y"].apply(classify_flank)

                for team in [home_team, away_team]:
                    team_passes = passes[passes["team"] == team]
                    if not team_passes.empty:
                        total = len(team_passes)
                        flank_counts = team_passes["flank"].value_counts()
                        top_flank = flank_counts.idxmax()
                        top_pct = round((flank_counts.max() / total) * 100)
                        
                        tactical_patterns.append(
                            f"During {comp['name']}, {team} heavily favors attacks down the {top_flank}, directing {top_pct}% of their passing play through that zone."
                        )

            # 2. Player Profiles (Top 3 players by passes per match)
            if not passes.empty and "player" in passes.columns:
                player_passes = passes.groupby("player").size().sort_values(ascending=False).head(5)
                for player_name, pass_count in player_passes.items():
                    player_events = passes[passes["player"] == player_name]
                    top_zone = player_events["flank"].value_counts().idxmax()
                    
                    player_profiles.append(
                        f"{player_name} is a high-volume playmaker who predominantly operates in the {top_zone}, registering {pass_count} passes in a single match."
                    )

    # Deduplicate
    return list(set(player_profiles)), list(set(match_history)), list(set(tactical_patterns))

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pp, mh, tp = generate_rag_data()
    print("Player Profiles:", len(pp))
    print("Match History:", len(mh))
    print("Tactical Patterns:", len(tp))
