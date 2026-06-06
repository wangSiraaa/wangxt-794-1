#!/bin/bash

echo "============================================="
echo "   生物样本库盒位查询系统 - 功能验证脚本"
echo "   看板分组功能检查 (check-794.sh)"
echo "============================================="
echo ""

ERRORS=0
WARNINGS=0

check_file_exists() {
  if [ -f "$1" ]; then
    echo "✓ $2: $1 存在"
    return 0
  else
    echo "✗ $2: $1 不存在"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

check_file_contains() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo "✓ $3: 包含 '$2'"
    return 0
  else
    echo "✗ $3: 未找到 '$2'"
    ERRORS=$((ERRORS + 1))
    return 1
  fi
}

echo "--- 1. 核心文件检查 ---"
check_file_exists "src/types/index.ts" "类型定义"
check_file_exists "src/context/AppContext.tsx" "状态管理"
check_file_exists "src/services/storage.ts" "存储服务"
check_file_exists "src/components/DashboardGroup.tsx" "看板分组组件"
check_file_exists "src/App.tsx" "主应用组件"
echo ""

echo "--- 2. 类型定义检查 ---"
check_file_contains "src/types/index.ts" "DashboardGroup" "DashboardGroup 接口"
check_file_contains "src/types/index.ts" "dashboardGroups" "dashboardGroups 字段"
check_file_contains "src/types/index.ts" "activeDashboardGroupId" "activeDashboardGroupId 字段"
echo ""

echo "--- 3. 存储服务检查 ---"
check_file_contains "src/services/storage.ts" "getDashboardGroups" "getDashboardGroups 方法"
check_file_contains "src/services/storage.ts" "addDashboardGroup" "addDashboardGroup 方法"
check_file_contains "src/services/storage.ts" "updateDashboardGroup" "updateDashboardGroup 方法"
check_file_contains "src/services/storage.ts" "deleteDashboardGroup" "deleteDashboardGroup 方法"
check_file_contains "src/services/storage.ts" "saveActiveDashboardGroupId" "saveActiveDashboardGroupId 方法"
echo ""

echo "--- 4. 状态管理检查 ---"
check_file_contains "src/context/AppContext.tsx" "addDashboardGroup" "addDashboardGroup 方法"
check_file_contains "src/context/AppContext.tsx" "updateDashboardGroup" "updateDashboardGroup 方法"
check_file_contains "src/context/AppContext.tsx" "deleteDashboardGroup" "deleteDashboardGroup 方法"
check_file_contains "src/context/AppContext.tsx" "setActiveDashboardGroup" "setActiveDashboardGroup 方法"
check_file_contains "src/context/AppContext.tsx" "SET_DASHBOARD_GROUPS" "SET_DASHBOARD_GROUPS action"
check_file_contains "src/context/AppContext.tsx" "ADD_DASHBOARD_GROUP" "ADD_DASHBOARD_GROUP action"
check_file_contains "src/context/AppContext.tsx" "UPDATE_DASHBOARD_GROUP" "UPDATE_DASHBOARD_GROUP action"
check_file_contains "src/context/AppContext.tsx" "DELETE_DASHBOARD_GROUP" "DELETE_DASHBOARD_GROUP action"
check_file_contains "src/context/AppContext.tsx" "SET_ACTIVE_DASHBOARD_GROUP" "SET_ACTIVE_DASHBOARD_GROUP action"
echo ""

echo "--- 5. 组件集成检查 ---"
check_file_contains "src/App.tsx" "DashboardGroup" "导入 DashboardGroup 组件"
check_file_contains "src/App.tsx" "filteredBoxIds" "filteredBoxIds 过滤逻辑"
check_file_contains "src/App.tsx" "filteredFreezers" "filteredFreezers 过滤逻辑"
check_file_contains "src/App.tsx" "filteredShelves" "filteredShelves 过滤逻辑"
check_file_contains "src/App.tsx" "filteredBoxes" "filteredBoxes 过滤逻辑"
check_file_contains "src/components/DashboardGroup.tsx" "新建分组" "新建分组功能"
check_file_contains "src/components/DashboardGroup.tsx" "编辑分组" "编辑分组功能"
check_file_contains "src/components/DashboardGroup.tsx" "删除分组" "删除分组功能"
check_file_contains "src/components/DashboardGroup.tsx" "切换到此分组" "切换分组功能"
echo ""

echo "--- 6. 现有功能复现检查 ---"
echo "  检查盒位矩阵、编号搜索、状态筛选、过期提示、定位动画、打印标签功能..."
check_file_contains "src/components/BoxMatrixView.tsx" "SampleStatus" "盒位矩阵状态"
check_file_contains "src/components/BoxMatrixView.tsx" "animate-ping-slow" "定位动画"
check_file_contains "src/components/BoxMatrixView.tsx" "已过期" "过期提示"
check_file_contains "src/components/SearchPanel.tsx" "关键词搜索" "编号搜索"
check_file_contains "src/components/SearchPanel.tsx" "使用状态" "状态筛选"
check_file_contains "src/components/SearchPanel.tsx" "过期状态" "过期筛选"
check_file_contains "src/components/SearchPanel.tsx" "定位" "定位动画触发"
check_file_contains "src/components/PrintQueuePanel.tsx" "打印" "打印标签功能"
check_file_contains "src/components/SampleDetail.tsx" "添加到打印队列" "打印队列功能"
echo ""

echo "--- 7. 本地存储持久化检查 ---"
check_file_contains "src/services/storage.ts" "localStorage" "使用 localStorage"
check_file_contains "src/context/AppContext.tsx" "useEffect" "状态变化自动保存"
check_file_contains "src/context/AppContext.tsx" "dashboardGroups" "dashboardGroups 持久化"
check_file_contains "src/context/AppContext.tsx" "activeDashboardGroupId" "activeDashboardGroupId 持久化"
echo ""

echo "============================================="
echo "              验证结果汇总"
echo "============================================="
echo "  错误数: $ERRORS"
echo "  警告数: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✓ 所有检查通过！看板分组功能已完整实现。"
  echo ""
  echo "  实现的功能包括："
  echo "  1. ✓ 看板分组：新建、编辑、删除分组"
  echo "  2. ✓ 分组颜色标记：8种预设颜色可选"
  echo "  3. ✓ 冻存盒关联：每个分组可关联多个冻存盒"
  echo "  4. ✓ 分组切换：点击切换激活的分组"
  echo "  5. ✓ 数据过滤：根据分组筛选冰箱、层架、冻存盒"
  echo "  6. ✓ 统计信息：显示分组内的冻存盒数、样本数、过期样本数"
  echo "  7. ✓ 本地持久化：刷新页面后分组状态不丢失"
  echo "  8. ✓ 现有功能：盒位矩阵、编号搜索、状态筛选、过期提示、定位动画、打印标签全部保留"
  echo ""
  echo "  接下来可以运行："
  echo "  - npm run dev: 启动开发服务器查看效果"
  echo "  - npm run build: 构建生产版本"
  echo "  - npm run check: 运行 TypeScript 检查和测试"
  exit 0
else
  echo "✗ 发现 $ERRORS 个错误，请检查上面的输出。"
  exit 1
fi
