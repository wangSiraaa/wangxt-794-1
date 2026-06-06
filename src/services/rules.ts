import type {
  Sample,
  BoxMatrix,
  BoxPosition,
  Position,
  ValidationResult,
  PrintQueueItem,
  MoveRecord
} from '@/types'
import { SampleStatus } from '@/types'

export const rules = {
  isSampleExpired(sample: Sample): boolean {
    return new Date(sample.expirationDate) < new Date()
  },

  getEffectiveStatus(sample: Sample): SampleStatus {
    if (this.isSampleExpired(sample) && sample.status === SampleStatus.OCCUPIED) {
      return SampleStatus.EXPIRED
    }
    return sample.status
  },

  validateNewSample(
    sample: Partial<Sample>,
    matrix: BoxMatrix | null
  ): ValidationResult {
    if (!sample.sampleCode) {
      return { valid: false, error: '样本编号不能为空' }
    }

    if (!sample.sampleType) {
      return { valid: false, error: '样本类型不能为空' }
    }

    if (!sample.projectId) {
      return { valid: false, error: '所属项目不能为空' }
    }

    if (!sample.expirationDate) {
      return { valid: false, error: '有效期不能为空' }
    }

    if (!sample.position || !sample.boxPosition) {
      return { valid: false, error: '盒位坐标不能为空' }
    }

    if (matrix) {
      const { row, col } = sample.position
      if (row < 0 || row >= matrix.rows || col < 0 || col >= matrix.cols) {
        return { valid: false, error: '孔位坐标超出范围' }
      }

      const existing = matrix.samples[row]?.[col]
      if (existing && existing.status !== SampleStatus.EMPTY) {
        return { valid: false, error: '该孔位已被占用，不能重复录入' }
      }
    }

    return { valid: true }
  },

  validatePositionOccupied(
    position: Position,
    matrix: BoxMatrix | null
  ): boolean {
    if (!matrix) return false
    const { row, col } = position
    const sample = matrix.samples[row]?.[col]
    return !!sample && sample.status !== SampleStatus.EMPTY
  },

  createMoveRecord(
    sample: Sample,
    fromBoxPosition: BoxPosition,
    fromPosition: Position,
    toBoxPosition: BoxPosition,
    toPosition: Position,
    operator: string = 'system'
  ): MoveRecord {
    return {
      id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sampleId: sample.id,
      fromPosition: { ...fromBoxPosition, ...fromPosition },
      toPosition: { ...toBoxPosition, ...toPosition },
      movedAt: new Date().toISOString(),
      operator
    }
  },

  addToPrintQueue(
    queue: PrintQueueItem[],
    sample: Sample,
    copies: number = 1
  ): PrintQueueItem[] {
    const existing = queue.find(q => q.sampleId === sample.id)
    if (existing) {
      return queue.map(q =>
        q.sampleId === sample.id
          ? { ...q, copies: Math.max(q.copies, copies) }
          : q
      )
    }

    return [
      ...queue,
      {
        id: `print_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sampleId: sample.id,
        sampleCode: sample.sampleCode,
        addedAt: new Date().toISOString(),
        copies
      }
    ]
  },

  validatePrintQueue(queue: PrintQueueItem[]): ValidationResult {
    const seen = new Set<string>()
    for (const item of queue) {
      if (seen.has(item.sampleId)) {
        return { valid: false, error: `打印队列中存在重复样本: ${item.sampleCode}` }
      }
      seen.add(item.sampleId)
    }
    return { valid: true }
  },

  updateSampleStatusForExpiration(samples: Sample[]): Sample[] {
    const now = new Date()
    return samples.map(s => {
      if (
        s.status === SampleStatus.OCCUPIED &&
        new Date(s.expirationDate) < now
      ) {
        return { ...s, status: SampleStatus.EXPIRED, updatedAt: now.toISOString() }
      }
      return s
    })
  },

  getPositionLabel(boxPosition: BoxPosition, position: Position): string {
    const rowLabel = String.fromCharCode(65 + position.row)
    const colLabel = position.col + 1
    return `${boxPosition.freezerId}-${boxPosition.shelfId}-${boxPosition.boxId}-${rowLabel}${colLabel}`
  },

  parsePositionLabel(label: string): { boxPosition: BoxPosition; position: Position } | null {
    const parts = label.split('-')
    if (parts.length < 4) return null

    const posMatch = parts[3].match(/^([A-Z])(\d+)$/)
    if (!posMatch) return null

    return {
      boxPosition: {
        freezerId: parts[0],
        shelfId: parts[1],
        boxId: parts[2]
      },
      position: {
        row: posMatch[1].charCodeAt(0) - 65,
        col: parseInt(posMatch[2]) - 1
      }
    }
  }
}
