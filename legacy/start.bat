@echo off
chcp 65001 > nul
cd /d %~dp0

echo ====================================
echo   DEEPNOID Team Planner 서버 시작
echo ====================================

rem 서버 PC의 IP 주소 표시
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%
echo 접속 주소: http://%IP%:8000
echo 종료하려면 이 창을 닫거나 Ctrl+C 를 누르세요.
echo.

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
