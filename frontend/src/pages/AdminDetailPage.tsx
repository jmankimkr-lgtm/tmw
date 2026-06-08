import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { adminApi, type MemberInfo } from '../api/client'
import Big3Tasks from '../components/planner/Big3Tasks'
import BrainDump from '../components/planner/BrainDump'
import DailySummary from '../components/planner/DailySummary'
import TimeBlocking from '../components/planner/TimeBlocking'
import PrintPreview from '../components/planner/PrintPreview'
import Navbar from '../components/common/Navbar'
import { useAuth } from '../context/AuthContext'
import {
  emptyPlanner, formatDateKr, nextDate, prevDate, todayStr,
  type PlannerData,
} from '../types'

export default function AdminDetailPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [members, setMembers] = useState<MemberInfo[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    searchParams.get('user_id') ?? null
  )
  const [currentDate, setCurrentDate] = useState(searchParams.get('date') ?? todayStr())
  const [data, setData] = useState<PlannerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    adminApi.getMembers().then((rows) => {
      setMembers(rows)
      if (!selectedUserId && rows.length > 0) {
        setSelectedUserId(rows[0].id)
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedUserId) return
    setLoading(true)
    adminApi.getMemberPlanner(selectedUserId, currentDate)
      .then((res) => setData(res))
      .catch(() => setData(emptyPlanner(currentDate)))
      .finally(() => setLoading(false))
  }, [selectedUserId, currentDate])

  const goDate = (d: string) => {
    setCurrentDate(d)
    if (selectedUserId) setSearchParams({ user_id: selectedUserId, date: d })
  }

  const selectedMember = members.find((m) => m.id === selectedUserId)

  const big3Done = data?.big3_tasks.filter((t) => t.is_done && t.task).length ?? 0
  const big3Total = data?.big3_tasks.filter((t) => t.task).length ?? 0

  return (
    <>
      <div className="print-source-page min-h-screen bg-slate-50">
        <Navbar user={user!} onLogout={() => { logout(); navigate('/login') }} />

        {/* 서브 네비 */}
        <div className="bg-white border-b border-teal-100">
          <div className="max-w-4xl mx-auto px-4 flex gap-1 py-2">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm font-medium px-3 py-1.5 rounded-md text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            >
              팀 현황
            </button>
            <button className="text-sm font-medium px-3 py-1.5 rounded-md bg-teal-600 text-white">
              팀원 상세 조회
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* 팀원 / 날짜 선택 */}
          <div className="bg-white rounded-xl shadow-sm border border-teal-100 px-5 py-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500 shrink-0">팀원</label>
              <select
                value={selectedUserId ?? ''}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedUserId(id)
                  setSearchParams({ user_id: id, date: currentDate })
                }}
                className="border border-teal-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500 shrink-0">날짜</label>
              <input
                type="date"
                value={currentDate}
                max={todayStr()}
                onChange={(e) => goDate(e.target.value)}
                className="border border-teal-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            {data && (
              <button
                onClick={() => setShowPrint(true)}
                className="ml-auto px-4 py-1.5 border border-teal-200 text-teal-600 text-sm rounded-lg hover:bg-teal-50 transition"
              >
                🖨️ 인쇄
              </button>
            )}
          </div>

          {/* 날짜 네비게이션 헤더 */}
          <div className="bg-slate-800 text-white rounded-xl px-6 py-4 flex items-center justify-between border-b-2 border-teal-500">
            <button
              onClick={() => goDate(prevDate(currentDate))}
              className="text-slate-400 hover:text-white text-lg px-2 transition"
            >
              ←
            </button>
            <div className="text-center">
              {selectedMember && (
                <div className="text-xs text-slate-400 mb-0.5">작성자: {selectedMember.name}</div>
              )}
              <div className="text-base font-bold">📅 {formatDateKr(currentDate)}</div>
              <div className="text-xs text-teal-400 mt-0.5">읽기 전용</div>
              {big3Total > 0 && (
                <div className="text-xs text-slate-300 mt-1">
                  BIG 3: {big3Done}/{big3Total}
                  <span className="ml-2">
                    {'█'.repeat(big3Done)}{'░'.repeat(big3Total - big3Done)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => { if (currentDate < todayStr()) goDate(nextDate(currentDate)) }}
              disabled={currentDate >= todayStr()}
              className="text-slate-400 hover:text-white text-lg px-2 disabled:opacity-30 transition"
            >
              →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">불러오는 중...</div>
          ) : data ? (
            <>
              <BrainDump items={data.brain_dumps} onChange={() => {}} readOnly />
              <Big3Tasks items={data.big3_tasks} onChange={() => {}} readOnly />
              <TimeBlocking items={data.time_blocks} onChange={() => {}} readOnly />
              <DailySummary
                oneWin={data.one_win ?? ''}
                tomorrow1={data.tomorrow_1 ?? ''}
                onChangeOneWin={() => {}}
                onChangeTomorrow1={() => {}}
                readOnly
              />
            </>
          ) : null}
        </div>
      </div>

      {showPrint && data && (
        <PrintPreview
          data={data}
          authorName={selectedMember?.name ?? ''}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  )
}
