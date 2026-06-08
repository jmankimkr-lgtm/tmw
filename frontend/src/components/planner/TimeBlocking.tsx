import type { TimeBlockItem } from '../../types'

interface Props {
  items: TimeBlockItem[]
  onChange: (items: TimeBlockItem[]) => void
  readOnly?: boolean
}

const SPECIAL: Record<string, string> = {
  '12:00-12:30': '🍽 점심',
  '18:00 이후': '🌙 저녁 / 휴식',
}

export default function TimeBlocking({ items, onChange, readOnly }: Props) {
  const update = (slot: string, field: keyof TimeBlockItem, value: string | boolean) => {
    onChange(items.map((item) => (item.time_slot === slot ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-1">
        <span className="text-teal-400 mr-2">3.</span>TIME BLOCKING
        <span className="text-slate-400 font-normal text-sm ml-2">타임 블로킹</span>
      </h2>
      <p className="text-xs text-slate-400 mb-4">30분 단위로 작업을 배치하세요.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-teal-50 border-b border-teal-100">
              <th className="text-left text-xs text-teal-600 font-semibold py-2 px-3 w-32">시간</th>
              <th className="text-left text-xs text-teal-600 font-semibold py-2 px-3">작업 내용</th>
              <th className="text-center text-xs text-teal-600 font-semibold py-2 px-3 w-14">완료</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const special = SPECIAL[item.time_slot]
              return (
                <tr key={item.time_slot} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                  <td className="py-1.5 px-3 text-xs font-mono text-teal-600 whitespace-nowrap">
                    {item.time_slot}
                  </td>
                  <td className="py-1 px-3">
                    {special && !item.task ? (
                      <span className="text-xs text-slate-400 italic">{special}</span>
                    ) : null}
                    <input
                      type="text"
                      value={item.task ?? ''}
                      onChange={(e) => update(item.time_slot, 'task', e.target.value)}
                      readOnly={readOnly}
                      placeholder={readOnly ? '' : (special || '작업을 입력하세요')}
                      className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-300 text-slate-700"
                    />
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={item.is_done}
                      onChange={(e) => update(item.time_slot, 'is_done', e.target.checked)}
                      disabled={readOnly}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
