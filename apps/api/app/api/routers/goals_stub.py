from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(tags=["goals"])

class GoalCreate(BaseModel):
    title: str
    category: str = "supply_center"   # "sourcing" | "fulfillment" | "supply_center"
    metric: str = "cost"              # "cost" | "time" | "custom"
    unit: str = "USD"
    direction: str = "decrease"       # "decrease" | "increase"
    target_amount: float
    baseline_amount: Optional[float] = None
    weight: float = 0.30
    is_active: bool = True

class Goal(GoalCreate):
    id: int
    created_at: datetime
    updated_at: datetime

class GoalProgress(BaseModel):
    goal: Goal
    achieved_amount: float = 0.0
    percent_complete: float = 0.0

_FAKE: List[Goal] = []
_SEQ = 1

@router.get("/goals", response_model=List[Goal])
def list_goals():
    return _FAKE

@router.post("/goals", response_model=Goal)
def create_goal(body: GoalCreate):
    global _SEQ
    g = Goal(id=_SEQ, created_at=datetime.utcnow(), updated_at=datetime.utcnow(), **body.dict())
    _SEQ += 1
    _FAKE.insert(0, g)
    return g

@router.patch("/goals/{goal_id}", response_model=Goal)
def update_goal(goal_id: int, body: GoalCreate):
    for i, g in enumerate(_FAKE):
        if g.id == goal_id:
            data = g.dict()
            data.update({k: v for k, v in body.dict(exclude_unset=True).items()})
            data["updated_at"] = datetime.utcnow()
            _FAKE[i] = Goal(**data)
            return _FAKE[i]
    raise HTTPException(404, "Goal not found")

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int):
    for i, g in enumerate(_FAKE):
        if g.id == goal_id:
            _FAKE.pop(i)
            return {"deleted": True}
    return {"deleted": False}

@router.get("/goals/progress", response_model=List[GoalProgress])
def goals_progress():
    # return 0% progress for all active goals for now
    return [GoalProgress(goal=g) for g in _FAKE if g.is_active]
