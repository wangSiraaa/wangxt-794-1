import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import type { Sample } from '@/types'
import { rules } from '@/services/rules'
import { getRowLabel, getColLabel } from '@/utils'

interface MoveSampleModalProps {
  sample: Sample
  onClose: () => void
  onSuccess?: () => void
}

export const MoveSampleModal: React.FC<MoveSampleModalProps> = ({
  sample,
  onClose,
  onSuccess
}) => {
  const { state, dispatch } = useApp()
  const [targetFreezerId, setTargetFreezerId] = useState('')
  const [targetShelfId, setTargetShelfId] = useState('')
  const [targetBoxId, setTargetBoxId] = useState('')
  const [targetRow, setTargetRow] = useState<number | null>(null)
  const [targetCol, setTargetCol] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const availableShelves = useMemo(() => {
    return targetFreezerId ? state.shelves.filter(s => s.freezerId === targetFreezerId) : []
  }, [targetFreezerId, state.shelves])

  const availableBoxes = useMemo(() => {
    return targetShelfId ? state.boxes.filter(b => b.shelfId === targetShelfId) : []
  }, [targetShelfId, state.boxes])

  const targetMatrix = targetBoxId ? state.boxMatrices[targetBoxId] : null
  const targetBox = targetBoxId ? state.boxes.find(b => b.id === targetBoxId) : null

  const isTargetOccupied = useMemo(() => {
    if (!targetMatrix || targetRow === null || targetCol === null) return false
    return rules.validatePositionOccupied({ row: targetRow, col: targetCol }, targetMatrix)
  }, [targetMatrix, targetRow, targetCol])

  const isSamePosition = useMemo(() => {
    return sample.boxPosition.boxId === targetBoxId &&
      sample.position.row === targetRow &&
      sample.position.col === targetCol
  }, [sample, targetBoxId, targetRow, targetCol])

  const canMove = useMemo(() => {
    return targetBoxId && targetRow !== null && targetCol !== null && !isTargetOccupied && !isSamePosition
  }, [targetBoxId, targetRow, targetCol, isTargetOccupied, isSamePosition])

  const handleMove = () => {
    if (!canMove || targetRow === null || targetCol === null) return
    setLoading(true)
    setError(null)
    try {
      dispatch({
        type: 'MOVE_SAMPLE',
        payload: {
          sampleId: sample.id,
          toBoxId: targetBoxId,
          toPosition: { row: targetRow, col: targetCol },
          operator: 'admin'
        }
      })
      setTimeout(() => {
        setLoading(false)
        onSuccess?.()
        onClose()
      }, 500)
    } catch (e) {
      setError(e instanceof Error ? e.message : '移动失败')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">移动样本</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-medium">当前样本:</span> {sample.sampleCode}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <span className="font-medium">当前位置:</span>{' '}
              {rules.getPositionLabel(sample.boxPosition, sample.position)}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标冰箱 *</label>
              <select
                value={targetFreezerId}
                onChange={e => {
                  setTargetFreezerId(e.target.value)
                  setTargetShelfId('')
                  setTargetBoxId('')
                  setTargetRow(null)
                  setTargetCol(null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">选择冰箱</option>
                {state.freezers.map(f => (
                  <option key={f.id} value={f.id}>{f.freezerCode} - {f.freezerName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标层架 *</label>
              <select
                value={targetShelfId}
                onChange={e => {
                  setTargetShelfId(e.target.value)
                  setTargetBoxId('')
                  setTargetRow(null)
                  setTargetCol(null)
                }}
                disabled={!targetFreezerId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">选择层架</option>
                {availableShelves.map(s => (
                  <option key={s.id} value={s.id}>{s.shelfCode} - {s.shelfName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标冻存盒 *</label>
              <select
                value={targetBoxId}
                onChange={e => {
                  setTargetBoxId(e.target.value)
                  setTargetRow(null)
                  setTargetCol(null)
                }}
                disabled={!targetShelfId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">选择冻存盒</option>
                {availableBoxes.map(b => (
                  <option key={b.id} value={b.id}>{b.boxCode} - {b.boxName}</option>
                ))}
              </select>
            </div>
          </div>

          {targetMatrix && targetBox && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择目标孔位 *</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-auto">
                <table className="border-collapse mx-auto">
                  <thead>
                    <tr>
                      <th className="w-8 h-8"></th>
                      {Array.from({ length: targetMatrix.cols }).map((_, i) => (
                        <th key={i} className="w-8 h-8 text-center text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300">
                          {getColLabel(i)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: targetMatrix.rows }).map((_, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="w-8 h-8 text-center text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300">
                          {getRowLabel(rowIdx)}
                        </td>
                        {Array.from({ length: targetMatrix.cols }).map((_, colIdx) => {
                          const cell = targetMatrix.samples[rowIdx]?.[colIdx]
                          const isOccupied = cell && cell.status !== 'empty'
                          const isSelected = targetRow === rowIdx && targetCol === colIdx
                          const isCurrent = sample.boxPosition.boxId === targetBoxId &&
                            sample.position.row === rowIdx &&
                            sample.position.col === colIdx
                          return (
                            <td key={colIdx}>
                              <button
                                disabled={!!isOccupied && !isCurrent}
                                onClick={() => {
                                  if (!isOccupied || isCurrent) {
                                    setTargetRow(rowIdx)
                                    setTargetCol(colIdx)
                                  }
                                }}
                                className={`w-8 h-8 border border-gray-300 flex items-center justify-center text-[10px] font-medium transition-all ${
                                  isCurrent ? 'bg-yellow-100 border-yellow-400 cursor-not-allowed' :
                                  isSelected ? 'bg-blue-500 text-white border-blue-600 ring-2 ring-blue-300' :
                                  isOccupied ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                                  'bg-white hover:bg-blue-50 cursor-pointer'
                                }`}
                                title={isCurrent ? '当前位置' : isOccupied ? `已占用: ${cell?.sampleCode}` : `孔位 ${getRowLabel(rowIdx)}${getColLabel(colIdx)}: 空`}
                              >
                                {isCurrent && '📍'}
                                {isOccupied && !isCurrent && '✕'}
                                {!isOccupied && isSelected && '✓'}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isSamePosition && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              目标位置与当前位置相同，无需移动
            </div>
          )}

          {isTargetOccupied && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              该孔位已被占用，请选择其他孔位
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {targetBoxId && targetRow !== null && targetCol !== null && !isTargetOccupied && !isSamePosition && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">目标位置确认</p>
              <p className="text-sm text-green-700 mt-1 font-mono">
                {rules.getPositionLabel(
                  { freezerId: targetBox?.freezerId || "", shelfId: targetBox?.shelfId || "", boxId: targetBoxId },
                  { row: targetRow, col: targetCol }
                )}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleMove}
            disabled={!canMove || loading}
            className={`px-5 py-2 rounded-md ${
              canMove && !loading ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? '移动中...' : '确认移动'}
          </button>
        </div>
      </div>
    </div>
  )
}
