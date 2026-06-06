import { describe, it, expect } from 'vitest'
import { rules } from '../src/services/rules'
import { SampleStatus } from '../src/types'
import type { Sample, BoxMatrix, PrintQueueItem } from '../src/types'
import { addDays, formatDate } from '../src/utils'

describe('业务规则验证', () => {
  const createSample = (overrides: Partial<Sample> = {}): Sample => ({
    id: 'test_sample_1',
    sampleCode: 'TEST001',
    sampleType: '血清',
    projectId: 'PRJ001',
    projectName: '测试项目',
    position: { row: 0, col: 0 },
    boxPosition: { freezerId: 'F001', shelfId: 'S01', boxId: 'B001' },
    status: SampleStatus.OCCUPIED,
    expirationDate: formatDate(addDays(new Date(), 30)),
    collectDate: formatDate(addDays(new Date(), -30)),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  })

  const createMatrix = (rows: number = 10, cols: number = 10): BoxMatrix => ({
    boxId: 'B001',
    rows,
    cols,
    samples: Array(rows).fill(null).map(() => Array(cols).fill(null))
  })

  describe('过期样本检测', () => {
    it('应正确识别已过期样本', () => {
      const expiredSample = createSample({
        expirationDate: formatDate(addDays(new Date(), -10)),
        status: SampleStatus.OCCUPIED
      })
      expect(rules.isSampleExpired(expiredSample)).toBe(true)
    })

    it('应正确识别未过期样本', () => {
      const validSample = createSample({
        expirationDate: formatDate(addDays(new Date(), 10)),
        status: SampleStatus.OCCUPIED
      })
      expect(rules.isSampleExpired(validSample)).toBe(false)
    })

    it('已过期样本的有效状态应为EXPIRED', () => {
      const expiredSample = createSample({
        expirationDate: formatDate(addDays(new Date(), -10)),
        status: SampleStatus.OCCUPIED
      })
      expect(rules.getEffectiveStatus(expiredSample)).toBe(SampleStatus.EXPIRED)
    })

    it('未过期样本的有效状态应保持原样', () => {
      const validSample = createSample({
        expirationDate: formatDate(addDays(new Date(), 10)),
        status: SampleStatus.OCCUPIED
      })
      expect(rules.getEffectiveStatus(validSample)).toBe(SampleStatus.OCCUPIED)
    })
  })

  describe('孔位占用校验', () => {
    it('空孔位应允许录入新样本', () => {
      const matrix = createMatrix()
      const newSample = createSample({ position: { row: 0, col: 0 } })
      const result = rules.validateNewSample(newSample, matrix)
      expect(result.valid).toBe(true)
    })

    it('已占用孔位应拒绝录入', () => {
      const matrix = createMatrix()
      const existingSample = createSample({ position: { row: 0, col: 0 } })
      matrix.samples[0][0] = existingSample

      const newSample = createSample({
        id: 'test_sample_2',
        sampleCode: 'TEST002',
        position: { row: 0, col: 0 }
      })

      const result = rules.validateNewSample(newSample, matrix)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('已被占用')
    })

    it('validatePositionOccupied对已占用孔位返回true', () => {
      const matrix = createMatrix()
      const existingSample = createSample({ position: { row: 2, col: 3 } })
      matrix.samples[2][3] = existingSample

      expect(rules.validatePositionOccupied({ row: 2, col: 3 }, matrix)).toBe(true)
    })

    it('validatePositionOccupied对空孔位返回false', () => {
      const matrix = createMatrix()
      expect(rules.validatePositionOccupied({ row: 0, col: 0 }, matrix)).toBe(false)
    })
  })

  describe('打印队列去重规则', () => {
    it('同一样本多次添加应只保留一次', () => {
      const sample = createSample()
      let queue: PrintQueueItem[] = []

      queue = rules.addToPrintQueue(queue, sample, 1)
      expect(queue.length).toBe(1)

      queue = rules.addToPrintQueue(queue, sample, 2)
      expect(queue.length).toBe(1)
      expect(queue[0].copies).toBe(2)
    })

    it('不同样本可正常添加到队列', () => {
      const sample1 = createSample({ id: 's1', sampleCode: 'S001' })
      const sample2 = createSample({ id: 's2', sampleCode: 'S002' })
      let queue: PrintQueueItem[] = []

      queue = rules.addToPrintQueue(queue, sample1)
      queue = rules.addToPrintQueue(queue, sample2)

      expect(queue.length).toBe(2)
      expect(queue.map(q => q.sampleId)).toEqual(['s1', 's2'])
    })

    it('validatePrintQueue对无重复队列返回有效', () => {
      const queue: PrintQueueItem[] = [
        { id: '1', sampleId: 's1', sampleCode: 'S001', addedAt: '', copies: 1 },
        { id: '2', sampleId: 's2', sampleCode: 'S002', addedAt: '', copies: 1 }
      ]
      expect(rules.validatePrintQueue(queue).valid).toBe(true)
    })

    it('validatePrintQueue对有重复队列返回无效', () => {
      const queue: PrintQueueItem[] = [
        { id: '1', sampleId: 's1', sampleCode: 'S001', addedAt: '', copies: 1 },
        { id: '2', sampleId: 's1', sampleCode: 'S001', addedAt: '', copies: 1 }
      ]
      const result = rules.validatePrintQueue(queue)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('重复样本')
    })
  })

  describe('位置标签转换', () => {
    it('应正确生成位置标签', () => {
      const boxPosition = { freezerId: 'F001', shelfId: 'S01', boxId: 'B001' }
      const position = { row: 0, col: 0 }
      const label = rules.getPositionLabel(boxPosition, position)
      expect(label).toBe('F001-S01-B001-A1')
    })

    it('应正确解析位置标签', () => {
      const label = 'F001-S01-B001-A1'
      const parsed = rules.parsePositionLabel(label)
      expect(parsed).not.toBeNull()
      expect(parsed?.boxPosition.freezerId).toBe('F001')
      expect(parsed?.boxPosition.shelfId).toBe('S01')
      expect(parsed?.boxPosition.boxId).toBe('B001')
      expect(parsed?.position.row).toBe(0)
      expect(parsed?.position.col).toBe(0)
    })
  })

  describe('跨盒移动记录', () => {
    it('应正确创建移动记录', () => {
      const sample = createSample()
      const fromBox = { freezerId: 'F001', shelfId: 'S01', boxId: 'B001' }
      const fromPos = { row: 0, col: 0 }
      const toBox = { freezerId: 'F001', shelfId: 'S01', boxId: 'B002' }
      const toPos = { row: 1, col: 1 }

      const record = rules.createMoveRecord(sample, fromBox, fromPos, toBox, toPos, 'test_user')

      expect(record.sampleId).toBe(sample.id)
      expect(record.fromPosition.boxId).toBe('B001')
      expect(record.toPosition.boxId).toBe('B002')
      expect(record.operator).toBe('test_user')
      expect(record.movedAt).toBeDefined()
    })
  })

  describe('过期状态自动更新', () => {
    it('应自动将过期的OCCUPIED样本标记为EXPIRED', () => {
      const samples = [
        createSample({ id: 's1', expirationDate: formatDate(addDays(new Date(), -5)), status: SampleStatus.OCCUPIED }),
        createSample({ id: 's2', expirationDate: formatDate(addDays(new Date(), 5)), status: SampleStatus.OCCUPIED })
      ]

      const updated = rules.updateSampleStatusForExpiration(samples)
      expect(updated[0].status).toBe(SampleStatus.EXPIRED)
      expect(updated[1].status).toBe(SampleStatus.OCCUPIED)
    })
  })
})
