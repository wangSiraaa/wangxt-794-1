import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { DashboardGroup as DashboardGroupType } from '@/types'

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16'
]

export const DashboardGroup: React.FC = () => {
  const { state, addDashboardGroup, updateDashboardGroup, deleteDashboardGroup, setActiveDashboardGroup } = useApp()
  const [isCreating, setIsCreating] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DashboardGroupType | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupColor, setNewGroupColor] = useState(COLORS[0])
  const [selectedBoxIds, setSelectedBoxIds] = useState<string[]>([])

  const resetForm = () => {
    setNewGroupName('')
    setNewGroupColor(COLORS[0])
    setSelectedBoxIds([])
    setIsCreating(false)
    setEditingGroup(null)
  }

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return
    addDashboardGroup(newGroupName.trim(), newGroupColor, selectedBoxIds)
    resetForm()
  }

  const handleUpdateGroup = () => {
    if (!editingGroup || !newGroupName.trim()) return
    updateDashboardGroup(editingGroup.id, newGroupName.trim(), newGroupColor, selectedBoxIds)
    resetForm()
  }

  const handleEditGroup = (group: DashboardGroupType) => {
    setEditingGroup(group)
    setNewGroupName(group.name)
    setNewGroupColor(group.color)
    setSelectedBoxIds(group.boxIds)
    setIsCreating(false)
  }

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('确定要删除此看板分组吗？')) {
      deleteDashboardGroup(groupId)
    }
  }

  const toggleBoxSelection = (boxId: string) => {
    setSelectedBoxIds(prev =>
      prev.includes(boxId)
        ? prev.filter(id => id !== boxId)
        : [...prev, boxId]
    )
  }

  const getGroupStats = (group: DashboardGroupType) => {
    const groupBoxes = state.boxes.filter(b => group.boxIds.includes(b.id))
    let totalSamples = 0
    let expiredSamples = 0
    groupBoxes.forEach(box => {
      const matrix = state.boxMatrices[box.id]
      if (matrix) {
        const samples = matrix.samples.flat().filter(Boolean)
        totalSamples += samples.length
        expiredSamples += samples.filter(s => {
          if (!s) return false
          return new Date(s.expirationDate) < new Date()
        }).length
      }
    })
    return { boxCount: groupBoxes.length, totalSamples, expiredSamples }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">看板分组</h3>
        {!isCreating && !editingGroup && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + 新建分组
          </button>
        )}
      </div>

      {(isCreating || editingGroup) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {editingGroup ? '编辑分组' : '新建分组'}
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分组名称</label>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="请输入分组名称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分组颜色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newGroupColor === color ? 'border-gray-800 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择冻存盒 ({selectedBoxIds.length} 个已选)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
                {state.boxes.map(box => (
                  <label
                    key={box.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoxIds.includes(box.id)}
                      onChange={() => toggleBoxSelection(box.id)}
                      className="rounded text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      {box.boxCode} - {box.boxName}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {editingGroup ? '保存修改' : '创建分组'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => setActiveDashboardGroup(null)}
          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
            state.activeDashboardGroupId === null
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">全部冻存盒</p>
              <p className="text-xs text-gray-500">
                {state.boxes.length} 个冻存盒 · {state.samples.length} 个样本
              </p>
            </div>
          </div>
        </button>

        {state.dashboardGroups.map(group => {
          const stats = getGroupStats(group)
          const isActive = state.activeDashboardGroupId === group.id
          return (
            <div
              key={group.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{group.name}</p>
                  <p className="text-xs text-gray-500">
                    {stats.boxCount} 个冻存盒 · {stats.totalSamples} 个样本
                    {stats.expiredSamples > 0 && (
                      <span className="text-red-500 ml-1">· {stats.expiredSamples} 个过期</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveDashboardGroup(group.id)}
                className="mt-2 w-full text-center text-sm py-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {isActive ? '当前选中' : '切换到此分组'}
              </button>
            </div>
          )
        })}

        {state.dashboardGroups.length === 0 && !isCreating && (
          <div className="text-center py-8 text-gray-500">
            <p>暂无看板分组</p>
            <p className="text-sm mt-1">点击"新建分组"创建您的第一个分组</p>
          </div>
        )}
      </div>
    </div>
  )
}
