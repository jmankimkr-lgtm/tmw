@echo off
chcp 65001 > nul
cd /d %~dp0

if not exist data\planner.db (
    echo data\planner.db 파일을 찾을 수 없습니다.
    pause
    exit /b 1
)

if not exist backup mkdir backup

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set TS=%%i

copy /Y data\planner.db backup\planner_%TS%.db > nul
if errorlevel 1 (
    echo 백업에 실패했습니다.
    pause
    exit /b 1
)

echo 백업 완료: backup\planner_%TS%.db
pause
