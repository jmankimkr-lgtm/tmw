import type { Big3TaskItem } from '../../types'

interface Props {
  items: Big3TaskItem[]
  onChange: (items: Big3TaskItem[]) => void
  readOnly?: boolean
}

const BG = [
  'bg-teal-50 border-teal-200 border-l-4 border-l-teal-500',
  'bg-slate-50 border-slate-200 border-l-4 border-l-teal-400',
  'bg-teal-50/40 border-teal-100 border-l-4 border-l-teal-300',
]

export default function Big3Tasks({ items, onChange, readOnly }: Props) {
  const update = (seq: number, field: keyof Big3TaskItem, value: string | boolean) => {
    onChange(items.map((item) => (item.seq === seq ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-1">
        <span className="text-teal-400 mr-2">2.</span>BIG 3
        <span className="text-slate-400 font-normal text-sm ml-2">오늘 반드시 끝낼 가장 중요한 3가지</span>
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        위 목록에서 오늘 진짜 중요한 3개만 골라 적으세요.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.seq} className={`rounded-lg border p-3 ${BG[item.seq - 1]}`}>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={(e) => update(item.seq, 'is_done', e.target.checked)}
                disabled={readOnly}
                className="mt-1 w-4 h-4 shrink-0 accent-teal-600"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-500 shrink-0">#{item.seq}</span>
                  <input
                    type="text"
                    value={item.task ?? ''}
                    onChange={(e) => update(item.seq, 'task', e.target.value)}
                    readOnly={readOnly}
                    placeholder={readOnly ? '' : '핵심 과제를 입력하세요'}
                    className={`flex-1 text-sm font-medium bg-transparent border-b border-teal-200 focus:border-teal-500 focus:outline-none py-0.5 placeholder-slate-300 ${item.is_done ? 'line-through text-slate-400' : 'text-slate-800'}`}
                  />
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-xs text-teal-400 shrink-0">완료기준</span>
                  <input
                    type="text"
                    value={item.detail_goal ?? ''}
                    onChange={(e) => update(item.seq, 'detail_goal', e.target.value)}
                    readOnly={readOnly}
                    placeholder={readOnly ? '' : '구체적인 완료 기준 / 세부 목표'}
                    className="flex-1 text-xs bg-transparent border-b border-teal-100 focus:border-teal-400 focus:outline-none py-0.5 placeholder-slate-300 text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
