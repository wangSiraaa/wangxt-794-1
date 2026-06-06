import { storage } from './storage'
import { generateId, addDays, formatDate } from '@/utils'
import type { Freezer, Shelf, Box, Sample, BoxMatrix, DashboardGroup } from '@/types'
import { SampleStatus } from '@/types'

export const mockData = {
  initDemoData(): void {
    const existing = storage.load()
    if (existing.freezers.length > 0) {
      return
    }

    const freezers: Freezer[] = [
      {
        id: 'F001',
        freezerCode: 'F001',
        freezerName: '超低温冰箱1号',
        location: '生物样本库A区',
        temperature: '-80℃',
        description: '主要存储肿瘤样本'
      },
      {
        id: 'F002',
        freezerCode: 'F002',
        freezerName: '超低温冰箱2号',
        location: '生物样本库A区',
        temperature: '-80℃',
        description: '主要存储血液样本'
      }
    ]

    const shelves: Shelf[] = [
      { id: 'S01', shelfCode: 'S01', shelfName: '第1层架', freezerId: 'F001', description: '' },
      { id: 'S02', shelfCode: 'S02', shelfName: '第2层架', freezerId: 'F001', description: '' },
      { id: 'S03', shelfCode: 'S03', shelfName: '第3层架', freezerId: 'F002', description: '' }
    ]

    const boxes: Box[] = [
      {
        id: 'B001',
        boxCode: 'B001',
        boxName: '肿瘤样本盒001',
        freezerId: 'F001',
        shelfId: 'S01',
        rows: 10,
        cols: 10,
        description: '肺癌样本专用',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'B002',
        boxCode: 'B002',
        boxName: '血液样本盒001',
        freezerId: 'F002',
        shelfId: 'S03',
        rows: 8,
        cols: 12,
        description: '全血样本',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    const samples: Sample[] = []
    const boxMatrices: Record<string, BoxMatrix> = {}

    const sampleTypes = ['血清', '血浆', '全血', '肿瘤组织', '正常组织', 'DNA', 'RNA', '细胞']
    const projectNames = ['肺癌精准医疗研究', '糖尿病遗传研究', '心血管疾病队列', '肿瘤免疫治疗', '罕见病研究']
    const projectIds = ['PRJ001', 'PRJ002', 'PRJ003', 'PRJ004', 'PRJ005']

    boxes.forEach(box => {
      const matrix: BoxMatrix = {
        boxId: box.id,
        rows: box.rows,
        cols: box.cols,
        samples: Array(box.rows).fill(null).map(() => Array(box.cols).fill(null))
      }

      const sampleCount = Math.floor(box.rows * box.cols * 0.4)

      for (let i = 0; i < sampleCount; i++) {
        let row, col
        do {
          row = Math.floor(Math.random() * box.rows)
          col = Math.floor(Math.random() * box.cols)
        } while (matrix.samples[row][col] !== null)

        const projectIdx = Math.floor(Math.random() * projectIds.length)
        const isExpired = Math.random() < 0.15
        const expirationOffset = isExpired
          ? -Math.floor(Math.random() * 30) - 1
          : Math.floor(Math.random() * 365) + 30

        const sample: Sample = {
          id: generateId('S'),
          sampleCode: `${box.boxCode}-${String(samples.length + 1).padStart(5, '0')}`,
          sampleType: sampleTypes[Math.floor(Math.random() * sampleTypes.length)],
          projectId: projectIds[projectIdx],
          projectName: projectNames[projectIdx],
          position: { row, col },
          boxPosition: {
            freezerId: box.freezerId,
            shelfId: box.shelfId,
            boxId: box.id
          },
          status: isExpired ? SampleStatus.EXPIRED : SampleStatus.OCCUPIED,
          expirationDate: formatDate(addDays(new Date(), expirationOffset)),
          collectDate: formatDate(addDays(new Date(), -Math.floor(Math.random() * 180) - 30)),
          donorId: `DONOR_${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
          remarks: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        samples.push(sample)
        matrix.samples[row][col] = sample
      }

      boxMatrices[box.id] = matrix
    })

    const dashboardGroups: DashboardGroup[] = [
      {
        id: 'DG001',
        name: '肿瘤研究专用',
        color: '#3B82F6',
        boxIds: ['B001'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'DG002',
        name: '血液样本专区',
        color: '#10B981',
        boxIds: ['B002'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    storage.saveFreezers(freezers)
    storage.saveShelves(shelves)
    storage.saveBoxes(boxes)
    storage.saveSamples(samples)

    const data = storage.load()
    data.boxMatrices = boxMatrices
    data.dashboardGroups = dashboardGroups
    data.activeDashboardGroupId = null
    storage.save(data)
  },

  clearAll(): void {
    storage.clear()
  }
}
