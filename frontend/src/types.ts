export interface BrainDumpItem {
  seq: number
  content: string | null
}

export interface Big3TaskItem {
  seq: number
  task: string | null
  detail_goal: string | null
  is_done: boolean
}

export interface TimeBlockItem {
  time_slot: string
  task: string | null
  is_done: boolean
}

export interface PlannerData {
  id: number
  user_id: string
  date: string
  one_win: string | null
  tomorrow_1: string | null
  brain_dumps: BrainDumpItem[]
  big3_tasks: Big3TaskItem[]
  time_blocks: TimeBlockItem[]
}

export interface PlannerSummary {
  date: string
  big3_done: number
  big3_total: number
  one_win: string | null
}

export const TIME_SLOTS = [
  "07:30-08:00", "08:00-08:30", "08:30-09:00", "09:00-09:30",
  "09:30-10:00", "10:00-10:30", "10:30-11:00", "11:00-11:30",
  "11:30-12:00", "12:00-12:30", "12:30-13:00", "13:00-13:30",
  "13:30-14:00", "14:00-14:30", "14:30-15:00", "15:00-15:30",
  "15:30-16:00", "16:00-16:30", "16:30-17:00", "17:00-17:30",
  "17:30-18:00", "18:00 이후",
]

export function emptyPlanner(dateStr: string): PlannerData {
  return {
    id: 0,
    user_id: '',
    date: dateStr,
    one_win: null,
    tomorrow_1: null,
    brain_dumps: Array.from({ length: 15 }, (_, i) => ({ seq: i + 1, content: null })),
    big3_tasks: [1, 2, 3].map((seq) => ({ seq, task: null, detail_goal: null, is_done: false })),
    time_blocks: TIME_SLOTS.map((slot) => ({ time_slot: slot, task: null, is_done: false })),
  }
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDateKr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${dateStr} (${days[d.getDay()]})`
}

export function prevDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function nextDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
