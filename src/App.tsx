import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { BoxMatrixView } from './components/BoxMatrixView'
import { SearchPanel } from './components/SearchPanel'
import { SampleDetail } from './components/SampleDetail'
import { AdminPanel } from './components/AdminPanel'
import { PrintQueuePanel } from './components/PrintQueuePanel'
import { UserRole } from './types'
import type { Sample } from './types'

type ViewType = 'search' | 'admin' | 'print'

const MainContent: React.FC = () => {
  const { state, dispatch } = useApp()
  const [activeView, setActiveView] = useState<ViewType>('search')

  const handleCellClick = (sample: Sample | null, _row: number, _col: number) => {
    dispatch({ type: 'SELECT_SAMPLE', payload: sample })
  }

  const handleRoleChange = (role: UserRole) => {
    dispatch({ type: 'SET_ROLE', payload: role })
  }

  const roleConfig = {
    [UserRole.ADMIN]: { label: '管理员', views: ['search', 'admin', 'print'] as ViewType[] },
    [UserRole.RESEARCHER]: { label: '科研人员', views: ['search', 'print'] as ViewType[] },
    [UserRole.PRINTER]: { label: '打印人员', views: ['print'] as ViewType[] }
  }

  const availableViews = roleConfig[state.currentRole].views

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">生物样本库盒位查询系统</h1>
              <p className="text-sm text-gray-500 mt-1">BioSample Box Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">角色切换:</span>
                <select
                  value={state.currentRole}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.ADMIN}>管理员</option>
                  <option value={UserRole.RESEARCHER}>科研人员</option>
                  <option value={UserRole.PRINTER}>打印人员</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                当前: <span className="font-medium text-blue-600">{roleConfig[state.currentRole].label}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {availableViews.includes('search') && (
              <button
                onClick={() => setActiveView('search')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                搜索查询
              </button>
            )}
            {availableViews.includes('admin') && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                管理维护
              </button>
            )}
            {availableViews.includes('print') && (
              <button
                onClick={() => setActiveView('print')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'print'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                打印队列
                {state.printQueue.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {state.printQueue.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SearchPanel />

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">盒位矩阵</h3>

                <div className="mb-4 flex gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">冰箱</label>
                    <select
                      value={
                        state.selectedBoxId
                          ? state.boxes.find(b => b.id === state.selectedBoxId)?.freezerId || ''
                          : ''
                      }
                      onChange={e => {
                        const freezerId = e.target.value
                        const firstBox = state.boxes.find(b => b.freezerId === freezerId)
                        if (firstBox) {
                          dispatch({ type: 'SELECT_BOX', payload: firstBox.id })
                        } else {
                          dispatch({ type: 'SELECT_BOX', payload: null })
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择冰箱</option>
                      {state.freezers.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.freezerName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {state.selectedBoxId && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">层架</label>
                      <select
                        value={
                          state.selectedBoxId
                            ? state.boxes.find(b => b.id === state.selectedBoxId)?.shelfId || ''
                            : ''
                        }
                        onChange={e => {
                          const shelfId = e.target.value
                          const firstBox = state.boxes.find(b => b.shelfId === shelfId)
                          if (firstBox) {
                            dispatch({ type: 'SELECT_BOX', payload: firstBox.id })
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择层架</option>
                        {state.shelves
                          .filter(
                            s =>
                              s.freezerId ===
                              state.boxes.find(b => b.id === state.selectedBoxId)?.freezerId
                          )
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              {s.shelfName}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">冻存盒</label>
                    <select
                      value={state.selectedBoxId || ''}
                      onChange={e => dispatch({ type: 'SELECT_BOX', payload: e.target.value || null })}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择冻存盒</option>
                      {state.boxes.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.boxCode} - {b.boxName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {state.selectedBoxId ? (
                  <BoxMatrixView boxId={state.selectedBoxId} onCellClick={handleCellClick} />
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">请选择一个冻存盒查看盒位矩阵</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="sticky top-6">
                <SampleDetail
                  sample={state.selectedSample}
                  onClose={() => dispatch({ type: 'SELECT_SAMPLE', payload: null })}
                />

                {state.printQueue.length > 0 && (
                  <div className="mt-6">
                    <PrintQueuePanel />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'admin' && <AdminPanel />}

        {activeView === 'print' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PrintQueuePanel />
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">使用说明</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="font-medium text-blue-800 mb-2">如何添加样本到打印队列？</p>
                  <p>1. 切换到"搜索查询"视图</p>
                  <p>2. 搜索或在盒位矩阵中点击样本</p>
                  <p>3. 在样本详情中点击"添加到打印队列"</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="font-medium text-green-800 mb-2">打印规则</p>
                  <p>• 同一样本在队列中只会保留一份</p>
                  <p>• 可以设置打印份数</p>
                  <p>• 支持导出CSV和打印标签文本</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="font-medium text-purple-800 mb-2">标签内容</p>
                  <p>• 样本编号</p>
                  <p>• 样本类型和项目名称</p>
                  <p>• 盒位坐标</p>
                  <p>• 有效期和二维码数据</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>生物样本库盒位查询系统 © {new Date().getFullYear()}</p>
            <p className="mt-1">浏览器本地存储: 盒位矩阵、编号索引、状态筛选、过期提示、定位动画、打印队列、最近查询</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}

export default App
