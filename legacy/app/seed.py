"""
초기 사용자 데이터 시딩 스크립트
실행: python -m app.seed
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.user import User
from app.models.planner import Planner, BrainDump, Big3Task, TimeBlock  # noqa: F401 (테이블 생성용)

INITIAL_USERS = [
    {"username": "member1", "name": "팀원1", "role": "member", "password": "Change1234!"},
    {"username": "member2", "name": "팀원2", "role": "member", "password": "Change1234!"},
    {"username": "member3", "name": "팀원3", "role": "member", "password": "Change1234!"},
    {"username": "member4", "name": "팀원4", "role": "member", "password": "Change1234!"},
    {"username": "admin",   "name": "관리자",  "role": "admin",  "password": "AdminPass1!"},
]


def seed():
    print("테이블 생성 중...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for u in INITIAL_USERS:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if existing:
                print(f"  이미 존재: {u['username']}")
                continue
            user = User(
                username=u["username"],
                name=u["name"],
                role=u["role"],
                hashed_pw=hash_password(u["password"]),
            )
            db.add(user)
            print(f"  생성: {u['username']} ({u['role']})")
        db.commit()
        print("시딩 완료!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
