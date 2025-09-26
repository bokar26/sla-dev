import numpy as np
from sla_ai_components.algorithms.score import cosine_match, rank_candidates

def test_cosine_match_monotonic():
    a = np.array([1,0,0,0], dtype=float)
    b = np.array([1,0,0,0], dtype=float)
    c = np.array([0,1,0,0], dtype=float)
    assert cosine_match(a,b) > cosine_match(a,c)

def test_rank_candidates_prefers_better_match_and_lower_cost():
    cands = [
        {"match": 0.9, "cost": 3.2, "logistics": 0.6, "risk": 0.1},
        {"match": 0.8, "cost": 3.5, "logistics": 0.7, "risk": 0.1},
    ]
    ranked = rank_candidates(cands)
    assert ranked[0]["match"] >= ranked[1]["match"]
    assert ranked[0]["total"] >= ranked[1]["total"]
