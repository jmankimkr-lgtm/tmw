# UAT Checklist

> 사내 PC 방화벽 포트 개방 항목은 이번 Phase 4 범위에서 제외합니다.

## 사전 준비

- [ ] 서버 PC에서 `python -m app.seed` 실행 후 초기 계정 생성 확인
- [ ] `frontend` 폴더에서 `npm.cmd run build` 완료 확인
- [ ] 서버 PC에서 `start.bat` 실행
- [ ] 서버 PC 브라우저에서 `http://localhost:8000` 접속 확인
- [ ] 필요 시 `install_startup_task.bat`로 Windows 로그인 시 자동 시작 등록

## 팀원 계정

- [ ] `member1` 로그인 성공
- [ ] 오늘 플래너 작성 및 저장
- [ ] Brain Dump 15개 입력 영역 확인
- [ ] BIG 3 입력, 완료 체크, 완료율 표시 확인
- [ ] Time Blocking 입력 및 완료 체크 확인
- [ ] 이력 조회에서 저장한 날짜 조회
- [ ] 이력 조회에서 인쇄 미리보기 열기
- [ ] 내 정보 수정에서 이름 변경 후 Navbar 반영 확인

## 관리자 계정

- [ ] `admin` 로그인 성공
- [ ] 관리자 대시보드에서 팀원 작성 현황 확인
- [ ] 미작성 팀원 상태가 미작성으로 표시되는지 확인
- [ ] 팀원별 플래너 상세 조회
- [ ] 관리자 상세 화면에서 인쇄 미리보기 열기

## 백업

- [ ] `backup_db.bat` 실행
- [ ] `backup/planner_YYYYMMDD_HHMMSS.db` 파일 생성 확인
