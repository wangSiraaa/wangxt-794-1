import React from 'react'
import { useApp } from '@/context/AppContext'
import { rules } from '@/services/rules'
import { SampleStatus } from '@/types'
import type { Sample } from '@/types'
import { getRowLabel, getColLabel, getDaysUntilExpiration } from '@/utils'

interface BoxMatrixViewProps {
  boxId: string
  onCellClick?: (sample: Sample | null, row: number, col: number) => void
  readOnly?: boolean
}

export const BoxMatrixView: React.FC<BoxMatrixViewProps> = ({
  boxId,
  onCellClick,
  readOnly = false
}) => {
  const { state } = useApp()
  const matrix = state.boxMatrices[boxId]
  const box = state.boxes.find(b => b.id === boxId)

  const getCellStyle = (sample: Sample | null, row: number, col: number) => {
    const isHighlighted =
      state.highlightedPosition?.row === row &&
      state.highlightedPosition?.col === col
    const isSelected =
      state.selectedSample?.position.row === row &&
      state.selectedSample?.position.col === col &&
      state.selectedSample?.boxPosition.boxId === boxId

    let baseClass =
      'w-10 h-10 border border-gray-300 flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-blue-400 relative '

    if (isHighlighted) {
      baseClass += 'animate-ping-slow ring-4 ring-yellow-400 '
    } else if (isSelected) {
      baseClass += 'ring-2 ring-green-500 bg-sample-selected '
    } else if (!sample) {
      baseClass += 'bg-sample-empty hover:bg-gray-200 '
    } else {
      const effectiveStatus = rules.getEffectiveStatus(sample)
      if (effectiveStatus === SampleStatus.EXPIRED) {
        baseClass += 'bg-sample-expired border-red-400 '
      } else if (effectiveStatus === SampleStatus.USED) {
        baseClass += 'bg-gray-300 '
      } else {
        baseClass += 'bg-sample-occupied hover:bg-blue-200 '
      }
    }

    return baseClass
  }

  const getTooltipText = (sample: Sample | null, row: number, col: number) => {
    const pos = `${getRowLabel(row)}${getColLabel(col)}`
    if (!sample) {
      return `孔位 ${pos}: 空`
    }
    const daysLeft = getDaysUntilExpiration(sample.expirationDate)
    const effectiveStatus = rules.getEffectiveStatus(sample)
    const statusText =
      effectiveStatus === SampleStatus.EXPIRED
        ? '已过期'
        : effectiveStatus === SampleStatus.USED
        ? '已使用'
        : '正常'
    return `孔位 ${pos}
样本编号: ${sample.sampleCode}
样本类型: ${sample.sampleType}
项目: ${sample.projectName}
有效期: ${sample.expirationDate}
剩余天数: ${daysLeft > 0 ? daysLeft + '天' : '已过期'}
状态: ${statusText}`
  }

  if (!matrix || !box) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">盒位矩阵未找到</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{box.boxName}</h3>
          <p className="text-sm text-gray-500">
            {box.rows} × {box.cols} 孔位
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-sample-empty border border-gray-300 rounded"></span>
            <span>空</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-sample-occupied border border-gray-300 rounded"></span>
            <span>正常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-sample-expired border border-red-400 rounded"></span>
            <span>已过期</span>
          </div>
        </div>
      </div>

      <div className="overflow-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="w-10 h-10"></th>
              {Array.from({ length: matrix.cols }).map((_, i) => (
                <th
                  key={i}
                  className="w-10 h-10 text-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-300"
                >
                  {getColLabel(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: matrix.rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                <td className="w-10 h-10 text-center text-xs font-medium text-gray-600 bg-gray-50 border border-gray-300">
                  {getRowLabel(rowIdx)}
                </td>
                {Array.from({ length: matrix.cols }).map((_, colIdx) => {
                  const sample = matrix.samples[rowIdx]?.[colIdx] || null
                  return (
                    <td key={colIdx}>
                      <div
                        className={getCellStyle(sample, rowIdx, colIdx)}
                        title={getTooltipText(sample, rowIdx, colIdx)}
                        onClick={() => !readOnly && onCellClick?.(sample, rowIdx, colIdx)}
                        data-testid={`cell-${rowIdx}-${colIdx}`}
                        data-sample-id={sample?.id || ''}
                        data-sample-status={sample ? rules.getEffectiveStatus(sample) : 'empty'}
                      >
                        {sample && (
                          <>
                            <span className="truncate max-w-full text-[10px]">
                              {sample.sampleCode.slice(-4)}
                            </span>
                            {rules.isSampleExpired(sample) && (
                              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-500">总孔位</p>
          <p className="text-xl font-semibold text-gray-800">{matrix.rows * matrix.cols}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-600">已使用</p>
          <p className="text-xl font-semibold text-blue-700">
            {matrix.samples.flat().filter(s => s && s.status !== SampleStatus.EMPTY).length}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-600">空孔位</p>
          <p className="text-xl font-semibold text-green-700">
            {matrix.samples.flat().filter(s => !s || s.status === SampleStatus.EMPTY).length}
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-red-600">已过期</p>
          <p className="text-xl font-semibold text-red-700">
            {matrix.samples.flat().filter(s => s && rules.isSampleExpired(s)).length}
          </p>
        </div>
      </div>
    </div>
  )
}
