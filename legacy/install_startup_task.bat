@echo off
chcp 65001 > nul
cd /d %~dp0

set TASK_NAME=DEEPNOID Team Planner Server
set START_SCRIPT=%~dp0start.bat

schtasks /Create /TN "%TASK_NAME%" /TR "\"%START_SCRIPT%\"" /SC ONLOGON /RL LIMITED /F
if errorlevel 1 (
    echo 자동 시작 작업 등록에 실패했습니다.
    pause
    exit /b 1
)

echo 자동 시작 작업 등록 완료: %TASK_NAME%
pause
