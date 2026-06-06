import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import type { Freezer, Shelf, Box, Sample, Position, BoxPosition } from '@/types'
import { SampleStatus } from '@/types'
import { rules } from '@/services/rules'
import { generateId, formatDate, addDays } from '@/utils'

type TabType = 'freezers' | 'shelves' | 'boxes' | 'samples'

export const AdminPanel: React.FC = () => {
  const { state, dispatch } = useApp()
  const [activeTab, setActiveTab] = useState<TabType>('freezers')
  const [showAddFreezer, setShowAddFreezer] = useState(false)
  const [showAddShelf, setShowAddShelf] = useState(false)
  const [showAddBox, setShowAddBox] = useState(false)
  const [showAddSample, setShowAddSample] = useState(false)

  const [freezerForm, setFreezerForm] = useState<Partial<Freezer>>({})
  const [shelfForm, setShelfForm] = useState<Partial<Shelf>>({})
  const [boxForm, setBoxForm] = useState<Partial<Box>>({})
  const [sampleForm, setSampleForm] = useState<Partial<Sample>>({})
  const [sampleError, setSampleError] = useState<string | null>(null)

  const handleAddFreezer = () => {
    if (!freezerForm.freezerCode || !freezerForm.freezerName) {
      alert('请填写冰箱编号和名称')
      return
    }
    const freezer: Freezer = {
      id: freezerForm.id || generateId('F'),
      freezerCode: freezerForm.freezerCode,
      freezerName: freezerForm.freezerName,
      location: freezerForm.location || '',
      temperature: freezerForm.temperature || '-80℃',
      description: freezerForm.description
    }
    dispatch({ type: 'ADD_FREEZER', payload: freezer })
    setShowAddFreezer(false)
    setFreezerForm({})
  }

  const handleAddShelf = () => {
    if (!shelfForm.shelfCode || !shelfForm.shelfName || !shelfForm.freezerId) {
      alert('请填写层架信息')
      return
    }
    const shelf: Shelf = {
      id: shelfForm.id || generateId('S'),
      shelfCode: shelfForm.shelfCode,
      shelfName: shelfForm.shelfName,
      freezerId: shelfForm.freezerId,
      description: shelfForm.description
    }
    dispatch({ type: 'ADD_SHELF', payload: shelf })
    setShowAddShelf(false)
    setShelfForm({})
  }

  const handleAddBox = () => {
    if (!boxForm.boxCode || !boxForm.boxName || !boxForm.freezerId || !boxForm.shelfId) {
      alert('请填写冻存盒信息')
      return
    }
    const box: Box = {
      id: boxForm.id || generateId('B'),
      boxCode: boxForm.boxCode,
      boxName: boxForm.boxName,
      freezerId: boxForm.freezerId,
      shelfId: boxForm.shelfId,
      rows: boxForm.rows || 10,
      cols: boxForm.cols || 10,
      description: boxForm.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    dispatch({ type: 'ADD_BOX', payload: box })
    setShowAddBox(false)
    setBoxForm({})
  }

  const handleAddSample = () => {
    setSampleError(null)

    const matrix = sampleForm.boxPosition?.boxId
      ? state.boxMatrices[sampleForm.boxPosition.boxId]
      : null

    const validation = rules.validateNewSample(sampleForm as Sample, matrix)
    if (!validation.valid) {
      setSampleError(validation.error || '样本信息校验失败')
      return
    }

    const sample: Sample = {
      id: generateId('S'),
      sampleCode: sampleForm.sampleCode || '',
      sampleType: sampleForm.sampleType || '',
      projectId: sampleForm.projectId || '',
      projectName: sampleForm.projectName || '',
      position: sampleForm.position as Position,
      boxPosition: sampleForm.boxPosition as BoxPosition,
      status: SampleStatus.OCCUPIED,
      expirationDate: sampleForm.expirationDate || formatDate(addDays(new Date(), 365)),
      collectDate: sampleForm.collectDate || formatDate(new Date()),
      donorId: sampleForm.donorId,
      remarks: sampleForm.remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    dispatch({ type: 'ADD_SAMPLE', payload: sample })
    setShowAddSample(false)
    setSampleForm({})
    setSampleError(null)
  }

  const handleDeleteFreezer = (id: string) => {
    if (confirm('确定删除该冰箱吗？')) {
      dispatch({ type: 'DELETE_FREEZER', payload: id })
    }
  }

  const handleDeleteShelf = (id: string) => {
    if (confirm('确定删除该层架吗？')) {
      dispatch({ type: 'DELETE_SHELF', payload: id })
    }
  }

  const handleDeleteBox = (id: string) => {
    if (confirm('确定删除该冻存盒吗？盒内样本数据也会丢失。')) {
      dispatch({ type: 'DELETE_BOX', payload: id })
    }
  }

  const availableShelves = boxForm.freezerId
    ? state.shelves.filter(s => s.freezerId === boxForm.freezerId)
    : []

  const currentBoxMatrix = sampleForm.boxPosition?.boxId
    ? state.boxMatrices[sampleForm.boxPosition.boxId]
    : null

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="border-b border-gray-200">
        <nav className="flex">
          {(['freezers', 'shelves', 'boxes', 'samples'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'freezers' && '冰箱管理'}
              {tab === 'shelves' && '层架管理'}
              {tab === 'boxes' && '冻存盒管理'}
              {tab === 'samples' && '样本录入'}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'freezers' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">冰箱列表</h3>
              <button
                onClick={() => setShowAddFreezer(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + 添加冰箱
              </button>
            </div>

            {showAddFreezer && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">添加冰箱</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">冰箱编号</label>
                    <input
                      type="text"
                      value={freezerForm.freezerCode || ''}
                      onChange={e => setFreezerForm(prev => ({ ...prev, freezerCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 F001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">冰箱名称</label>
                    <input
                      type="text"
                      value={freezerForm.freezerName || ''}
                      onChange={e => setFreezerForm(prev => ({ ...prev, freezerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 超低温冰箱1号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">位置</label>
                    <input
                      type="text"
                      value={freezerForm.location || ''}
                      onChange={e => setFreezerForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">温度</label>
                    <input
                      type="text"
                      value={freezerForm.temperature || ''}
                      onChange={e => setFreezerForm(prev => ({ ...prev, temperature: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="-80℃"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddFreezer} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存</button>
                  <button onClick={() => { setShowAddFreezer(false); setFreezerForm({}) }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm">取消</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">编号</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">名称</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">位置</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">温度</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">层架数</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {state.freezers.map(f => (
                    <tr key={f.id}>
                      <td className="px-4 py-3 font-mono">{f.freezerCode}</td>
                      <td className="px-4 py-3">{f.freezerName}</td>
                      <td className="px-4 py-3">{f.location || '-'}</td>
                      <td className="px-4 py-3">{f.temperature}</td>
                      <td className="px-4 py-3">{state.shelves.filter(s => s.freezerId === f.id).length}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteFreezer(f.id)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'shelves' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">层架列表</h3>
              <button
                onClick={() => setShowAddShelf(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + 添加层架
              </button>
            </div>

            {showAddShelf && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">添加层架</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">所属冰箱</label>
                    <select
                      value={shelfForm.freezerId || ''}
                      onChange={e => setShelfForm(prev => ({ ...prev, freezerId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">请选择冰箱</option>
                      {state.freezers.map(f => (
                        <option key={f.id} value={f.id}>{f.freezerName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">层架编号</label>
                    <input
                      type="text"
                      value={shelfForm.shelfCode || ''}
                      onChange={e => setShelfForm(prev => ({ ...prev, shelfCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 S01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">层架名称</label>
                    <input
                      type="text"
                      value={shelfForm.shelfName || ''}
                      onChange={e => setShelfForm(prev => ({ ...prev, shelfName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 第1层架"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddShelf} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存</button>
                  <button onClick={() => { setShowAddShelf(false); setShelfForm({}) }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm">取消</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">编号</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">名称</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">所属冰箱</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">冻存盒数</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {state.shelves.map(s => {
                    const freezer = state.freezers.find(f => f.id === s.freezerId)
                    return (
                      <tr key={s.id}>
                        <td className="px-4 py-3 font-mono">{s.shelfCode}</td>
                        <td className="px-4 py-3">{s.shelfName}</td>
                        <td className="px-4 py-3">{freezer?.freezerName || '-'}</td>
                        <td className="px-4 py-3">{state.boxes.filter(b => b.shelfId === s.id).length}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteShelf(s.id)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'boxes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">冻存盒列表</h3>
              <button
                onClick={() => setShowAddBox(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + 添加冻存盒
              </button>
            </div>

            {showAddBox && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">添加冻存盒</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">所属冰箱</label>
                    <select
                      value={boxForm.freezerId || ''}
                      onChange={e => setBoxForm(prev => ({ ...prev, freezerId: e.target.value, shelfId: undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">请选择冰箱</option>
                      {state.freezers.map(f => (
                        <option key={f.id} value={f.id}>{f.freezerName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">所属层架</label>
                    <select
                      value={boxForm.shelfId || ''}
                      onChange={e => setBoxForm(prev => ({ ...prev, shelfId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      disabled={!boxForm.freezerId}
                    >
                      <option value="">请选择层架</option>
                      {availableShelves.map(s => (
                        <option key={s.id} value={s.id}>{s.shelfName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">盒号</label>
                    <input
                      type="text"
                      value={boxForm.boxCode || ''}
                      onChange={e => setBoxForm(prev => ({ ...prev, boxCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 B001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">盒名称</label>
                    <input
                      type="text"
                      value={boxForm.boxName || ''}
                      onChange={e => setBoxForm(prev => ({ ...prev, boxName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">行数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={boxForm.rows || 10}
                      onChange={e => setBoxForm(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">列数</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={boxForm.cols || 10}
                      onChange={e => setBoxForm(prev => ({ ...prev, cols: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddBox} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存</button>
                  <button onClick={() => { setShowAddBox(false); setBoxForm({}) }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm">取消</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">盒号</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">名称</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">位置</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">规格</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">样本数</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {state.boxes.map(b => {
                    const freezer = state.freezers.find(f => f.id === b.freezerId)
                    const shelf = state.shelves.find(s => s.id === b.shelfId)
                    const matrix = state.boxMatrices[b.id]
                    const sampleCount = matrix
                      ? matrix.samples.flat().filter(s => s && s.status !== SampleStatus.EMPTY).length
                      : 0
                    return (
                      <tr key={b.id}>
                        <td className="px-4 py-3 font-mono">{b.boxCode}</td>
                        <td className="px-4 py-3">{b.boxName}</td>
                        <td className="px-4 py-3">
                          {freezer?.freezerCode} / {shelf?.shelfCode}
                        </td>
                        <td className="px-4 py-3">{b.rows} × {b.cols}</td>
                        <td className="px-4 py-3">{sampleCount}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteBox(b.id)} className="text-red-600 hover:text-red-800 text-xs">删除</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'samples' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">样本录入</h3>
              <button
                onClick={() => setShowAddSample(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                + 新增样本
              </button>
            </div>

            {showAddSample && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-3">录入新样本</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">样本编号 *</label>
                    <input
                      type="text"
                      value={sampleForm.sampleCode || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, sampleCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="唯一编号"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">样本类型 *</label>
                    <input
                      type="text"
                      value={sampleForm.sampleType || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, sampleType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="如 血清、血浆"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">项目ID *</label>
                    <input
                      type="text"
                      value={sampleForm.projectId || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, projectId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">项目名称 *</label>
                    <input
                      type="text"
                      value={sampleForm.projectName || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, projectName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">冻存盒 *</label>
                    <select
                      value={sampleForm.boxPosition?.boxId || ''}
                      onChange={e => {
                        const box = state.boxes.find(b => b.id === e.target.value)
                        setSampleForm(prev => ({
                          ...prev,
                          boxPosition: box
                            ? {
                                freezerId: box.freezerId,
                                shelfId: box.shelfId,
                                boxId: box.id
                              }
                            : undefined,
                          position: undefined
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">请选择冻存盒</option>
                      {state.boxes.map(b => (
                        <option key={b.id} value={b.id}>{b.boxName}</option>
                      ))}
                    </select>
                  </div>
                  {currentBoxMatrix && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">行 (A-{String.fromCharCode(65 + currentBoxMatrix.rows - 1)})</label>
                        <select
                          value={sampleForm.position?.row !== undefined ? sampleForm.position.row : ''}
                          onChange={e => {
                            const val = e.target.value === '' ? undefined : parseInt(e.target.value)
                            setSampleForm(prev => ({
                              ...prev,
                              position: val !== undefined
                                ? { ...prev.position, row: val } as Position
                                : undefined
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="">选择行</option>
                          {Array.from({ length: currentBoxMatrix.rows }).map((_, i) => {
                            const occupied = currentBoxMatrix.samples[i].some(s => s && s.status !== SampleStatus.EMPTY)
                            return (
                              <option key={i} value={i} disabled={false}>
                                {String.fromCharCode(65 + i)} {occupied ? '(有样本)' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">列</label>
                        <select
                          value={sampleForm.position?.col !== undefined ? sampleForm.position.col : ''}
                          onChange={e => {
                            const val = e.target.value === '' ? undefined : parseInt(e.target.value)
                            setSampleForm(prev => ({
                              ...prev,
                              position: val !== undefined
                                ? { ...prev.position, col: val } as Position
                                : undefined
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={sampleForm.position?.row === undefined}
                        >
                          <option value="">选择列</option>
                          {sampleForm.position?.row !== undefined &&
                            Array.from({ length: currentBoxMatrix.cols }).map((_, i) => {
                              const cell = currentBoxMatrix.samples[sampleForm.position!.row][i]
                              const isOccupied = !!(cell && cell.status !== SampleStatus.EMPTY)
                              return (
                                <option key={i} value={i} disabled={isOccupied}>
                                  {i + 1} {isOccupied ? '(已占用)' : ''}
                                </option>
                              )
                            })}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">有效期 *</label>
                    <input
                      type="date"
                      value={sampleForm.expirationDate || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">采集日期</label>
                    <input
                      type="date"
                      value={sampleForm.collectDate || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, collectDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">供体编号</label>
                    <input
                      type="text"
                      value={sampleForm.donorId || ''}
                      onChange={e => setSampleForm(prev => ({ ...prev, donorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {sampleError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {sampleError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleAddSample} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存</button>
                  <button onClick={() => { setShowAddSample(false); setSampleForm({}); setSampleError(null) }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm">取消</button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">
              共 {state.samples.length} 个样本
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
