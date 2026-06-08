interface Props {
  oneWin: string
  tomorrow1: string
  onChangeOneWin: (v: string) => void
  onChangeTomorrow1: (v: string) => void
  readOnly?: boolean
}

export default function DailySummary({ oneWin, tomorrow1, onChangeOneWin, onChangeTomorrow1, readOnly }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-6 space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          🏆 오늘의 승리 한 줄 요약
          <span className="font-normal text-slate-400 ml-1 text-xs">One Win Today</span>
        </label>
        <input
          type="text"
          value={oneWin}
          onChange={(e) => onChangeOneWin(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? '' : '오늘 가장 잘한 일, 성취한 것을 한 줄로 적어보세요'}
          className="w-full border-b border-teal-200 focus:border-teal-500 focus:outline-none py-1.5 text-sm placeholder-slate-300 bg-transparent text-slate-700"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          내일 가장 먼저 할 일
          <span className="font-normal text-slate-400 ml-1 text-xs">Tomorrow's #1</span>
        </label>
        <input
          type="text"
          value={tomorrow1}
          onChange={(e) => onChangeTomorrow1(e.target.value)}
          readOnly={readOnly}
          placeholder={readOnly ? '' : '내일 아침 눈 뜨자마자 해야 할 가장 중요한 일'}
          className="w-full border-b border-teal-200 focus:border-teal-500 focus:outline-none py-1.5 text-sm placeholder-slate-300 bg-transparent text-slate-700"
        />
      </div>
      <p className="text-center text-xs text-slate-400 italic pt-2">
        " Work like hell. " — Elon Musk
      </p>
    </div>
  )
}
