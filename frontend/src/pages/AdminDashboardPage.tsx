import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi, type DashboardData } from '../api/client'
import Navbar from '../components/common/Navbar'
import { useAuth } from '../context/AuthContext'
import { formatDateKr, todayStr } from '../types'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-5 text-center">
      <div className="text-2xl font-bold text-teal-600">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function Big3Bar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const color = pct === 100 ? 'bg-teal-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{total > 0 ? `${done}/${total}` : '-'}</span>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayStr())
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = (d: string) => {
    setLoading(true)
    adminApi.getDashboard(d)
      .then((res) => setData(res))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch(date) }, [])

  const handleDateSearch = () => fetch(date)

  const big3Rate = data && data.total_big3_total > 0
    ? Math.round((data.total_big3_done / data.total_big3_total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user!} onLogout={() => { logout(); navigate('/login') }} />

      {/* 서브 네비 */}
      <div className="bg-white border-b border-teal-100">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 py-2">
          <button className="text-sm font-medium px-3 py-1.5 rounded-md bg-teal-600 text-white">
            팀 현황
          </button>
          <button
            onClick={() => navigate('/admin/detail')}
            className="text-sm font-medium px-3 py-1.5 rounded-md text-slate-600 hover:bg-teal-50 hover:text-teal-700"
          >
            팀원 상세 조회
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* 날짜 필터 */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-teal-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
          <button
            onClick={handleDateSearch}
            className="px-4 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition"
          >
            조회
          </button>
          {data && (
            <span className="text-sm text-slate-500">
              📅 {formatDateKr(data.date)}
            </span>
          )}
        </div>

        {/* 요약 카드 */}
        {data && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="오늘 작성"
              value={`${data.written_count} / ${data.total_count}명`}
              sub={`미작성 ${data.total_count - data.written_count}명`}
            />
            <StatCard
              label="BIG 3 완료율"
              value={`${big3Rate}%`}
              sub={`${data.total_big3_done}/${data.total_big3_total} 완료`}
            />
            <StatCard
              label="작성 완료율"
              value={`${data.total_count > 0 ? Math.round((data.written_count / data.total_count) * 100) : 0}%`}
              sub={`${data.written_count}명 작성`}
            />
          </div>
        )}

        {/* 팀원 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-teal-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-teal-100">
            <h2 className="text-sm font-semibold text-slate-700">팀원별 현황</h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">불러오는 중...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-teal-50 border-b border-teal-100">
                  <th className="text-left text-xs text-teal-600 font-semibold py-2.5 px-5">이름</th>
                  <th className="text-left text-xs text-teal-600 font-semibold py-2.5 px-4">작성 여부</th>
                  <th className="text-left text-xs text-teal-600 font-semibold py-2.5 px-4">BIG 3 완료</th>
                  <th className="text-left text-xs text-teal-600 font-semibold py-2.5 px-4 hidden md:table-cell">오늘의 승리</th>
                  <th className="py-2.5 px-4 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {data?.members.map((m) => (
                  <tr
                    key={m.user_id}
                    className="border-b border-teal-50 hover:bg-teal-50/50 transition cursor-pointer"
                    onClick={() => navigate(`/admin/detail?user_id=${m.user_id}&date=${data.date}`)}
                  >
                    <td className="py-3.5 px-5 font-medium text-sm text-slate-800">{m.name}</td>
                    <td className="py-3.5 px-4">
                      {m.has_planner
                        ? <span className="text-xs bg-teal-100 text-teal-700 font-medium px-2 py-0.5 rounded-full">✓ 완료</span>
                        : <span className="text-xs bg-slate-100 text-slate-400 font-medium px-2 py-0.5 rounded-full">미작성</span>
                      }
                    </td>
                    <td className="py-3.5 px-4">
                      {m.has_planner
                        ? <Big3Bar done={m.big3_done} total={m.big3_total} />
                        : <span className="text-xs text-slate-300">-</span>
                      }
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-500 hidden md:table-cell max-w-xs truncate">
                      {m.one_win ?? <span className="text-slate-300">-</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs text-slate-400 hover:text-teal-600 transition">상세 →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
