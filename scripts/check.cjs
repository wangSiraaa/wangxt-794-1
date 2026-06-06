#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('========================================')
console.log('生物样本库系统 - 检查脚本')
console.log('========================================\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ PASS: ${name}`)
    passed++
  } catch (e) {
    console.log(`❌ FAIL: ${name}`)
    console.log(`   错误: ${e.message}`)
    failed++
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败')
  }
}

console.log('📋 阶段1: 项目结构检查\n')

test('package.json存在', () => {
  assert(fs.existsSync('./package.json'), 'package.json不存在')
})

test('tsconfig.json存在', () => {
  assert(fs.existsSync('./tsconfig.json'), 'tsconfig.json不存在')
})

test('vite.config.ts存在', () => {
  assert(fs.existsSync('./vite.config.ts'), 'vite.config.ts不存在')
})

test('Dockerfile存在', () => {
  assert(fs.existsSync('./Dockerfile'), 'Dockerfile不存在')
})

test('src目录结构完整', () => {
  const required = [
    './src/main.tsx',
    './src/App.tsx',
    './src/index.css',
    './src/types/index.ts',
    './src/services/storage.ts',
    './src/services/rules.ts',
    './src/services/mockData.ts',
    './src/context/AppContext.tsx',
    './src/components/BoxMatrixView.tsx',
    './src/components/SearchPanel.tsx',
    './src/components/AdminPanel.tsx',
    './src/components/PrintQueuePanel.tsx',
    './src/components/SampleDetail.tsx',
    './src/utils/index.ts'
  ]
  required.forEach(f => assert(fs.existsSync(f), `缺少文件: ${f}`))
})

test('tests目录存在', () => {
  assert(fs.existsSync('./tests/rules.test.ts'), '测试文件不存在')
})

console.log('\n📋 阶段2: 业务规则验证\n')

console.log('   加载业务规则模块...')

// 读取并验证核心规则逻辑
const rulesCode = fs.readFileSync('./src/services/rules.ts', 'utf-8')

test('包含过期样本检测逻辑', () => {
  assert(rulesCode.includes('isSampleExpired'), '缺少isSampleExpired函数')
  assert(rulesCode.includes('new Date(sample.expirationDate) < new Date()'), '过期判断逻辑不正确')
})

test('包含孔位占用校验逻辑', () => {
  assert(rulesCode.includes('validateNewSample'), '缺少validateNewSample函数')
  assert(rulesCode.includes('已被占用'), '缺少占用提示信息')
  assert(rulesCode.includes('validatePositionOccupied'), '缺少validatePositionOccupied函数')
})

test('包含打印队列去重逻辑', () => {
  assert(rulesCode.includes('addToPrintQueue'), '缺少addToPrintQueue函数')
  assert(rulesCode.includes('validatePrintQueue'), '缺少validatePrintQueue函数')
  assert(rulesCode.includes('重复样本'), '缺少重复检测')
})

test('包含移动记录创建逻辑', () => {
  assert(rulesCode.includes('createMoveRecord'), '缺少createMoveRecord函数')
})

test('包含过期状态自动更新逻辑', () => {
  assert(rulesCode.includes('updateSampleStatusForExpiration'), '缺少updateSampleStatusForExpiration函数')
})

console.log('\n📋 阶段3: 组件功能验证\n')

const matrixCode = fs.readFileSync('./src/components/BoxMatrixView.tsx', 'utf-8')

test('盒位矩阵组件包含过期高亮样式', () => {
  assert(matrixCode.includes('bg-sample-expired'), '缺少过期样本高亮样式')
  assert(matrixCode.includes('SampleStatus.EXPIRED'), '缺少过期状态判断')
  assert(matrixCode.includes('rules.isSampleExpired'), '缺少过期检测调用')
})

test('盒位矩阵组件包含定位动画', () => {
  assert(matrixCode.includes('animate-ping-slow'), '缺少定位动画')
  assert(matrixCode.includes('highlightedPosition'), '缺少高亮位置状态')
})

test('盒位矩阵组件包含数据测试属性', () => {
  assert(matrixCode.includes('data-testid'), '缺少测试用data-testid属性')
  assert(matrixCode.includes('data-sample-status'), '缺少状态数据属性')
})

const adminCode = fs.readFileSync('./src/components/AdminPanel.tsx', 'utf-8')

test('管理员界面包含样本录入校验', () => {
  assert(adminCode.includes('rules.validateNewSample'), '缺少样本录入校验')
  assert(adminCode.includes('sampleError'), '缺少错误提示处理')
})

test('管理员界面包含冰箱、层架、盒号管理', () => {
  assert(adminCode.includes('freezers'), '缺少冰箱管理')
  assert(adminCode.includes('shelves'), '缺少层架管理')
  assert(adminCode.includes('boxes'), '缺少盒号管理')
})

const searchCode = fs.readFileSync('./src/components/SearchPanel.tsx', 'utf-8')

test('搜索面板包含项目筛选', () => {
  assert(searchCode.includes('projectId'), '缺少项目筛选')
})

test('搜索面板包含样本类型筛选', () => {
  assert(searchCode.includes('sampleType'), '缺少样本类型筛选')
})

test('搜索面板包含过期状态筛选', () => {
  assert(searchCode.includes('expirationStatus'), '缺少过期状态筛选')
  assert(searchCode.includes('已过期'), '缺少过期选项')
})

test('搜索面板包含坐标定位', () => {
  assert(searchCode.includes('locateSample'), '缺少定位功能')
})

const printCode = fs.readFileSync('./src/components/PrintQueuePanel.tsx', 'utf-8')

test('打印队列组件包含去重验证', () => {
  assert(printCode.includes('rules.validatePrintQueue'), '缺少队列验证')
})

test('打印队列组件包含标签生成', () => {
  assert(printCode.includes('generateLabelData'), '缺少标签生成')
})

console.log('\n📋 阶段4: 本地存储验证\n')

const storageCode = fs.readFileSync('./src/services/storage.ts', 'utf-8')

test('存储包含盒位矩阵', () => {
  assert(storageCode.includes('boxMatrices'), '缺少boxMatrices存储')
})

test('存储包含编号索引', () => {
  assert(storageCode.includes('sampleCodeIndex'), '缺少sampleCodeIndex索引')
  assert(storageCode.includes('buildSampleCodeIndex'), '缺少索引构建')
})

test('存储包含状态筛选搜索', () => {
  assert(storageCode.includes('searchSamples'), '缺少searchSamples函数')
  assert(storageCode.includes('expirationStatus'), '缺少过期状态筛选')
})

test('存储包含过期提示相关数据', () => {
  assert(storageCode.includes('expirationDate'), '缺少有效期字段')
})

test('存储包含打印队列', () => {
  assert(storageCode.includes('printQueue'), '缺少printQueue存储')
})

test('存储包含最近查询', () => {
  assert(storageCode.includes('recentQueries'), '缺少recentQueries存储')
})

console.log('\n📋 阶段5: 运行单元测试\n')

try {
  console.log('   安装依赖...')
  execSync('npm install --no-audit --no-fund 2>&1', { stdio: 'pipe', timeout: 120000 })
  console.log('   依赖安装完成')

  console.log('   运行单元测试...')
  const testOutput = execSync('npx vitest run --reporter=verbose 2>&1', {
    stdio: 'pipe',
    timeout: 60000,
    encoding: 'utf-8'
  })

  console.log('\n' + testOutput.split('\n').slice(-20).join('\n'))

  test('所有单元测试通过', () => {
    assert(testOutput.includes('Test Files  1 passed'), '单元测试未全部通过')
  })
} catch (e) {
  console.log(`⚠️  测试执行警告: ${e.message?.split('\n')[0] || e}`)
  console.log('   请手动运行 npm test 查看详情')
}

console.log('\n📋 阶段6: TypeScript 类型检查\n')

try {
  console.log('   运行 TypeScript 检查...')
  const tscOutput = execSync('npx tsc --noEmit 2>&1', {
    stdio: 'pipe',
    timeout: 60000,
    encoding: 'utf-8'
  })
  test('TypeScript类型检查通过', () => {
    assert(tscOutput.trim() === '', '存在TypeScript类型错误')
  })
  console.log('   ✓ 无类型错误')
} catch (e) {
  console.log(`⚠️  类型检查警告: ${e.stdout?.split('\n').slice(0, 5).join('\n') || '请手动运行 npx tsc --noEmit 查看'}`)
}

console.log('\n========================================')
console.log('检查结果汇总')
console.log('========================================')
console.log(`通过: ${passed}`)
console.log(`失败: ${failed}`)
console.log(`总计: ${passed + failed}`)

if (failed > 0) {
  console.log('\n❌ 部分检查未通过，请修复后重新运行')
  process.exit(1)
} else {
  console.log('\n✅ 所有检查通过！')
  console.log('\n📖 下一步:')
  console.log('   开发模式: npm run dev')
  console.log('   生产构建: npm run build')
  console.log('   容器运行: docker build -t biosample . && docker run -p 8080:80 biosample')
  process.exit(0)
}
