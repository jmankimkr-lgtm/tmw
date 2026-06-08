import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { plannerApi } from '../api/client'
import Navbar from '../components/common/Navbar'
import PrintPreview from '../components/planner/PrintPreview'
import { useAuth } from '../context/AuthContext'
import { formatDateKr, type PlannerData, type PlannerSummary } from '../types'

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const color = pct === 100 ? 'bg-teal-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">
        {total > 0 ? `${done}/${total}` : '-'}
      </span>
    </div>
  )
}

export default function HistoryPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [start, setStart] = useState(thirtyDaysAgo)
  const [end, setEnd] = useState(today)
  const [list, setList] = useState<PlannerSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [printData, setPrintData] = useState<PlannerData | null>(null)

  const handlePrint = async (date: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const planner = await plannerApi.getByDate(date)
    setPrintData(planner)
  }

  const fetchHistory = () => {
    setLoading(true)
    plannerApi.getHistory(start, end)
      .then((rows) => setList(rows))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchHistory() }, [])

  return (
    <>
      <div className="print-source-page min-h-screen bg-slate-50">
        <Navbar user={user!} onLogout={() => { logout(); navigate('/login') }} />

        <div className="bg-white border-b border-teal-100">
          <div className="max-w-3xl mx-auto px-4 flex gap-1 py-2">
            <button
              onClick={() => navigate('/planner')}
              className="text-sm font-medium px-3 py-1.5 rounded-md text-slate-600 hover:bg-teal-50 hover:text-teal-700"
            >
              플래너 작성
            </button>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-teal-600 text-white"
            >
              이력 조회
            </button>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* 필터 */}
          <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-4 mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">시작</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="border border-teal-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">종료</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="border border-teal-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
            <button
              onClick={fetchHistory}
              className="px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
            >
              조회
            </button>
          </div>

          {/* 목록 */}
          <div className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-slate-400">불러오는 중...</div>
            ) : list.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm">해당 기간에 작성된 플래너가 없습니다.</div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-50 border-b border-teal-100">
                    <th className="text-left text-xs text-teal-600 font-semibold py-3 px-4">날짜</th>
                    <th className="text-left text-xs text-teal-600 font-semibold py-3 px-4">BIG 3 완료</th>
                    <th className="text-left text-xs text-teal-600 font-semibold py-3 px-4 hidden sm:table-cell">오늘의 승리</th>
                    <th className="py-3 px-4 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => (
                    <tr
                      key={item.date}
                      className="border-b border-teal-50 hover:bg-teal-50/50 transition cursor-pointer"
                      onClick={() => navigate(`/planner/${item.date}`)}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-slate-800">
                        {formatDateKr(item.date)}
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBar done={item.big3_done} total={item.big3_total} />
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 hidden sm:table-cell max-w-xs truncate">
                        {item.one_win ?? <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handlePrint(item.date, e)}
                            className="text-xs text-slate-400 hover:text-teal-600 px-1 transition"
                            title="인쇄"
                          >
                            🖨️
                          </button>
                          <span className="text-xs text-slate-400 hover:text-teal-600 transition">보기 →</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {printData && (
        <PrintPreview
          data={printData}
          authorName={user?.name ?? ''}
          onClose={() => setPrintData(null)}
        />
      )}
    </>
  )
}
