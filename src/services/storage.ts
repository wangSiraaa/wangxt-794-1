import type {
  LocalStorageData,
  Freezer,
  Shelf,
  Box,
  Sample,
  BoxMatrix,
  PrintQueueItem,
  RecentQuery,
  MoveRecord,
  SearchFilters,
  DashboardGroup
} from '@/types'

const STORAGE_KEY = 'biosample_box_query_data'

const getDefaultData = (): LocalStorageData => ({
  freezers: [],
  shelves: [],
  boxes: [],
  samples: [],
  moveRecords: [],
  boxMatrices: {},
  sampleCodeIndex: {},
  printQueue: [],
  recentQueries: [],
  dashboardGroups: [],
  activeDashboardGroupId: null
})

export const storage = {
  load(): LocalStorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (e) {
      console.error('Failed to load data from localStorage:', e)
    }
    return getDefaultData()
  },

  save(data: LocalStorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save data to localStorage:', e)
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },

  getFreezers(): Freezer[] {
    return this.load().freezers
  },

  saveFreezers(freezers: Freezer[]): void {
    const data = this.load()
    data.freezers = freezers
    this.save(data)
  },

  getShelves(): Shelf[] {
    return this.load().shelves
  },

  saveShelves(shelves: Shelf[]): void {
    const data = this.load()
    data.shelves = shelves
    this.save(data)
  },

  getBoxes(): Box[] {
    return this.load().boxes
  },

  saveBoxes(boxes: Box[]): void {
    const data = this.load()
    data.boxes = boxes
    this.save(data)
  },

  getSamples(): Sample[] {
    return this.load().samples
  },

  saveSamples(samples: Sample[]): void {
    const data = this.load()
    data.samples = samples
    data.sampleCodeIndex = this.buildSampleCodeIndex(samples)
    this.save(data)
  },

  buildSampleCodeIndex(samples: Sample[]): Record<string, string> {
    const index: Record<string, string> = {}
    samples.forEach(s => {
      index[s.sampleCode] = s.id
    })
    return index
  },

  getBoxMatrices(): Record<string, BoxMatrix> {
    return this.load().boxMatrices
  },

  getBoxMatrix(boxId: string): BoxMatrix | null {
    return this.load().boxMatrices[boxId] || null
  },

  saveBoxMatrix(matrix: BoxMatrix): void {
    const data = this.load()
    data.boxMatrices[matrix.boxId] = matrix
    this.save(data)
  },

  getMoveRecords(): MoveRecord[] {
    return this.load().moveRecords
  },

  saveMoveRecords(records: MoveRecord[]): void {
    const data = this.load()
    data.moveRecords = records
    this.save(data)
  },

  getPrintQueue(): PrintQueueItem[] {
    return this.load().printQueue
  },

  savePrintQueue(queue: PrintQueueItem[]): void {
    const data = this.load()
    data.printQueue = queue
    this.save(data)
  },

  getRecentQueries(): RecentQuery[] {
    return this.load().recentQueries
  },

  saveRecentQuery(query: RecentQuery): void {
    const data = this.load()
    data.recentQueries = [query, ...data.recentQueries].slice(0, 20)
    this.save(data)
  },

  getDashboardGroups(): DashboardGroup[] {
    return this.load().dashboardGroups
  },

  saveDashboardGroups(groups: DashboardGroup[]): void {
    const data = this.load()
    data.dashboardGroups = groups
    this.save(data)
  },

  getActiveDashboardGroupId(): string | null {
    return this.load().activeDashboardGroupId
  },

  saveActiveDashboardGroupId(groupId: string | null): void {
    const data = this.load()
    data.activeDashboardGroupId = groupId
    this.save(data)
  },

  addDashboardGroup(group: DashboardGroup): void {
    const data = this.load()
    data.dashboardGroups = [...data.dashboardGroups, group]
    this.save(data)
  },

  updateDashboardGroup(group: DashboardGroup): void {
    const data = this.load()
    data.dashboardGroups = data.dashboardGroups.map(g =>
      g.id === group.id ? group : g
    )
    this.save(data)
  },

  deleteDashboardGroup(groupId: string): void {
    const data = this.load()
    data.dashboardGroups = data.dashboardGroups.filter(g => g.id !== groupId)
    if (data.activeDashboardGroupId === groupId) {
      data.activeDashboardGroupId = null
    }
    this.save(data)
  },

  findSampleByCode(sampleCode: string): Sample | null {
    const data = this.load()
    const sampleId = data.sampleCodeIndex[sampleCode]
    if (sampleId) {
      return data.samples.find(s => s.id === sampleId) || null
    }
    return data.samples.find(s => s.sampleCode === sampleCode) || null
  },

  searchSamples(filters: SearchFilters): Sample[] {
    const data = this.load()
    let samples = [...data.samples]

    if (filters.projectId) {
      samples = samples.filter(s => s.projectId === filters.projectId)
    }

    if (filters.sampleType) {
      samples = samples.filter(s => s.sampleType === filters.sampleType)
    }

    if (filters.status && filters.status !== 'all') {
      samples = samples.filter(s => s.status === filters.status)
    }

    if (filters.expirationStatus) {
      const now = new Date()
      if (filters.expirationStatus === 'expired') {
        samples = samples.filter(s => new Date(s.expirationDate) < now)
      } else if (filters.expirationStatus === 'valid') {
        samples = samples.filter(s => new Date(s.expirationDate) >= now)
      }
    }

    if (filters.freezerId) {
      samples = samples.filter(s => s.boxPosition.freezerId === filters.freezerId)
    }

    if (filters.shelfId) {
      samples = samples.filter(s => s.boxPosition.shelfId === filters.shelfId)
    }

    if (filters.boxId) {
      samples = samples.filter(s => s.boxPosition.boxId === filters.boxId)
    }

    if (filters.position?.row !== undefined) {
      samples = samples.filter(s => s.position.row === filters.position?.row)
    }

    if (filters.position?.col !== undefined) {
      samples = samples.filter(s => s.position.col === filters.position?.col)
    }

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      samples = samples.filter(s =>
        s.sampleCode.toLowerCase().includes(kw) ||
        s.projectName.toLowerCase().includes(kw) ||
        s.sampleType.toLowerCase().includes(kw) ||
        (s.donorId && s.donorId.toLowerCase().includes(kw))
      )
    }

    return samples
  }
}
