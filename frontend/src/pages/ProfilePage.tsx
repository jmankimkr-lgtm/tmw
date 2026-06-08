import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/client'
import Navbar from '../components/common/Navbar'
import { useAuth } from '../context/AuthContext'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user])

  const pwMismatch = newPw !== '' && confirmPw !== '' && newPw !== confirmPw
  const canSave =
    !pwMismatch &&
    name.trim() !== '' &&
    (newPw === '' || (currentPw !== '' && newPw.length >= 6))

  const handleSave = async () => {
    setSaveState('saving')
    setErrorMsg('')
    try {
      await authApi.updateMe({
        name: name.trim(),
        ...(newPw ? { current_password: currentPw, new_password: newPw } : {}),
      })
      await refreshUser()
      setSaveState('saved')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setTimeout(() => {
        setSaveState('idle')
        navigate(user?.role === 'admin' ? '/admin' : '/planner')
      }, 1000)
    } catch (err: any) {
      const msg = err?.message ?? '저장에 실패했습니다'
      setErrorMsg(msg)
      setSaveState('error')
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user!} onLogout={() => { logout(); navigate('/login') }} />

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
          <div className="bg-slate-800 text-white px-6 py-4 border-b-2 border-teal-500">
            <h1 className="text-base font-bold">내 정보 수정</h1>
            <p className="text-xs text-slate-400 mt-0.5">이름과 비밀번호를 변경할 수 있습니다</p>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* 이메일 (로그인 ID, 변경 불가) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이메일 (로그인 ID)</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
              />
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="이름"
              />
            </div>

            {/* 비밀번호 변경 */}
            <div className="border-t border-teal-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
                비밀번호 변경 <span className="font-normal normal-case">(선택 사항)</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">현재 비밀번호</label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="현재 비밀번호"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                    placeholder="6자 이상"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                      pwMismatch ? 'border-red-400 bg-red-50' : 'border-teal-200'
                    }`}
                    placeholder="새 비밀번호 재입력"
                  />
                  {pwMismatch && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>
              </div>
            </div>

            {/* 오류 / 성공 메시지 */}
            {saveState === 'error' && errorMsg && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</p>
            )}
            {saveState === 'saved' && (
              <p className="text-sm text-teal-600 bg-teal-50 px-3 py-2 rounded-lg">✓ 저장되었습니다</p>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2 text-sm rounded-lg border border-teal-200 text-slate-600 hover:bg-teal-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saveState === 'saving'}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-40"
              >
                {saveState === 'saving' ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
