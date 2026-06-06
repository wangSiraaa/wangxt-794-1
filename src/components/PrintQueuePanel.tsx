import React, { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import type { Sample, LabelData } from '@/types'
import { rules } from '@/services/rules'
import { downloadFile } from '@/utils'

export const PrintQueuePanel: React.FC = () => {
  const { state, dispatch } = useApp()

  const queueSamples = useMemo(() => {
    return state.printQueue
      .map(item => {
        const sample = state.samples.find(s => s.id === item.sampleId)
        return sample ? { ...item, sample } : null
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [state.printQueue, state.samples])

  const generateLabelData = (sample: Sample): LabelData => {
    const position = rules.getPositionLabel(sample.boxPosition, sample.position)
    return {
      sampleCode: sample.sampleCode,
      sampleType: sample.sampleType,
      projectName: sample.projectName,
      position,
      expirationDate: sample.expirationDate,
      qrData: JSON.stringify({
        id: sample.id,
        code: sample.sampleCode,
        position
      })
    }
  }

  const handleRemove = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_PRINT_QUEUE', payload: id })
  }

  const handleClear = () => {
    if (confirm('确定清空打印队列吗？')) {
      dispatch({ type: 'CLEAR_PRINT_QUEUE' })
    }
  }

  const handlePrintLabels = () => {
    const labels = queueSamples.map(item => generateLabelData(item.sample))
    const labelContent = labels.map(label => `
┌─────────────────────────┐
│  样本标签                │
│                         │
│  编号: ${label.sampleCode.padEnd(16)}│
│  类型: ${label.sampleType.padEnd(16)}│
│  项目: ${label.projectName.slice(0, 14).padEnd(16)}│
│  位置: ${label.position.padEnd(16)}│
│  效期: ${label.expirationDate.padEnd(16)}│
│                         │
│  [QR: ${label.qrData.slice(0, 20)}...]│
└─────────────────────────┘
    `).join('\n\n')

    downloadFile(labelContent, `样本标签_${new Date().toISOString().slice(0, 10)}.txt`, 'text/plain')
  }

  const handleExportCSV = () => {
    const headers = ['样本编号', '样本类型', '项目名称', '位置', '有效期']
    const rows = queueSamples.map(item => {
      const label = generateLabelData(item.sample)
      return [label.sampleCode, label.sampleType, label.projectName, label.position, label.expirationDate]
    })
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    downloadFile(csv, `打印队列_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
  }

  const validation = rules.validatePrintQueue(state.printQueue)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">打印队列</h3>
          <p className="text-sm text-gray-500">共 {queueSamples.length} 个样本待打印</p>
        </div>
        <div className="flex gap-2">
          {queueSamples.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                导出CSV
              </button>
              <button
                onClick={handlePrintLabels}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                打印标签
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                清空
              </button>
            </>
          )}
        </div>
      </div>

      {!validation.valid && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{validation.error}</p>
        </div>
      )}

      <div className="p-4">
        {queueSamples.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">打印队列为空</p>
            <p className="text-sm text-gray-400 mt-1">从样本详情添加样本到打印队列</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {queueSamples.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-sm font-semibold text-gray-800 truncate">
                      {item.sample.sampleCode}
                    </p>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      ×{item.copies}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {item.sample.sampleType} · {item.sample.projectName}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {rules.getPositionLabel(item.sample.boxPosition, item.sample.position)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="ml-4 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {queueSamples.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">标签预览</h4>
          <div className="grid grid-cols-2 gap-3">
            {queueSamples.slice(0, 4).map(item => {
              const label = generateLabelData(item.sample)
              return (
                <div
                  key={item.id}
                  className="p-3 bg-white border-2 border-dashed border-gray-300 rounded text-xs font-mono"
                >
                  <p className="font-bold text-center mb-2">样本标签</p>
                  <p>编号: {label.sampleCode}</p>
                  <p>类型: {label.sampleType}</p>
                  <p>位置: {label.position}</p>
                  <p>效期: {label.expirationDate}</p>
                </div>
              )
            })}
            {queueSamples.length > 4 && (
              <div className="p-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 flex items-center justify-center">
                还有 {queueSamples.length - 4} 个...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
