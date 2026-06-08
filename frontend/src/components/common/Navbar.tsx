import { useNavigate } from 'react-router-dom'
import type { AuthUser } from '../../api/client'

interface Props {
  user: AuthUser
  onLogout: () => void
}

export default function Navbar({ user, onLogout }: Props) {
  const navigate = useNavigate()

  return (
    <nav className="bg-slate-800 text-white px-6 py-3 flex items-center justify-between print:hidden border-b-2 border-teal-500">
      <button
        onClick={() => navigate(user.role === 'admin' ? '/admin' : '/planner')}
        className="flex items-center gap-2 hover:opacity-80 transition"
      >
        <img src={`${import.meta.env.BASE_URL}deepnoid-logo-white.png`} alt="DEEPNOID" className="h-6 object-contain" />
        <span className="font-bold text-base text-white">Team Planner</span>
        {user.role === 'admin' && (
          <span className="ml-2 text-xs bg-teal-400 text-slate-900 font-semibold px-2 py-0.5 rounded-full">
            Admin
          </span>
        )}
      </button>
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/profile')}
          className="text-sm text-slate-300 hover:text-white transition underline-offset-2 hover:underline"
          title="내 정보 수정"
        >
          {user.name}
        </button>
        <button
          onClick={onLogout}
          className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition border border-slate-600"
        >
          로그아웃
        </button>
      </div>
    </nav>
  )
}
