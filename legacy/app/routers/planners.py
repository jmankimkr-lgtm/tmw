from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.planner import Big3Task, BrainDump, Planner, TimeBlock
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.planner import PlannerResponse, PlannerSummary, PlannerUpsert

router = APIRouter(prefix="/api/planners", tags=["planners"])

TIME_SLOTS = [
    "07:30-08:00", "08:00-08:30", "08:30-09:00", "09:00-09:30",
    "09:30-10:00", "10:00-10:30", "10:30-11:00", "11:00-11:30",
    "11:30-12:00", "12:00-12:30", "12:30-13:00", "13:00-13:30",
    "13:30-14:00", "14:00-14:30", "14:30-15:00", "15:00-15:30",
    "15:30-16:00", "16:00-16:30", "16:30-17:00", "17:00-17:30",
    "17:30-18:00", "18:00 이후",
]


def _empty_response(user_id: int, target_date: date) -> dict:
    return {
        "id": 0,
        "user_id": user_id,
        "date": target_date,
        "one_win": None,
        "tomorrow_1": None,
        "brain_dumps": [{"seq": i, "content": None} for i in range(1, 16)],
        "big3_tasks": [
            {"seq": i, "task": None, "detail_goal": None, "is_done": False}
            for i in range(1, 4)
        ],
        "time_blocks": [
            {"time_slot": s, "task": None, "is_done": False} for s in TIME_SLOTS
        ],
    }


def _to_response(planner: Planner) -> dict:
    brain_map = {b.seq: b.content for b in planner.brain_dumps}
    big3_map = {b.seq: b for b in planner.big3_tasks}
    block_map = {b.time_slot: b for b in planner.time_blocks}

    return {
        "id": planner.id,
        "user_id": planner.user_id,
        "date": planner.date,
        "one_win": planner.one_win,
        "tomorrow_1": planner.tomorrow_1,
        "brain_dumps": [
            {"seq": i, "content": brain_map.get(i)} for i in range(1, 16)
        ],
        "big3_tasks": [
            {
                "seq": i,
                "task": big3_map[i].task if i in big3_map else None,
                "detail_goal": big3_map[i].detail_goal if i in big3_map else None,
                "is_done": big3_map[i].is_done if i in big3_map else False,
            }
            for i in range(1, 4)
        ],
        "time_blocks": [
            {
                "time_slot": s,
                "task": block_map[s].task if s in block_map else None,
                "is_done": block_map[s].is_done if s in block_map else False,
            }
            for s in TIME_SLOTS
        ],
    }


@router.get("/today")
def get_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    planner = (
        db.query(Planner)
        .filter(Planner.user_id == current_user.id, Planner.date == today)
        .first()
    )
    if not planner:
        return _empty_response(current_user.id, today)
    return _to_response(planner)


@router.get("")
def get_history(
    start: Optional[str] = None,
    end: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[PlannerSummary]:
    query = db.query(Planner).filter(Planner.user_id == current_user.id)
    if start:
        query = query.filter(Planner.date >= start)
    if end:
        query = query.filter(Planner.date <= end)
    planners = query.order_by(Planner.date.desc()).all()

    result = []
    for p in planners:
        big3 = db.query(Big3Task).filter(Big3Task.planner_id == p.id).all()
        result.append(
            PlannerSummary(
                date=p.date,
                big3_done=sum(1 for t in big3 if t.is_done),
                big3_total=len([t for t in big3 if t.task]),
                one_win=p.one_win,
            )
        )
    return result


@router.get("/{target_date}")
def get_by_date(
    target_date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        d = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="날짜 형식이 올바르지 않습니다")

    planner = (
        db.query(Planner)
        .filter(Planner.user_id == current_user.id, Planner.date == d)
        .first()
    )
    if not planner:
        return _empty_response(current_user.id, d)
    return _to_response(planner)


@router.post("")
def upsert_planner(
    body: PlannerUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    planner = (
        db.query(Planner)
        .filter(Planner.user_id == current_user.id, Planner.date == body.date)
        .first()
    )

    if planner:
        db.query(BrainDump).filter(BrainDump.planner_id == planner.id).delete()
        db.query(Big3Task).filter(Big3Task.planner_id == planner.id).delete()
        db.query(TimeBlock).filter(TimeBlock.planner_id == planner.id).delete()
        planner.one_win = body.one_win
        planner.tomorrow_1 = body.tomorrow_1
        planner.updated_at = datetime.now(timezone.utc)
    else:
        planner = Planner(
            user_id=current_user.id,
            date=body.date,
            one_win=body.one_win,
            tomorrow_1=body.tomorrow_1,
        )
        db.add(planner)
        db.flush()

    for item in body.brain_dumps:
        if item.content:
            db.add(BrainDump(planner_id=planner.id, seq=item.seq, content=item.content))

    for item in body.big3_tasks:
        if item.task:
            db.add(
                Big3Task(
                    planner_id=planner.id,
                    seq=item.seq,
                    task=item.task,
                    detail_goal=item.detail_goal,
                    is_done=item.is_done,
                )
            )

    for item in body.time_blocks:
        if item.task:
            db.add(
                TimeBlock(
                    planner_id=planner.id,
                    time_slot=item.time_slot,
                    task=item.task,
                    is_done=item.is_done,
                )
            )

    db.commit()
    db.refresh(planner)
    return _to_response(planner)
