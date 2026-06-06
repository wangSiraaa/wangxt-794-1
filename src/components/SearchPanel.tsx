import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import type { SearchFilters, Sample } from '@/types'
import { SampleStatus } from '@/types'
import { rules } from '@/services/rules'
import { getRowLabel, getDaysUntilExpiration } from '@/utils'

interface SearchPanelProps {
  onSearch?: (results: Sample[]) => void
  onSelectSample?: (sample: Sample) => void
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  onSelectSample
}) => {
  const { state, searchSamples, locateSample } = useApp()
  const [filters, setFilters] = useState<SearchFilters>({
    expirationStatus: 'all',
    status: 'all'
  })
  const [results, setResults] = useState<Sample[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const projectOptions = useMemo(() => {
    const projects = new Map<string, string>()
    state.samples.forEach(s => {
      projects.set(s.projectId, s.projectName)
    })
    return Array.from(projects.entries()).map(([id, name]) => ({ id, name }))
  }, [state.samples])

  const sampleTypeOptions = useMemo(() => {
    return Array.from(new Set(state.samples.map(s => s.sampleType)))
  }, [state.samples])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePositionChange = (type: 'row' | 'col', value: string) => {
    const numValue = value === '' ? undefined : parseInt(value)
    setFilters(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [type]: numValue
      }
    }))
  }

  const handleSearch = () => {
    const searchResults = searchSamples(filters)
    setResults(searchResults)
    setHasSearched(true)
    onSearch?.(searchResults)
  }

  const handleReset = () => {
    setFilters({
      expirationStatus: 'all',
      status: 'all'
    })
    setResults([])
    setHasSearched(false)
  }

  const handleLocate = (sample: Sample) => {
    locateSample(sample.id)
    onSelectSample?.(sample)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">样本搜索</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            关键词搜索
          </label>
          <input
            type="text"
            placeholder="样本编号、项目、供体..."
            value={filters.keyword || ''}
            onChange={e => handleFilterChange('keyword', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            所属项目
          </label>
          <select
            value={filters.projectId || ''}
            onChange={e => handleFilterChange('projectId', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部项目</option>
            {projectOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            样本类型
          </label>
          <select
            value={filters.sampleType || ''}
            onChange={e => handleFilterChange('sampleType', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            {sampleTypeOptions.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            过期状态
          </label>
          <select
            value={filters.expirationStatus || 'all'}
            onChange={e => handleFilterChange('expirationStatus', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value="valid">有效</option>
            <option value="expired">已过期</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            使用状态
          </label>
          <select
            value={filters.status || 'all'}
            onChange={e => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部</option>
            <option value={SampleStatus.OCCUPIED}>正常</option>
            <option value={SampleStatus.EXPIRED}>已过期</option>
            <option value={SampleStatus.USED}>已使用</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            冻存架
          </label>
          <select
            value={filters.freezerId || ''}
            onChange={e => handleFilterChange('freezerId', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部</option>
            {state.freezers.map(f => (
              <option key={f.id} value={f.id}>
                {f.freezerName}
              </option>
            ))}
          </select>
        </div>

        {filters.freezerId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              层架
            </label>
            <select
              value={filters.shelfId || ''}
              onChange={e => handleFilterChange('shelfId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {state.shelves
                .filter(s => s.freezerId === filters.freezerId)
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.shelfName}
                  </option>
                ))}
            </select>
          </div>
        )}

        {filters.shelfId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              冻存盒
            </label>
            <select
              value={filters.boxId || ''}
              onChange={e => handleFilterChange('boxId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {state.boxes
                .filter(b => b.shelfId === filters.shelfId)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.boxName}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            行 (A, B, C...)
          </label>
          <input
            type="text"
            placeholder="行号"
            value={
              filters.position?.row !== undefined
                ? getRowLabel(filters.position.row)
                : ''
            }
            onChange={e => {
              const val = e.target.value.toUpperCase()
              if (val === '') {
                handlePositionChange('row', '')
              } else if (/^[A-Z]$/.test(val)) {
                handlePositionChange('row', String(val.charCodeAt(0) - 65))
              }
            }}
            maxLength={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            列 (1, 2, 3...)
          </label>
          <input
            type="number"
            min="1"
            placeholder="列号"
            value={
              filters.position?.col !== undefined
                ? filters.position.col + 1
                : ''
            }
            onChange={e => {
              const val = e.target.value
              if (val === '') {
                handlePositionChange('col', '')
              } else {
                const num = parseInt(val)
                if (!isNaN(num) && num >= 1) {
                  handlePositionChange('col', String(num - 1))
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          搜索
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
        >
          重置
        </button>
      </div>

      {hasSearched && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-800">
              搜索结果 <span className="text-blue-600">({results.length} 条)</span>
            </h3>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">没有找到匹配的样本</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">样本编号</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">类型</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">项目</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">位置</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">有效期</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {results.map(sample => {
                    const daysLeft = getDaysUntilExpiration(sample.expirationDate)
                    const isExpired = rules.isSampleExpired(sample)
                    return (
                      <tr key={sample.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{sample.sampleCode}</td>
                        <td className="px-4 py-3">{sample.sampleType}</td>
                        <td className="px-4 py-3">{sample.projectName}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {rules.getPositionLabel(sample.boxPosition, sample.position)}
                        </td>
                        <td className={`px-4 py-3 ${isExpired ? 'text-red-600 font-medium' : ''}`}>
                          {sample.expirationDate}
                          {isExpired && <span className="ml-1 text-xs">(已过期)</span>}
                          {!isExpired && daysLeft <= 30 && (
                            <span className="ml-1 text-xs text-orange-600">
                              ({daysLeft}天后过期)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
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
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleLocate(sample)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            定位
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {state.recentQueries.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">最近查询</h3>
          <div className="flex flex-wrap gap-2">
            {state.recentQueries.slice(0, 5).map(query => (
              <button
                key={query.id}
                onClick={() => {
                  setFilters(query.filters)
                  handleSearch()
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {query.filters.keyword || query.filters.projectId || '全部样本'} ({query.resultCount}条)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
