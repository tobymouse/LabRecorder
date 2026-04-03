# 🔬 IC Validation Lab Recorder — 功能规格 (SPEC)

> 版本：v1.3-alpha | 日期：2026-04-02 | 更新：2026-04-02（条件备注、通过率优化）


---

## 1. 系统概述

纯前端单页 Web 应用，配合轻量 Node.js 服务器实现数据持久化。专为 IC / 器件 validation 场景设计：多 lot、多平台、多测试条件的 Pass/Fail 矩阵记录与统计分析。

### 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML / CSS / JavaScript（无框架） |
| 图表 | Chart.js（CDN） |
| Excel | SheetJS / xlsx.js（CDN） |
| 富文本编辑器 | TinyMCE 5.10.9（jsdelivr CDN，无需 API key） |
| 后端 | Node.js `http` 模块，`server.js` |
| 数据存储 | `data.json`（主）/ localStorage `labrecord_v2`（降级） |
| MCP | `@modelcontextprotocol/sdk` |
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
  "name": "BT SoC EVT Validation",
  "note": "备注",
  "createdAt": "ISO8601",
  "targetPassRate": 80,
  "alarmPassRate": 60,
  "categories": ["EVT-A", "EVT-B", "DVT-01"],
  "sampleCounts": [10, 10, 20],
  "platforms": [
    {
      "name": "Socket/COB",
      "items": ["Current (sleep)", "Current (TX)", "RSSI", "Throughput"],
      "conditions": ["Normal 25°C", "High Temp 85°C", "Low Temp -40°C"],
      "hiddenConds": [],
      "hiddenItems": []
    }
  ],
  "hiddenPlats": [],
  "hiddenCats": [],
  "redmineIssues": [
    { "id": 1234, "url": "https://redmine.example.com/issues/1234" }
  ],
  "sampleNotes": {
    "0_1": "样本批次异常，需重点关注",
    "2_5": "测试夹具接触不良"
  },
  "data": {
    "0_0_0_0_0": [{ "result": "P", "note": "" }],
    "0_0_0_0_1": [{ "result": "F", "note": "电流偏高 12mA vs spec 10mA" }]
  }
}
```

### 2.3 Cell Key 格式

```
ci_ic_pli_cdi_ii
```

| 字段 | 说明 |
|------|------|
| `ci` | 分类（lot）索引，0-based |
| `ic` | 样本（ic）编号，0-based |
| `pli` | 平台索引，0-based |
| `cdi` | 平台内条件索引，0-based |
| `ii` | 平台内项目索引，0-based |

### 2.4 旧数据兼容迁移

加载时自动检测并迁移（`loadRecord` 内执行）：

1. **无 platforms 字段** → 从 `items` + `conditions` 创建默认平台，data key 补 `pli=0`
2. **有 platforms 但无 `pl.conditions`** → 从全局 `exp.conditions` 拷贝到各平台
3. **data key 为旧格式 `ci_ic_cdi_ii`** → 自动迁移为 `ci_ic_0_cdi_ii`

---

## 3. 功能模块

### 3.1 表格渲染（renderTable）

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

Pass Rate 颜色阈值：≥ `targetPassRate`(默认80%) 绿色，≥ `alarmPassRate`(默认60%) 橙色，其余红色。

### 3.3 数据录入

- 点击数据格弹出录入弹窗
- 选择 Pass / Fail，可填备注
- 支持删除单次结果（标签上的 ✕）
- 弹窗显示完整位置信息（批次 / 样本 / 平台 / 条件 / 项目）

### 3.4 字段管理

- **添加/删除/重命名**：分类、平台、平台条件、平台项目
- **拖拽排序**：所有字段均可拖拽，data key 自动重映射（重映射函数：`remapDataKeys`）
- **隐藏/显示**：👁 图标，隐藏不影响数据
- **删除保护**：条件/项目有数据时弹 `confirm` 提示

### 3.5 样本管理

- 每批次样本数独立（`sampleCounts[ci]`）
- 表格底部「＋ 样本」行：背景 `#f8fafc`，hover 不整行高亮
- 删除样本按钮 hover 颜色与样本行 hover 一致（`#e0f2fe`）
- **样本备注**：点击 ic 列打开弹窗录入，有备注时显示 ✎ 图标，鼠标悬浮显示备注预览（`title` 属性），导出 Excel 时作为批注

### 3.5.1 次操作功能

- **交互方式**：每行操作列都显示"操作"按钮（未筛选时显示）
- **点击行为**：点击按钮后弹出快速下拉菜单（类似单元格 P/F 下拉）
- **菜单选项**：
  - ⇞ 之前插入：在当前次上方插入新记录
  - ⇟ 之后插入：在当前次下方插入新记录
  - ↟ 上移：将当前次与上一个次交换数据
  - ↡ 下移：将当前次与下一个次交换数据
  - ✎ 备注：编辑该次的备注

#### 插入逻辑
- **之前插入**：在当前 `dataRound` 位置插入
- **之后插入**：在 `dataRound + 1` 位置插入
- **影响范围**：插入操作影响该样本的所有平台×条件×项目（每个单元格数组都在指定位置 splice 插入 `{result:null, note:''}`）

#### 移动逻辑
- **数据交换**：交换该样本所有平台、条件、项目的指定索引数据
  - 例如：交换次3和次4 → 每个单元格数组中索引3和4的元素互换
- **边界检查**：
  - 第0次不能上移
  - 最后一次不能下移
  - 边界判断基于当前样本的实际次数（而非全局最大次数）
- **筛选兼容**：
  - `dataRound` 已考虑筛选后的排序，移动位置符合显示顺序
  - 使用 `displayRound`（显示列索引）和 `sortedRounds` 计算需要交换的原始索引
- **备注同步**：移动时会同步交换：
  - 总结备注（`conditionNotes`）：`${ci}_${ic}_${pli}_${cdi}_${dataRound}`
  - 次备注（`roundNotes`）：`${ci}_${ic}_round_${dataRound}`

#### 样式实现
- 复用 `#cellDropdown` 的 `.cd-item` 样式，`#addRoundDropdown` 为新增下拉容器
- 智能定位：下拉菜单位置自动调整，避免超出屏幕边界（底部或右侧超出时自动换方向）
- 全局状态：使用 `_addRoundCtx = { ci, ic, dataRound, displayRound }` 存储当前操作上下文
- 点击外部关闭：点击页面其他区域自动关闭下拉菜单

### 3.6 筛选（表格视图）

多维多选筛选，均为自定义下拉组件（`.ms-wrap/.ms-btn/.ms-panel`），状态存 `_msState`：

| 筛选器 key | 说明 |
|------------|------|
| `result` | Pass/Fail/全Pass/全Fail |
| `cat` | 分类多选 |
| `plat` | 平台多选 |
| `cond` | 条件多选（汇总各平台去重） |
| `item` | 项目多选 |
| `round` | 次数多选，`updateFilterRound(maxRounds)` 动态重建 |

激活筛选时 PR 行末尾三格改为 `#dbeafe` 背景（`noFilter=false` 时不渲染操作列）。

### 3.7 统计视图（renderStats）

独立于表格视图，有自己的筛选栏：

**筛选维度：**

| 筛选器 key | 说明 |
|------------|------|
| `stat-cat` | 分类多选 |
| `stat-plat` | 平台多选 |
| `stat-cond` | 条件多选 |

**统计卡片：** 总 Pass / 总 Fail / 整体通过率 / 批次数 / 条件数 / 项目数

**图表（Chart.js）：**

| 图表 | 类型 | 说明 |
|------|------|------|
| 各批次通过率 | 柱状图 | 按筛选后分类统计，颜色阈值同 PR 行 |
| 各条件 Pass/Fail 分布 | 对比柱状图 | 直观看哪个条件失败多 |
| 各测试项目通过情况 | 横向柱状图 | 快速定位问题项目 |
| Pass/Fail 总览 | 环形饼图 | 整体通过/失败比例 |

### 3.8 导出 Excel

- Sheet1「实验数据」：表头 `平台|条件|项目`，各平台独立条件，每次 Pass/Fail 各列独立输出
- Sheet2「统计汇总」：含平台列，按批次×平台×条件汇总 Pass/Fail 计数及通过率

**Excel 颜色格式：**

| 样式常量 | 背景色 | 字体色 | 用途 |
|----------|--------|--------|------|
| `S_PL` | `#1e3a5f` | 白字粗 | 平台行 |
| `S_COND` | `#2d6a9f` | 白字粗 | 条件行 |
| `S_ITEM` | `#f0f4f8` | `#1e293b` 深字粗 | 项目行（与分类/ic表头同色） |
| `S_CAT` | `#1e3a5f` | 白字粗，左对齐 | 分类标题列 |
| `S_FIX` | `#1e3a5f` | 白字粗 | 分类/ic 标题格 |
| `S_PASS` | `#dcfce7` | `#15803d` | Pass 数据单元格（仅用于总结列） |
| `S_FAIL` | `#ffedd5` | `#f97316` | Fail 数据单元格（仅用于总结列） |

**数据列配色规则：**
- 含 F 的单元格 → 橘红字 `#f97316`（无背景）
- 全 P 的单元格 → 绿字 `#15803d`（无背景）
- 空/全`-`的单元格 → 浅灰字 `#94a3b8`（无背景）
- 总结列（Pass/Fail） → 有背景色（`S_PASS`/`S_FAIL`）

### 3.9 导入 Excel

- 支持新格式（`平台|条件|项目`）和旧格式（`条件 - 项目`）
- 导入后各平台独立存 `conditions`

### 3.10 历史记录

- 侧边栏列表，可收起（`--sidebar-w: 260px` / 折叠 `36px`）
- 操作：加载、复制结构（清空数据保留字段）、删除

### 3.11 固定横向滚动条

JS 实现，`position: fixed; bottom: 0`，与 `.table-container` 双向同步 `scrollLeft`，sidebar 折叠时自动更新 `left` 偏移。

### 3.12 Redmine 集成

**配置存储：** localStorage key = `labrecord_redmine_cfg`，字段：`url / apiKey / projectId / trackerId`

**数据结构：** `exp.redmineIssues = [{ id, url }, ...]`（实验级关联，不绑定单元格）

**Issue 弹窗功能：**

1. 显示已关联 Issue 列表（可点击跳转，可 ✕ 取消关联）
2. 搜索已有 Issue（`GET /api/redmine/issues.json` 代理）
3. 选中已有 Issue → `rmLinkToIssue()` 写入 `exp.redmineIssues[]`
4. 新建 Issue → `POST /api/redmine/issues.json`，创建后再调 `rmLinkToIssue()`

**同步简报（`syncRedmineBrief`）：**

- 触发条件：`exp.redmineIssues.length > 0`（顶部「📤 同步简报」按钮显示）
- 写入方式：`PUT /api/redmine/issues/:id.json` body=`{issue:{notes:content}}`（追加 journal）

**同步选项（`getRmSyncOpts()`）：**

| 选项 key | 说明 | 默认 |
|----------|------|------|
| `header` | 简报标题 + 时间戳 | true |
| `overall` | 总体通过率 | true |
| `matrix` | 通过率矩阵（分类 × 平台/条件） | true |
| `platform` | 各平台统计 | false |
| `condition` | 各条件统计 | false |
| `category` | 各分类（批次）统计 | false |
| `fail` | Fail 清单（含位置 + 备注） | false |
| `visibleOnly` | 仅同步可见字段，过滤隐藏的平台/条件/项目/分类 | **true** |

**输出格式：** HTML / Textile / Markdown（选择器 `rm_new_issue_fmt` / 相应 select）

- **HTML**：适合 Redmine `safe_mode: false` 配置；表头使用浅蓝色背景（`#dbeafe`/`#e0f2fe`）+ 深蓝字以兼容 Redmine 过滤规则
- **Textile**：Redmine 默认格式，表头用 `平台名/条件名` 合并格式
- **Markdown**：适合配置了 Markdown 的 Redmine

**`visibleOnly` 过滤逻辑（`buildReportContent` / `buildReportHtml`）：**

- 勾选（默认）：过滤 `hiddenCats` / `hiddenPlats` / `pl.hiddenConds` / `pl.hiddenItems`
- 取消勾选：全量同步，含所有隐藏字段

**图片上传（`handleRedmineUpload`）：**

- 重构为 `doUpload` 递归函数，支持 301/302 重定向跟随
- 非 JSON 响应自动包装为友好错误 JSON
- HTML 格式插图后自动换行

### 3.13 实验备注编辑器

- **编辑器**：TinyMCE 5.10.9，通过 jsdelivr CDN 引入（无需 API key，无警告弹窗）
- **初始化策略**：懒初始化，弹窗打开（容器 visible）后才调用 `tinymce.init()`，避免 `display:none` 容器初始化失败
- **图片插入**：`images_upload_handler` → FileReader 读取为 base64 内嵌，不走 Redmine 上传
- **向后兼容**：保留 `noteGetOrInitQuill()` 别名，存量调用无需修改
- **关键配置**：需指定 `skin_url` 和 `content_css`（均指向 jsdelivr CDN）

---

## 4. API 接口（server.js）

### 数据接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data` | 读取 `data.json` |
| POST | `/api/data` | 写入 `data.json`（body 为完整 JSON） |

### Redmine 代理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/redmine/*` | 代理转发到 Redmine，自动跟随 301/302 重定向 |
| POST | `/api/redmine/*` | 代理转发（新建 Issue 等） |
| PUT | `/api/redmine/*` | 代理转发（更新 Issue / 追加 journal） |
| POST | `/api/redmine/uploads.json` | 图片上传代理，支持重定向跟随，非 JSON 响应自动包装 |

Redmine 的 URL 和 API Key 由前端在请求头 `X-Redmine-URL` 和 `X-Redmine-Key` 传入，server.js 提取后构造真实请求。

### 静态文件

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/*` | 静态文件服务（`index.html` 等） |

端口：`3030`

---

## 5. MCP Server（mcp-server.js）

stdio 模式，供 WorkBuddy / Claude Desktop 等 AI 助手接入。

### 工具列表

| 工具名 | 说明 |
|--------|------|
| `list_records` | 列出所有实验记录（id / 名称 / 创建时间 / 平台数 / 通过率） |
| `get_record` | 获取某条实验的完整结构（平台 / 条件 / 项目 / 分类） |
| `get_results` | 查询测试结果，支持按平台/条件/项目/P-F 筛选 |
| `get_pass_rate` | 按平台/条件分组汇总通过率 |
| `get_fail_list` | 获取所有 Fail 列表（含位置 + 备注，适合提 Issue） |
| `add_result` | 写入一条 P/F 结果 |

### WorkBuddy 配置示例

```json
{
  "command": "node",
  "args": ["/path/to/lab-recorder/mcp-server.js"],
  "name": "labrecord"
}
```

---

## 6. Debug Logging

关键操作均有 `console.log` 输出，前缀统一，便于控制台 debug：

| 前缀 | 触发时机 | 输出内容 |
|------|---------|---------|
| `[loadStore]` | 页面启动 | 数据来源（服务器/localStorage）+ 记录数 |
| `[saveStore]` | 每次自动保存 | 成功或降级到 localStorage |
| `[loadRecord]` | 切换/加载记录 | id + 实验名称 |
| `[saveRecord]` | 点保存按钮 | id + 实验名称 |
| `[setCell]` | 录入 P/F 结果 | 完整坐标（ci/ic/pli/cdi/ii）+ 结果值 |
| `[renderTable]` | 表格重绘 | 分类数 + 平台数 |
| `[renderStats]` | 统计重绘 | 分类/平台数 + 三维筛选当前状态 |

---

## 7. 已知问题 / 技术债

- 旧数据中 cell 数组可能含 `null` 条目，`getCell` 已做兼容（`null` → `{result:null, note:''}`）
- file:// 协议下 localStorage 可能被 Edge Tracking Prevention 拦截，建议始终用服务器模式
- 无用户认证，适合单机/信任局域网使用
- Excel 导出已支持单元格颜色格式（见 3.8 节）

---

## 8. 未来规划（Backlog）

- [ ] 打印 / PDF 导出
- [ ] 批量导入多条实验记录
- [ ] 移动端响应式优化
- [ ] 多用户 / 网络同步
- [ ] Redmine 双向同步（从 Issue 状态反写 P/F）

---

*SPEC v1.3 — 2026-04-01*

