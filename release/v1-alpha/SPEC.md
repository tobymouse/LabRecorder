# 🔬 实验记录系统 — 功能规格 (SPEC)

> 版本：v1.0-alpha | 日期：2026-03-28

---

## 1. 系统概述

纯前端单页 Web 应用，配合轻量 Node.js 服务器实现数据持久化。用于芯片/器件测试场景下的多平台、多批次、多条件测试结果录入与统计。

### 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML / CSS / JavaScript（无框架） |
| 图表 | Chart.js（CDN） |
| Excel | SheetJS / xlsx.js（CDN） |
| 后端 | Node.js `http` 模块，`server.js` |
| 数据存储 | `data.json`（主）/ localStorage `labrecord_v2`（降级） |
| 访问地址 | http://localhost:3030 |

---

## 2. 数据模型

### 2.1 顶层结构（data.json）

```json
{
  "records": [ <LabRecord>, ... ]
}
```

### 2.2 LabRecord 对象

```json
{
  "id": "uuid-string",
  "name": "实验名称",
  "note": "备注",
  "createdAt": "ISO8601",
  "categories": ["批次A", "批次B"],
  "sampleCounts": [10, 10],
  "platforms": [
    {
      "name": "Android",
      "items": ["项目1", "项目2"],
      "conditions": ["常温", "高温"],
      "hiddenConds": [],
      "hiddenItems": []
    }
  ],
  "hiddenPlats": [],
  "hiddenCats": [],
  "data": {
    "ci_ic_pli_cdi_ii": [ { "result": "P", "note": "" }, ... ]
  }
}
```

### 2.3 Cell Key 格式

```
ci_ic_pli_cdi_ii
```

| 字段 | 说明 |
|------|------|
| `ci` | 分类索引（0-based） |
| `ic` | 样本编号（0-based） |
| `pli` | 平台索引（0-based） |
| `cdi` | 平台内条件索引（0-based） |
| `ii` | 平台内项目索引（0-based） |

### 2.4 旧数据兼容迁移

加载时自动检测并迁移：

1. **无 platforms 字段** → 从 `items` + `conditions` 创建默认平台，data key 补 `pli=0`
2. **有 platforms 但无 `pl.conditions`** → 从全局 `exp.conditions` 拷贝到各平台
3. **data key 为旧格式 `ci_ic_cdi_ii`** → 自动迁移为 `ci_ic_0_cdi_ii`

---

## 3. 功能模块

### 3.1 表格渲染

- **三级表头**：平台 → 条件 → 项目（含总结列）
- **多次结果纵向对齐**：每次（round）独占一行，各项目同次结果在同一行
- **每次独立总结列**：该次所有项目全 Pass 才算 Pass
- **样本行交替色**：偶数行 `#f8fafc`，奇数行 `#ffffff`
- **行 hover 高亮**：`#e0f2fe`，分类列/样本列联动高亮（rowspan 跨行由 JS 控制）
- **同组格线消除**：同一样本多次行之间无分隔线（`tr.same-sample-row`）
- **sticky 表头**：滚动时表头固定

### 3.2 Pass Rate 统计行

| 行类型 | 背景色 | 说明 |
|--------|--------|------|
| 分类内 PR 第N次 | `#eff6ff`（标签 `#dbeafe`，总结列 `#dbeafe`） | 该分类该次的通过率 |
| 全局 PR 第N次 | `#eff6ff`（标签 `#dbeafe`，总结列 `#dbeafe`） | 所有分类该次汇总 |
| 总计行 | `#eff6ff`（标签 `#93c5fd`，总结列 `#93c5fd`） | 所有次数汇总，颜色更深以示区别 |

PR 行末尾操作列合并为 `colspan="3"`（空格）。

### 3.3 数据录入

- 点击数据格弹出录入弹窗
- 选择 Pass / Fail，可填备注
- 支持删除单次结果（标签上的 ✕）
- 弹窗显示完整位置信息

### 3.4 字段管理

- **添加/删除/重命名**：分类、平台、平台条件、平台项目
- **拖拽排序**：所有字段均可拖拽，data key 自动重映射
- **隐藏/显示**：👁 图标，隐藏不影响数据
- **删除保护**：条件/项目有数据时弹 confirm 提示

### 3.5 样本管理

- 每批次样本数独立（`sampleCounts[ci]`）
- 表格底部「＋ 样本」行：背景 `#f8fafc`，hover 不高亮
- 删除样本按钮 hover 与样本行一致（`#e0f2fe`）

### 3.6 筛选

多维多选筛选，均为自定义下拉组件（`.ms-wrap/.ms-btn/.ms-panel`）：

| 筛选器 key | 说明 |
|------------|------|
| `result` | Pass/Fail/全Pass/全Fail |
| `cat` | 分类多选 |
| `plat` | 平台多选 |
| `cond` | 条件多选（汇总各平台去重） |
| `item` | 项目多选 |
| `round` | 次数多选，`updateFilterRound(maxRounds)` 动态重建 |

筛选状态存 `_msState`，激活筛选时 PR 行末尾三格改为 `#dbeafe` 背景（noFilter=false 时不渲染操作列）。

### 3.7 导出 Excel

- Sheet1「实验数据」：表头 `平台|条件|项目`，各平台独立条件
- Sheet2「统计汇总」：含平台列，按批次×平台×条件汇总
- 每次 Pass/Fail 各列独立输出

### 3.8 导入 Excel

- 支持新格式（`平台|条件|项目`）和旧格式（`条件 - 项目`）
- 导入后各平台独立存 `conditions`

### 3.9 历史记录

- 侧边栏列表，可收起（`--sidebar-w: 260px` / 折叠 `36px`）
- 操作：加载、复制结构（清空数据）、删除

### 3.10 统计图表

使用 Chart.js：
- 各批次通过率（柱状图）
- 各条件 Pass/Fail 分布（对比柱状图）
- 各项目通过情况（横向柱状图）
- Pass/Fail 总览（环形饼图）

### 3.11 固定横向滚动条

JS 实现，`position: fixed; bottom: 0`，与 `.table-container` 双向同步 `scrollLeft`，sidebar 折叠时自动更新 `left` 偏移。

---

## 4. API 接口（server.js）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 读取 `data.json` |
| POST | `/api/data` | 写入 `data.json`（body 为完整 JSON） |
| GET | `/*` | 静态文件服务（`index.html` 等） |

端口：`3030`

---

## 5. 已知问题 / 技术债

- 旧数据中 cell 数组可能含 `null` 条目，`getCell` 已做兼容处理
- file:// 协议下 localStorage 可能被 Edge Tracking Prevention 拦截
- 无用户认证，适合单机/局域网使用

---

## 6. 未来规划（Backlog）

- [ ] 多用户 / 网络同步
- [ ] Excel 导出带颜色格式
- [ ] 打印/PDF 导出
- [ ] 批量导入多条实验记录
- [ ] 移动端响应式优化

---

*SPEC v1.0-alpha — 2026-03-28*
