from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class BrainDumpItem(BaseModel):
    seq: int
    content: Optional[str] = None


class Big3TaskItem(BaseModel):
    seq: int
    task: Optional[str] = None
    detail_goal: Optional[str] = None
    is_done: bool = False


class TimeBlockItem(BaseModel):
    time_slot: str
    task: Optional[str] = None
    is_done: bool = False


class PlannerUpsert(BaseModel):
    date: date
    one_win: Optional[str] = None
    tomorrow_1: Optional[str] = None
    brain_dumps: List[BrainDumpItem] = []
    big3_tasks: List[Big3TaskItem] = []
    time_blocks: List[TimeBlockItem] = []


class PlannerResponse(PlannerUpsert):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class PlannerSummary(BaseModel):
    date: date
    big3_done: int
    big3_total: int
    one_win: Optional[str] = None

    model_config = {"from_attributes": True}
