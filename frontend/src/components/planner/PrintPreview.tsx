import { useEffect } from 'react'
import { formatDateKr, TIME_SLOTS, type PlannerData } from '../../types'

interface Props {
  data: PlannerData
  authorName: string
  onClose: () => void
}

export default function PrintPreview({ data, authorName, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handlePrint = () => window.print()

  const big3Done = data.big3_tasks.filter((t) => t.is_done && t.task).length
  const big3Total = data.big3_tasks.filter((t) => t.task).length

  const allDumps = Array.from({ length: 15 }, (_, i) => {
    const found = data.brain_dumps.find((b) => b.seq === i + 1)
    return { seq: i + 1, content: found?.content ?? null }
  })

  const allBlocks = TIME_SLOTS.map((slot) => {
    const found = data.time_blocks.find((b) => b.time_slot === slot)
    return { time_slot: slot, task: found?.task ?? null, is_done: found?.is_done ?? false }
  })

  const blockCol1 = allBlocks.slice(0, 11)
  const blockCol2 = allBlocks.slice(11)

  return (
    <>
      <div className="print-preview-backdrop print:hidden fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="print-preview-shell fixed inset-0 z-50 flex items-start justify-center pt-6 pb-6 px-4 print:p-0 print:inset-auto print:block print:static">
        <div className="print-preview-card bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl print:shadow-none print:max-h-none print:overflow-visible print:rounded-none print:max-w-none">

          {/* 툴바 */}
          <div className="print-preview-toolbar print:hidden sticky top-0 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10">
            <span className="text-sm font-semibold text-gray-700">인쇄 미리보기</span>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
              >
                🖨️ 인쇄
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
              >
                닫기
              </button>
            </div>
          </div>

          {/* 인쇄 영역 */}
          <div id="print-area" className="px-6 py-4 text-slate-800">

            {/* 헤더 */}
            <div className="border-b-[3px] border-teal-500 pb-2 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={`${import.meta.env.BASE_URL}deepnoid-logo-white.png`}
                  alt="DEEPNOID"
                  className="h-5 object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(500%) hue-rotate(145deg)' }}
                />
                <span className="font-extrabold text-sm tracking-tight text-slate-700">Team Planner</span>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-teal-700">{formatDateKr(data.date)}</div>
                <div className="text-xs text-slate-400">{authorName} · BIG 3 완료 {big3Done}/{big3Total}</div>
              </div>
            </div>

            {/* Brain Dump + BIG 3 */}
            <div className="grid grid-cols-2 gap-4 mb-3">

              {/* Brain Dump */}
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded mb-1.5">
                  Brain Dump
                </h2>
                <div className="grid grid-cols-3 gap-x-1">
                  {allDumps.map((b) => (
                    <div key={b.seq} className="flex gap-1 py-0.5 border-b border-teal-100">
                      <span className="text-[10px] text-teal-400 shrink-0 w-5">{b.seq}.</span>
                      <span className="text-sm text-slate-700 break-words min-w-0">{b.content ?? ''}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* BIG 3 + 오늘의 승리 + 내일 #1 */}
              <section className="flex flex-col gap-1.5">
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded mb-1.5">
                    BIG 3
                  </h2>
                  <div className="space-y-1.5">
                    {data.big3_tasks.map((t) => (
                      <div key={t.seq} className="border-l-4 border-teal-400 bg-teal-50/50 rounded-r px-2 py-1">
                        <div className="flex gap-1.5 items-start">
                          <span className="shrink-0 text-teal-500 text-sm mt-px">{t.is_done ? '☑' : '☐'}</span>
                          <span className={`text-sm break-words min-w-0 ${t.is_done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {t.task || <span className="text-slate-200">—</span>}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 ml-5 mt-0.5 break-words">
                          완료기준: {t.detail_goal || <span className="text-slate-200">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오늘의 승리 */}
                <div className="border border-teal-200 bg-teal-50/30 rounded px-2 py-1">
                  <div className="text-[10px] font-bold text-teal-600 mb-0.5">🏆 오늘의 승리</div>
                  <div className="text-sm text-slate-700 break-words">{data.one_win || <span className="text-slate-200">—</span>}</div>
                </div>

                {/* 내일 #1 */}
                <div className="border border-teal-200 bg-teal-50/30 rounded px-2 py-1">
                  <div className="text-[10px] font-bold text-teal-600 mb-0.5">내일 #1</div>
                  <div className="text-sm text-slate-700 break-words">{data.tomorrow_1 || <span className="text-slate-200">—</span>}</div>
                </div>
              </section>
            </div>

            {/* Time Blocking */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded mb-1.5">
                Time Blocking
              </h2>
              <div className="grid grid-cols-2 gap-x-6">
                <table className="w-full border-collapse">
                  <tbody>
                    {blockCol1.map((b) => (
                      <tr key={b.time_slot} className="border-b border-teal-100">
                        <td className="py-0.5 pr-1.5 text-xs text-teal-600 whitespace-nowrap w-24">{b.time_slot}</td>
                        <td className={`py-0.5 text-sm break-words ${b.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {b.task ?? ''}
                        </td>
                        <td className="py-0.5 text-center text-sm text-teal-500 w-5 shrink-0">
                          {b.task ? (b.is_done ? '☑' : '☐') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full border-collapse">
                  <tbody>
                    {blockCol2.map((b) => (
                      <tr key={b.time_slot} className="border-b border-teal-100">
                        <td className="py-0.5 pr-1.5 text-xs text-teal-600 whitespace-nowrap w-24">{b.time_slot}</td>
                        <td className={`py-0.5 text-sm break-words ${b.is_done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {b.task ?? ''}
                        </td>
                        <td className="py-0.5 text-center text-sm text-teal-500 w-5 shrink-0">
                          {b.task ? (b.is_done ? '☑' : '☐') : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          html, body, #root {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .print-source-page,
          .print-preview-backdrop,
          .print-preview-toolbar {
            display: none !important;
          }
          .print-preview-shell,
          .print-preview-card {
            display: block !important;
            position: static !important;
            inset: auto !important;
            width: auto !important;
            max-width: none !important;
            max-height: none !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          #print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 186mm !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 auto !important;
            overflow: visible !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </>
  )
}
