# 选项分组功能实现总结

## 功能概述

为条件筛选和项目筛选添加按平台分组显示的功能，方便用户快速定位和管理不同平台的测试条件和项目。

## 实现日期

2026-04-01

## 应用范围

- **表格视图**：
  - 条件筛选（`cond`）
  - 项目筛选（`item`）
- **统计视图**：
  - 条件筛选（`stat-cond`）

## 核心改动

### 1. 数据结构

```javascript
// 分组选项数据格式
[
  { value: '常温', group: 'Android' },
  { value: '高温', group: 'Android' },
  { value: '低温', group: 'iOS' },
  ...
]
```

### 2. 新增全局变量

```javascript
const _msGrouped = {
  cat: false,
  cond: true,      // 条件筛选启用分组
  item: true,      // 项目筛选启用分组
  round: false,
  result: false,
  plat: false,
  'stat-cat': false,
  'stat-plat': false,
  'stat-cond': true  // 统计条件启用分组
};
```

### 3. 新增函数

#### `msSetGroupedOptions(key, groupedOpts)`

设置分组选项列表，并标记该筛选为分组模式。

**参数**：
- `key`: 筛选键名（如 'cond', 'item'）
- `groupedOpts`: 分组选项数组，格式 `[{ value, group }, ...]`

**逻辑**：
1. 保存分组选项到 `_msData[key]`
2. 标记为分组模式：`_msGrouped[key] = true`
3. 清除已失效的选中项
4. 渲染分组列表
5. 更新按钮状态

### 4. 修改的函数

#### `msRenderList(key)`

增强原有函数，支持两种渲染模式：

- **分组模式**（`_msGrouped[key] === true`）：
  - 按平台名称分组
  - 显示分组标题（`.ms-group-header`）
  - 每个平台下的选项垂直排列

- **普通模式**（`_msGrouped[key] === false`）：
  - 保持原有行为，直接渲染所有选项

#### `updateFilterCond()` / `updateFilterItem()`

改为调用 `msSetGroupedOptions` 而非 `msRebuild`，传入按平台分组的数据。

#### `renderStats()`

统计视图的条件筛选也改为使用分组数据格式。

### 5. 样式

```css
.ms-group-header {
  padding: 8px 10px 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2px;
}
```

## 视觉效果

```
┌─────────────────────────────────────┐
│ 【条件筛选下拉菜单】               │
├─────────────────────────────────────┤
│ Android        ← 分组标题           │
│ □ 常温                               │
│ □ 高温                               │
│ iOS           ← 分组标题            │
│ □ 低温                               │
│ □ 湿度测试                           │
└─────────────────────────────────────┘
```

## 向后兼容

- 所有未启用分组的筛选保持原有行为
- `_msRebuild(key, arr)` 仍然可用（会设置 `_msGrouped[key] = false`）
- 不影响现有的数据结构和业务逻辑

## 测试要点

1. **单平台场景**：分组标题正常显示，选项列表正确
2. **多平台场景**：每个平台的条件和项目正确分组显示
3. **筛选功能**：分组后选中/取消选中功能正常
4. **统计视图**：统计筛选按平台分组后统计结果正确
5. **平台管理**：添加/删除平台后分组列表自动更新

## 相关文件

- `index.html`：主要实现文件
- `MEMORY.md`：长期记忆更新
- `2026-04-01.md`：每日日志更新
- `CHANGELOG.md`：待更新版本记录

## 后续优化建议

1. 考虑为分组标题添加折叠/展开功能
2. 支持拖拽调整分组顺序（平台排序）
3. 分组标题显示该平台下选项数量
4. 搜索过滤功能（跨平台搜索条件/项目名称）
