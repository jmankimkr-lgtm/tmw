from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response

# 모든 모델을 먼저 임포트해야 SQLAlchemy relationship이 정상 동작
from app.models import user, planner  # noqa: F401
from app.routers import auth, planners, admin

app = FastAPI(title="DEEPNOID Team Planner API", version="1.0.0")

app.include_router(auth.router)
app.include_router(planners.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        if scope.get("path", "").startswith("/api/"):
            raise StarletteHTTPException(status_code=404)

        try:
            response = await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404 and not path.startswith("api/"):
                return await super().get_response("index.html", scope)
            raise

        if response.status_code != 404 or path.startswith("api/"):
            return response
        return await super().get_response("index.html", scope)


# React 정적 파일 서빙. React Router 경로를 새로고침해도 index.html로 복귀한다.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/", SPAStaticFiles(directory=str(DIST), html=True), name="static")
