# 셋업 가이드 — GitHub Pages + Supabase 배포

> EM_TMW 팀 플래너를 **무료 외부 서비스**(GitHub Pages + Supabase)로 올리는 절차입니다.
> 코드는 모두 작성되어 있습니다. 아래는 **직접 클릭/실행하셔야 하는 부분**입니다.
> 막히면 단계 번호를 알려주시면 도와드립니다.

최종 접속 주소: **https://jmankimkr-lgtm.github.io/tmw/**

---

## PART 1. Supabase (DB + 인증)

### 1-1. 프로젝트 생성
1. https://supabase.com 가입/로그인 (GitHub 계정으로 가능)
2. **New project** 클릭
3. 입력:
   - **Name**: `tmw` (자유)
   - **Database Password**: 강력한 비밀번호 (어딘가 저장 — DB 직접 접속용, 평소엔 안 씀)
   - **Region**: `Northeast Asia (Seoul)` ← 한국에서 가장 빠름
4. **Create new project** → 1~2분 대기

### 1-2. 스키마/권한 생성 (SQL 실행)
1. 좌측 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/schema.sql` **전체 내용**을 복사해 붙여넣기
3. 우측 하단 **Run** (Ctrl+Enter) → "Success" 확인
   - 테이블 `profiles`, `planners` + 권한(RLS) + 트리거가 생성됩니다.

### 1-3. 이메일 확인 끄기 (비공식 운영 — 즉시 사용)
1. 좌측 **Authentication** → **Sign In / Providers** (또는 Providers → Email)
2. **Confirm email** 토글을 **OFF**
   - 끄지 않으면 새 계정이 메일 인증 전까지 로그인 불가합니다.

### 1-4. 사용자 5명 추가
1. **Authentication** → **Users** → **Add user** → **Create new user**
2. 각자 **이메일 + 비밀번호**(6자 이상) 입력, **Auto Confirm User** 체크 → **Create user**
3. 팀원 4명 + 관리자 1명, 총 5번 반복
   - 예: `member1@example.com`, `admin@example.com` ...
   - 사용자를 추가하면 `profiles` 행이 **자동 생성**됩니다(이름은 이메일 앞부분으로 초기 설정).

### 1-5. 관리자 지정 + 이름 정리 (SQL)
**SQL Editor** 에서 아래를 실제 이메일/이름으로 바꿔 실행:

```sql
-- 관리자 권한 부여
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');

-- 표시 이름 정리 (원하는 만큼)
update public.profiles set name = '홍길동'
where id = (select id from auth.users where email = 'member1@example.com');
update public.profiles set name = '관리자'
where id = (select id from auth.users where email = 'admin@example.com');
```

> 사용자 본인도 로그인 후 **내 정보 수정**에서 이름/비밀번호를 바꿀 수 있습니다(이메일은 변경 불가).

### 1-6. API 키 복사
1. 좌측 톱니 **Project Settings** → **API**
2. 두 값을 복사해 둡니다:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** 키 → `VITE_SUPABASE_ANON_KEY`
   - ⚠️ `service_role` 키는 절대 사용/노출하지 마세요. (anon 키는 공개돼도 RLS가 보호)

---

## PART 2. 로컬에서 먼저 테스트 (선택, 권장)

1. `frontend/.env.example` 을 복사해 `frontend/.env.local` 생성, 1-6 값 입력:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
2. 터미널:
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. 브라우저에서 안내된 주소(예: http://localhost:5173/tmw/) 접속 → 1-4의 이메일로 로그인 테스트
   - 팀원 계정 → 플래너 작성/저장/이력
   - 관리자 계정 → 대시보드/팀원 상세

---

## PART 3. GitHub Pages 배포

### 3-1. 저장소 생성 & 코드 업로드
1. GitHub에서 새 저장소 생성 — 이름 반드시 **`tmw`**
   (주소가 `https://jmankimkr-lgtm.github.io/tmw/` 가 되려면 저장소명이 `tmw` 여야 함)
2. 이 `em-tmw-app` 폴더 내용을 저장소에 push (기본 브랜치 `main`)
   - `.gitignore` 가 `.env`, `node_modules`, `*.db` 등을 자동 제외합니다.

> 터미널 예시(이미 git이 없다면):
> ```
> cd em-tmw-app
> git init && git add . && git commit -m "Supabase + Pages 이전"
> git branch -M main
> git remote add origin https://github.com/jmankimkr-lgtm/tmw.git
> git push -u origin main
> ```

### 3-2. Secrets 등록 (빌드 시 Supabase 키 주입)
1. 저장소 **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** 2개 등록:
   - `VITE_SUPABASE_URL` = 1-6의 Project URL
   - `VITE_SUPABASE_ANON_KEY` = 1-6의 anon 키

### 3-3. Pages 활성화
1. 저장소 **Settings** → **Pages**
2. **Build and deployment** → **Source** 를 **GitHub Actions** 로 선택

### 3-4. 배포 실행/확인
- 3-1에서 push 했거나 3-2/3-3 설정 후 아무 커밋이나 push 하면, **Actions** 탭에서 `Deploy to GitHub Pages` 워크플로우가 자동 실행됩니다.
- (수동 실행도 가능: Actions → 워크플로우 선택 → Run workflow)
- 녹색 체크가 뜨면 완료 → **https://jmankimkr-lgtm.github.io/tmw/** 접속

---

## PART 4. 운영 메모

- **첫 로그인 후** 각자 *내 정보 수정*에서 비밀번호를 바꾸도록 안내하세요.
- **Supabase 무료 플랜**: 약 1주간 접속이 전혀 없으면 프로젝트가 자동 일시중지될 수 있습니다. 대시보드에서 **Restore** 하면 즉시 복구됩니다(데이터 유지).
- **데이터 백업**: Supabase 대시보드 → Database → Backups, 또는 Table editor에서 CSV export.
- **새 팀원 추가**: PART 1-4 반복 (Auth에서 Add user) → 필요 시 이름/role 조정.
- **권한 원칙**: 팀원은 본인 플래너만 읽기/쓰기, 관리자는 전체 **읽기 전용**. DB(RLS)가 강제하므로 프론트만으로 뚫리지 않습니다.

---

## 문제 해결

| 증상 | 원인/해결 |
|------|----------|
| 화면은 뜨는데 로그인 안 됨 | Secrets(3-2) 미등록 또는 오타 → 재등록 후 재배포 |
| "Invalid login credentials" | 비밀번호 오타, 또는 1-3 Confirm email을 안 껐고 미인증 상태 |
| 로고/화면 깨짐 | 저장소명이 `tmw`가 아님 → `vite.config.ts`의 `base`와 불일치 |
| 관리자 메뉴 안 보임 | 1-5의 role='admin' 미실행 → SQL 재실행 후 재로그인 |
| 팀원이 다른 사람 플래너 보임/수정됨 | 발생 불가(RLS). 발생 시 schema.sql 재실행 필요 |
