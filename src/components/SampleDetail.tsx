import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Sample } from '@/types'
import { SampleStatus, UserRole } from '@/types'
import { rules } from '@/services/rules'

interface SampleDetailProps {
  sample: Sample | null
  onClose: () => void
}

export const SampleDetail: React.FC<SampleDetailProps> = ({ sample, onClose }) => {
  const { state, dispatch } = useApp()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Sample>>({})
  const [error, setError] = useState<string | null>(null)

  if (!sample) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">请选择一个样本查看详情</p>
      </div>
    )
  }

  const isExpired = rules.isSampleExpired(sample)

  const handleEdit = () => {
    setEditForm({ ...sample })
    setIsEditing(true)
    setError(null)
  }

  const handleSave = () => {
    if (!editForm.sampleCode || !editForm.sampleType || !editForm.projectId) {
      setError('请填写必填字段')
      return
    }

    const updated: Sample = {
      ...sample,
      ...editForm,
      updatedAt: new Date().toISOString()
    }

    dispatch({ type: 'UPDATE_SAMPLE', payload: updated })
    dispatch({ type: 'SELECT_SAMPLE', payload: updated })
    setIsEditing(false)
    setError(null)
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个样本吗？此操作不可恢复。')) {
      dispatch({ type: 'DELETE_SAMPLE', payload: sample.id })
      onClose()
    }
  }

  const handleAddToPrintQueue = () => {
    dispatch({ type: 'ADD_TO_PRINT_QUEUE', payload: { sample } })
  }

  const handleMarkUsed = () => {
    const updated: Sample = {
      ...sample,
      status: SampleStatus.USED,
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'UPDATE_SAMPLE', payload: updated })
    dispatch({ type: 'SELECT_SAMPLE', payload: updated })
  }

  const canEdit = state.currentRole === UserRole.ADMIN

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">样本详情</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      <div className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                样本编号 *
              </label>
              <input
                type="text"
                value={editForm.sampleCode || ''}
                onChange={e => setEditForm(prev => ({ ...prev, sampleCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                样本类型 *
              </label>
              <input
                type="text"
                value={editForm.sampleType || ''}
                onChange={e => setEditForm(prev => ({ ...prev, sampleType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目名称 *
              </label>
              <input
                type="text"
                value={editForm.projectName || ''}
                onChange={e => setEditForm(prev => ({ ...prev, projectName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                有效期 *
              </label>
              <input
                type="date"
                value={editForm.expirationDate || ''}
                onChange={e => setEditForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                供体编号
              </label>
              <input
                type="text"
                value={editForm.donorId || ''}
                onChange={e => setEditForm(prev => ({ ...prev, donorId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={editForm.remarks || ''}
                onChange={e => setEditForm(prev => ({ ...prev, remarks: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center pb-4 border-b border-gray-100">
              <p className="text-2xl font-mono font-bold text-gray-800">{sample.sampleCode}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                  isExpired
                    ? 'bg-red-100 text-red-700'
                    : sample.status === SampleStatus.USED
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {isExpired
                  ? '已过期'
                  : sample.status === SampleStatus.USED
                  ? '已使用'
                  : '正常'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">样本类型</p>
                <p className="font-medium text-gray-800">{sample.sampleType}</p>
              </div>
              <div>
                <p className="text-gray-500">所属项目</p>
                <p className="font-medium text-gray-800">{sample.projectName}</p>
              </div>
              <div>
                <p className="text-gray-500">存放位置</p>
                <p className="font-medium text-gray-800 font-mono">
                  {rules.getPositionLabel(sample.boxPosition, sample.position)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">供体编号</p>
                <p className="font-medium text-gray-800">{sample.donorId || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">采集日期</p>
                <p className="font-medium text-gray-800">{sample.collectDate}</p>
              </div>
              <div>
                <p className="text-gray-500">有效期</p>
                <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-800'}`}>
                  {sample.expirationDate}
                </p>
              </div>
            </div>

            {sample.remarks && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-sm mb-1">备注</p>
                <p className="text-gray-800">{sample.remarks}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
              <p>创建时间: {sample.createdAt}</p>
              <p>更新时间: {sample.updatedAt}</p>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            {state.currentRole !== UserRole.PRINTER && (
              <button
                onClick={handleAddToPrintQueue}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                添加到打印队列
              </button>
            )}

            {canEdit && sample.status !== SampleStatus.USED && (
              <button
                onClick={handleMarkUsed}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                标记为已使用
              </button>
            )}

            {canEdit && (
              <>
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  编辑样本信息
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  删除样本
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
