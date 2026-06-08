-- ============================================================
-- EM_TMW Team Planner — Supabase 스키마 / RLS / 트리거
-- Supabase 대시보드 → SQL Editor 에 전체 붙여넣고 RUN 하세요.
-- (한 번만 실행. 재실행해도 안전하도록 IF NOT EXISTS / OR REPLACE 사용)
-- ============================================================

-- ------------------------------------------------------------
-- 1. profiles : auth.users 와 1:1 (이메일/비밀번호는 auth가 관리)
-- ------------------------------------------------------------
create table if not exists public.profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    name       text not null default '',
    role       text not null default 'member',   -- 'admin' | 'member'
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. planners : 플래너 1건 = 1행. 자식 항목은 JSONB로 통합
--    brain_dumps : [{ "seq":1, "content":"..." }, ...]            (15개)
--    big3_tasks  : [{ "seq":1, "task":"...", "detail_goal":"...", "is_done":false }, ...] (3개)
--    time_blocks : [{ "time_slot":"07:30-08:00", "task":"...", "is_done":false }, ...]    (22개)
-- ------------------------------------------------------------
create table if not exists public.planners (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    date        date not null,
    one_win     text,
    tomorrow_1  text,
    brain_dumps jsonb not null default '[]'::jsonb,
    big3_tasks  jsonb not null default '[]'::jsonb,
    time_blocks jsonb not null default '[]'::jsonb,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (user_id, date)   -- upsert 키
);

create index if not exists idx_planners_user_date on public.planners (user_id, date);

-- ------------------------------------------------------------
-- 3. is_admin() : 현재 로그인 사용자가 관리자인지.
--    SECURITY DEFINER 로 RLS를 우회해 profiles를 읽어 무한 재귀 방지.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
    );
$$;

-- ------------------------------------------------------------
-- 4. RLS 활성화
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.planners enable row level security;

-- ----- profiles 정책 -----
-- 읽기: 본인 또는 관리자(팀원 목록/이름 표시용)
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
    for select using ( id = auth.uid() or public.is_admin() );

-- 수정: 본인만. role 자가변경 방지는 트리거(아래 5번)로 보강.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update using ( id = auth.uid() ) with check ( id = auth.uid() );

-- ----- planners 정책 -----
-- 읽기: 본인 것 또는 관리자는 전체
drop policy if exists "planners_select" on public.planners;
create policy "planners_select" on public.planners
    for select using ( user_id = auth.uid() or public.is_admin() );

-- 쓰기(insert/update/delete): 본인 것만. 관리자도 팀원 플래너는 읽기 전용.
drop policy if exists "planners_insert_own" on public.planners;
create policy "planners_insert_own" on public.planners
    for insert with check ( user_id = auth.uid() );

drop policy if exists "planners_update_own" on public.planners;
create policy "planners_update_own" on public.planners
    for update using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );

drop policy if exists "planners_delete_own" on public.planners;
create policy "planners_delete_own" on public.planners
    for delete using ( user_id = auth.uid() );

-- ------------------------------------------------------------
-- 5. role 자가변경 방지 트리거
--    일반 사용자가 본인 profile을 수정할 때 role을 바꾸지 못하게 한다.
--    (관리자 권한 상승 공격 차단. role 변경은 SQL Editor에서 직접만 가능)
-- ------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.role is distinct from old.role and not public.is_admin() then
        new.role := old.role;   -- 변경 무시
    end if;
    return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
    before update on public.profiles
    for each row execute function public.prevent_role_change();

-- ------------------------------------------------------------
-- 6. 신규 가입 시 profiles 자동 생성 트리거
--    Auth 대시보드에서 사용자를 추가하면 profiles 행이 자동 생성된다.
--    name 은 user metadata의 name → 없으면 이메일 앞부분.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, role)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
        'member'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================
-- 7. 관리자 지정 (사용자 추가 후 1회 실행)
--    아래 이메일을 관리자 계정 이메일로 바꿔 실행하세요.
-- ============================================================
-- update public.profiles set role = 'admin'
-- where id = (select id from auth.users where email = 'admin@example.com');

-- 이름을 한 번에 정리하고 싶다면 (예시):
-- update public.profiles set name = '홍길동'
-- where id = (select id from auth.users where email = 'member1@example.com');
