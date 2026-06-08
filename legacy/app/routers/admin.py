from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.planner import Big3Task, Planner
from app.models.user import User
from app.routers.auth import require_admin
from app.routers.planners import TIME_SLOTS, _empty_response, _to_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


class MemberStatus(BaseModel):
    user_id: int
    name: str
    has_planner: bool
    big3_done: int
    big3_total: int
    one_win: Optional[str] = None


class DashboardResponse(BaseModel):
    date: date
    written_count: int
    total_count: int
    total_big3_done: int
    total_big3_total: int
    members: List[MemberStatus]


class MemberInfo(BaseModel):
    id: int
    username: str
    name: str


@router.get("/members", response_model=List[MemberInfo])
def get_members(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    members = db.query(User).filter(User.role == "member").order_by(User.id).all()
    return [MemberInfo(id=m.id, username=m.username, name=m.name) for m in members]


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    target_date: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    d = date.today()
    if target_date:
        try:
            d = date.fromisoformat(target_date)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="날짜 형식 오류")

    members = db.query(User).filter(User.role == "member").order_by(User.id).all()
    result: List[MemberStatus] = []

    for member in members:
        planner = (
            db.query(Planner)
            .filter(Planner.user_id == member.id, Planner.date == d)
            .first()
        )
        if planner:
            big3 = db.query(Big3Task).filter(Big3Task.planner_id == planner.id).all()
            big3_total = len([t for t in big3 if t.task])
            big3_done = sum(1 for t in big3 if t.task and t.is_done)
            result.append(
                MemberStatus(
                    user_id=member.id,
                    name=member.name,
                    has_planner=True,
                    big3_done=big3_done,
                    big3_total=big3_total,
                    one_win=planner.one_win,
                )
            )
        else:
            result.append(
                MemberStatus(
                    user_id=member.id,
                    name=member.name,
                    has_planner=False,
                    big3_done=0,
                    big3_total=0,
                    one_win=None,
                )
            )

    written = sum(1 for r in result if r.has_planner)
    total_done = sum(r.big3_done for r in result)
    total_total = sum(r.big3_total for r in result)

    return DashboardResponse(
        date=d,
        written_count=written,
        total_count=len(members),
        total_big3_done=total_done,
        total_big3_total=total_total,
        members=result,
    )


@router.get("/planners/{user_id}/{target_date}")
def get_member_planner(
    user_id: int,
    target_date: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(User.id == user_id, User.role == "member").first()
    if not member:
        raise HTTPException(status_code=404, detail="팀원을 찾을 수 없습니다")

    try:
        d = date.fromisoformat(target_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="날짜 형식 오류")

    planner = (
        db.query(Planner)
        .filter(Planner.user_id == user_id, Planner.date == d)
        .first()
    )
    if not planner:
        return _empty_response(user_id, d)
    return _to_response(planner)


@router.get("/history/{user_id}")
def get_member_history(
    user_id: int,
    start: Optional[str] = None,
    end: Optional[str] = None,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(User.id == user_id, User.role == "member").first()
    if not member:
        raise HTTPException(status_code=404, detail="팀원을 찾을 수 없습니다")

    query = db.query(Planner).filter(Planner.user_id == user_id)
    if start:
        query = query.filter(Planner.date >= start)
    if end:
        query = query.filter(Planner.date <= end)
    planners = query.order_by(Planner.date.desc()).all()

    result = []
    for p in planners:
        big3 = db.query(Big3Task).filter(Big3Task.planner_id == p.id).all()
        result.append({
            "date": str(p.date),
            "big3_done": sum(1 for t in big3 if t.task and t.is_done),
            "big3_total": len([t for t in big3 if t.task]),
            "one_win": p.one_win,
        })
    return result
