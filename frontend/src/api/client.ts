import { supabase } from '../lib/supabase'
import { emptyPlanner, todayStr, type PlannerData, type PlannerSummary } from '../types'

// ============================================================
// 공통 타입 (백엔드 응답 대신 Supabase 기반)
// ============================================================
export interface AuthUser {
  id: string                 // auth.users.id (UUID)
  email: string
  name: string
  role: 'admin' | 'member'
}

export interface UpdateMePayload {
  name?: string
  current_password?: string
  new_password?: string
}

export interface MemberInfo {
  id: string
  name: string
}

export interface MemberStatus {
  user_id: string
  name: string
  has_planner: boolean
  big3_done: number
  big3_total: number
  one_win: string | null
}

export interface DashboardData {
  date: string
  written_count: number
  total_count: number
  total_big3_done: number
  total_big3_total: number
  members: MemberStatus[]
}

// ============================================================
// 내부 헬퍼
// ============================================================
type PlannerRow = {
  id: number
  user_id: string
  date: string
  one_win: string | null
  tomorrow_1: string | null
  brain_dumps: PlannerData['brain_dumps'] | null
  big3_tasks: PlannerData['big3_tasks'] | null
  time_blocks: PlannerData['time_blocks'] | null
}

/** DB 행 → PlannerData (누락 항목은 빈 템플릿으로 보강) */
function rowToPlanner(row: PlannerRow): PlannerData {
  const base = emptyPlanner(row.date)
  return {
    ...base,
    id: row.id,
    user_id: row.user_id,
    one_win: row.one_win,
    tomorrow_1: row.tomorrow_1,
    brain_dumps: row.brain_dumps?.length ? row.brain_dumps : base.brain_dumps,
    big3_tasks: row.big3_tasks?.length ? row.big3_tasks : base.big3_tasks,
    time_blocks: row.time_blocks?.length ? row.time_blocks : base.time_blocks,
  }
}

function big3Counts(big3: PlannerData['big3_tasks']): { done: number; total: number } {
  return {
    done: big3.filter((t) => t.is_done && t.task).length,
    total: big3.filter((t) => t.task).length,
  }
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('로그인이 필요합니다')
  return data.user.id
}

async function buildAuthUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  const u = data.user
  if (!u) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', u.id)
    .single()
  return {
    id: u.id,
    email: u.email ?? '',
    name: profile?.name ?? (u.email?.split('@')[0] ?? ''),
    role: (profile?.role as 'admin' | 'member') ?? 'member',
  }
}

// ============================================================
// 인증
// ============================================================
export const authApi = {
  /** 이메일/비밀번호 로그인 → AuthUser */
  signIn: async (email: string, password: string): Promise<AuthUser> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = await buildAuthUser()
    if (!user) throw new Error('사용자 정보를 불러오지 못했습니다')
    return user
  },

  /** 현재 세션의 사용자 (없으면 null) */
  me: () => buildAuthUser(),

  signOut: async (): Promise<void> => {
    await supabase.auth.signOut()
  },

  /** 이름 변경 + (선택) 비밀번호 변경. 현재 비밀번호를 재인증으로 검증 */
  updateMe: async (payload: UpdateMePayload): Promise<AuthUser> => {
    const { data: u } = await supabase.auth.getUser()
    const email = u.user?.email ?? ''

    // 이름 변경
    if (payload.name !== undefined) {
      const { error } = await supabase
        .from('profiles')
        .update({ name: payload.name })
        .eq('id', await currentUserId())
      if (error) throw error
    }

    // 비밀번호 변경: 현재 비밀번호 재인증 후 갱신
    if (payload.new_password) {
      if (!payload.current_password) throw new Error('현재 비밀번호를 입력해 주세요')
      const { error: reauth } = await supabase.auth.signInWithPassword({
        email,
        password: payload.current_password,
      })
      if (reauth) throw new Error('현재 비밀번호가 올바르지 않습니다')
      const { error } = await supabase.auth.updateUser({ password: payload.new_password })
      if (error) throw error
    }

    const user = await buildAuthUser()
    if (!user) throw new Error('사용자 정보를 불러오지 못했습니다')
    return user
  },
}

// ============================================================
// 플래너 (팀원 본인)
// ============================================================
export const plannerApi = {
  getByDate: async (date: string): Promise<PlannerData> => {
    const uid = await currentUserId()
    const { data, error } = await supabase
      .from('planners')
      .select('*')
      .eq('user_id', uid)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data ? rowToPlanner(data as PlannerRow) : emptyPlanner(date)
  },

  getToday: () => plannerApi.getByDate(todayStr()),

  getHistory: async (start?: string, end?: string): Promise<PlannerSummary[]> => {
    const uid = await currentUserId()
    let q = supabase
      .from('planners')
      .select('date, one_win, big3_tasks')
      .eq('user_id', uid)
    if (start) q = q.gte('date', start)
    if (end) q = q.lte('date', end)
    const { data, error } = await q.order('date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((p: any) => {
      const { done, total } = big3Counts(p.big3_tasks ?? [])
      return { date: p.date, big3_done: done, big3_total: total, one_win: p.one_win }
    })
  },

  upsert: async (planner: PlannerData): Promise<PlannerData> => {
    const uid = await currentUserId()
    const row = {
      user_id: uid,
      date: planner.date,
      one_win: planner.one_win,
      tomorrow_1: planner.tomorrow_1,
      brain_dumps: planner.brain_dumps,
      big3_tasks: planner.big3_tasks,
      time_blocks: planner.time_blocks,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('planners')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single()
    if (error) throw error
    return rowToPlanner(data as PlannerRow)
  },
}

// ============================================================
// 관리자
// ============================================================
export const adminApi = {
  getMembers: async (): Promise<MemberInfo[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'member')
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []) as MemberInfo[]
  },

  getDashboard: async (date?: string): Promise<DashboardData> => {
    const target = date ?? todayStr()
    const members = await adminApi.getMembers()

    const { data: planners, error } = await supabase
      .from('planners')
      .select('user_id, one_win, big3_tasks')
      .eq('date', target)
    if (error) throw error

    const byUser = new Map<string, any>()
    for (const p of planners ?? []) byUser.set(p.user_id, p)

    const memberStatuses: MemberStatus[] = members.map((m) => {
      const p = byUser.get(m.id)
      if (!p) {
        return {
          user_id: m.id, name: m.name, has_planner: false,
          big3_done: 0, big3_total: 0, one_win: null,
        }
      }
      const { done, total } = big3Counts(p.big3_tasks ?? [])
      return {
        user_id: m.id, name: m.name, has_planner: true,
        big3_done: done, big3_total: total, one_win: p.one_win ?? null,
      }
    })

    return {
      date: target,
      written_count: memberStatuses.filter((s) => s.has_planner).length,
      total_count: members.length,
      total_big3_done: memberStatuses.reduce((a, s) => a + s.big3_done, 0),
      total_big3_total: memberStatuses.reduce((a, s) => a + s.big3_total, 0),
      members: memberStatuses,
    }
  },

  getMemberPlanner: async (userId: string, date: string): Promise<PlannerData> => {
    const { data, error } = await supabase
      .from('planners')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    if (error) throw error
    return data ? rowToPlanner(data as PlannerRow) : emptyPlanner(date)
  },

  getMemberHistory: async (
    userId: string, start?: string, end?: string
  ): Promise<PlannerSummary[]> => {
    let q = supabase
      .from('planners')
      .select('date, one_win, big3_tasks')
      .eq('user_id', userId)
    if (start) q = q.gte('date', start)
    if (end) q = q.lte('date', end)
    const { data, error } = await q.order('date', { ascending: false })
    if (error) throw error
    return (data ?? []).map((p: any) => {
      const { done, total } = big3Counts(p.big3_tasks ?? [])
      return { date: p.date, big3_done: done, big3_total: total, one_win: p.one_win }
    })
  },
}
