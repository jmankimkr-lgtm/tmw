# legacy/ — 더 이상 사용하지 않는 사내 PC용 FastAPI 백엔드

이 폴더는 **이전(사내 PC 단독 호스팅) 버전**의 백엔드입니다.
2026-06-08 기준 서비스는 **GitHub Pages + Supabase** 구조로 이전되었으며,
아래 파일들은 더 이상 실행/배포에 사용되지 않습니다. (롤백 대비 보관)

| 파일 | 옛 역할 |
|------|---------|
| `app/` | FastAPI 서버 (인증·플래너·관리자 API, SQLite ORM) |
| `tests/` | pytest 통합 테스트 |
| `requirements.txt` | Python 의존성 |
| `pytest.ini` | pytest 설정 |
| `start.bat` | 사내 PC 서버 시작 |
| `backup_db.bat` | SQLite 백업 |
| `install_startup_task.bat` | 부팅 시 자동 시작 등록 |

현재 운영 구조는 상위 폴더의 `frontend/`(React) + `supabase/schema.sql`(DB/권한) +
`MIGRATION_SETUP.md`(셋업 가이드)를 참고하세요.
