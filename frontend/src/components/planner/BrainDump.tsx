import type { BrainDumpItem } from '../../types'

interface Props {
  items: BrainDumpItem[]
  onChange: (items: BrainDumpItem[]) => void
  readOnly?: boolean
}

export default function BrainDump({ items, onChange, readOnly }: Props) {
  const update = (seq: number, content: string) => {
    onChange(items.map((item) => (item.seq === seq ? { ...item, content } : item)))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-teal-100 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-1">
        <span className="text-teal-400 mr-2">1.</span>BRAIN DUMP
        <span className="text-slate-400 font-normal text-sm ml-2">브레인 덤프</span>
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        머릿속 모든 생각·할 일·아이디어·걱정거리를 마구 적어내세요. (필터링 없이 5~10분 동안 쏟아내기)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.seq} className="flex items-center gap-2">
            <span className="text-xs text-teal-400 w-5 text-right shrink-0">{item.seq}.</span>
            <input
              type="text"
              value={item.content ?? ''}
              onChange={(e) => update(item.seq, e.target.value)}
              readOnly={readOnly}
              placeholder={readOnly ? '' : '생각을 자유롭게 적어보세요'}
              className="flex-1 text-sm border-b border-teal-100 focus:border-teal-500 focus:outline-none py-1 px-1 bg-transparent placeholder-slate-300 read-only:text-slate-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
