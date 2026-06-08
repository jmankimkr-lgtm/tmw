import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { plannerApi } from '../api/client'
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

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function PlannerPage() {
  const { user, logout } = useAuth()
  const { date: dateParam } = useParams<{ date?: string }>()
  const navigate = useNavigate()

  const currentDate = dateParam ?? todayStr()
  const isToday = currentDate === todayStr()
  const isFuture = currentDate > todayStr()

  const [data, setData] = useState<PlannerData>(emptyPlanner(currentDate))
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showPrint, setShowPrint] = useState(false)

  useEffect(() => {
    setLoading(true)
    const fetch = isToday
      ? plannerApi.getToday()
      : plannerApi.getByDate(currentDate)
    fetch
      .then((d) => setData(d))
      .catch(() => setData(emptyPlanner(currentDate)))
      .finally(() => setLoading(false))
  }, [currentDate, isToday])

  const handleSave = async () => {
    setSaveState('saving')
    try {
      const saved = await plannerApi.upsert(data)
      setData(saved)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const big3Done = data.big3_tasks.filter((t) => t.is_done && t.task).length
  const big3Total = data.big3_tasks.filter((t) => t.task).length

  return (
    <>
      <div className="print-source-page min-h-screen bg-slate-50">
        <Navbar user={user!} onLogout={() => { logout(); navigate('/login') }} />

        {/* 서브 네비 */}
        <div className="bg-white border-b border-teal-100">
          <div className="max-w-3xl mx-auto px-4 flex gap-1 py-2">
            <button
              onClick={() => navigate('/planner')}
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-teal-600 text-white"
            >
              플래너 작성
            </button>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium px-3 py-1.5 rounded-md text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            >
              이력 조회
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* 날짜 헤더 */}
          <div className="bg-slate-800 text-white rounded-xl px-6 py-4 flex items-center justify-between border-b-2 border-teal-500">
            <button
              onClick={() => navigate(`/planner/${prevDate(currentDate)}`)}
              className="text-slate-400 hover:text-white text-lg px-2 transition"
            >
              ←
            </button>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-0.5">작성자: {user?.name}</div>
              <div className="text-base font-bold">📅 {formatDateKr(currentDate)}</div>
              {isToday && <div className="text-xs text-teal-400 mt-0.5">오늘</div>}
              {big3Total > 0 && (
                <div className="text-xs text-slate-300 mt-1">
                  BIG 3 진행률: {big3Done}/{big3Total}
                  <span className="ml-2">
                    {'█'.repeat(big3Done)}{'░'.repeat(big3Total - big3Done)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate(nextDate(currentDate) <= todayStr() ? `/planner/${nextDate(currentDate)}` : `/planner`)}
              disabled={isToday}
              className="text-slate-400 hover:text-white text-lg px-2 disabled:opacity-30 transition"
            >
              →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">불러오는 중...</div>
          ) : (
            <>
              <BrainDump
                items={data.brain_dumps}
                onChange={(items) => setData({ ...data, brain_dumps: items })}
              />
              <Big3Tasks
                items={data.big3_tasks}
                onChange={(items) => setData({ ...data, big3_tasks: items })}
              />
              <TimeBlocking
                items={data.time_blocks}
                onChange={(items) => setData({ ...data, time_blocks: items })}
              />
              <DailySummary
                oneWin={data.one_win ?? ''}
                tomorrow1={data.tomorrow_1 ?? ''}
                onChangeOneWin={(v) => setData({ ...data, one_win: v })}
                onChangeTomorrow1={(v) => setData({ ...data, tomorrow_1: v })}
              />

              <div className="flex justify-between items-center pb-8">
                <button
                  onClick={() => setShowPrint(true)}
                  className="px-4 py-2 border border-teal-200 text-teal-600 text-sm rounded-lg hover:bg-teal-50 transition"
                >
                  🖨️ 인쇄
                </button>
                {!isFuture && (
                  <div className="flex items-center gap-3">
                    {saveState === 'saved' && (
                      <span className="text-sm text-teal-600">✓ 저장 완료</span>
                    )}
                    {saveState === 'error' && (
                      <span className="text-sm text-red-500">저장 실패. 다시 시도해 주세요.</span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={saveState === 'saving'}
                      className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                    >
                      {saveState === 'saving' ? '저장 중...' : '저장'}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showPrint && (
        <PrintPreview
          data={data}
          authorName={user?.name ?? ''}
          onClose={() => setShowPrint(false)}
        />
      )}
    </>
  )
}
