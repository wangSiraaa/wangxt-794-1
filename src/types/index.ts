export enum SampleStatus {
  EMPTY = 'empty',
  OCCUPIED = 'occupied',
  EXPIRED = 'expired',
  USED = 'used'
}

export enum UserRole {
  ADMIN = 'admin',
  RESEARCHER = 'researcher',
  PRINTER = 'printer'
}

export interface Position {
  row: number
  col: number
}

export interface BoxPosition {
  freezerId: string
  shelfId: string
  boxId: string
}

export interface MoveRecord {
  id: string
  sampleId: string
  fromPosition: BoxPosition & Position
  toPosition: BoxPosition & Position
  movedAt: string
  operator: string
  remark?: string
}

export interface Sample {
  id: string
  sampleCode: string
  sampleType: string
  projectId: string
  projectName: string
  position: Position
  boxPosition: BoxPosition
  status: SampleStatus
  expirationDate: string
  collectDate: string
  donorId?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

export interface Box {
  id: string
  boxCode: string
  boxName: string
  freezerId: string
  shelfId: string
  rows: number
  cols: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Shelf {
  id: string
  shelfCode: string
  shelfName: string
  freezerId: string
  description?: string
}

export interface Freezer {
  id: string
  freezerCode: string
  freezerName: string
  location: string
  temperature: string
  description?: string
}

export interface BoxMatrix {
  boxId: string
  rows: number
  cols: number
  samples: (Sample | null)[][]
}

export interface SearchFilters {
  projectId?: string
  sampleType?: string
  expirationStatus?: 'valid' | 'expired' | 'all'
  status?: SampleStatus | 'all'
  freezerId?: string
  shelfId?: string
  boxId?: string
  keyword?: string
  position?: Partial<Position>
}

export interface PrintQueueItem {
  id: string
  sampleId: string
  sampleCode: string
  addedAt: string
  copies: number
}

export interface RecentQuery {
  id: string
  filters: SearchFilters
  queryAt: string
  resultCount: number
}

export interface LocalStorageData {
  freezers: Freezer[]
  shelves: Shelf[]
  boxes: Box[]
  samples: Sample[]
  moveRecords: MoveRecord[]
  boxMatrices: Record<string, BoxMatrix>
  sampleCodeIndex: Record<string, string>
  printQueue: PrintQueueItem[]
  recentQueries: RecentQuery[]
  lastPosition?: BoxPosition & Position
}

export type ValidationResult = {
  valid: boolean
  error?: string
}

export interface LabelData {
  sampleCode: string
  sampleType: string
  projectName: string
  position: string
  expirationDate: string
  qrData: string
}
