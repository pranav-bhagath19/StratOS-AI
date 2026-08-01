"""LangGraph analysis graph: planner → researcher → scout → verifier → coordinator."""

from langgraph.graph import END, START, StateGraph

from intelligence.agents.coordinator.agent import run_coordinator
from intelligence.agents.planner.agent import run_planner
from intelligence.agents.researcher.agent import run_researcher
from intelligence.agents.scout.agent import run_scout
from intelligence.agents.base.state import AnalysisState
from intelligence.agents.verifier.agent import run_verifier


def build_graph():
    g = StateGraph(AnalysisState)
    g.add_node("planner", run_planner)
    g.add_node("researcher", run_researcher)
    g.add_node("scout", run_scout)
    g.add_node("verifier", run_verifier)
    g.add_node("coordinator", run_coordinator)
    g.add_edge(START, "planner")
    g.add_edge("planner", "researcher")
    g.add_edge("researcher", "scout")
    g.add_edge("scout", "verifier")
    g.add_edge("verifier", "coordinator")
    g.add_edge("coordinator", END)
    return g.compile()


# Module-level compiled graph — import this in routes/analyses.py
analysis_graph = build_graph()
