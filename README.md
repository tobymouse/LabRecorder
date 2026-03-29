# 🔬 IC Validation Lab Recorder

> 芯片/器件验证测试记录工具 — 多批次 × 多平台 × 多测试条件的 Pass/Fail 矩阵记录与统计分析

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![No Framework](https://img.shields.io/badge/frontend-vanilla%20JS-f7df1e)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

## 为什么用这个

IC validation 测试矩阵大、多平台、多 lot，记在 Excel 手工维护容易出错，用 bug tracker 又缺少结构化统计视图。这个工具专门为此场景设计：

- 一个 **lot** 里有若干片 IC（样本）
- 同一片 IC 在 **多个平台**（如 Socket/COB、整机）上测试
- 每个平台有独立的**测试条件**（常温 25°C / 高温 85°C / 低温 -40°C）和**测试项目**（功耗、功能、RF 指标等）
- 支持**重测**：同一格可录多次，每次独立统计 Pass Rate
- 测出 Fail 后可直接关联 **Redmine Issue**，一键同步测试简报

---

## 快速开始

**前提：** 已安装 [Node.js 18+](https://nodejs.org/)

```bash
# 克隆或下载项目
git clone https://github.com/your-org/lab-recorder.git
cd lab-recorder

# 安装依赖（MCP server 可选）
npm install

# 启动（Windows）
双击 启动.bat

# 或手动启动
node server.js
```

浏览器打开：**http://localhost:3030**

> Windows 用户直接双击 `启动.bat`，自动启动服务器并打开浏览器。关闭窗口即停止。

---

## 一个典型的 IC Validation 场景

假设你在验证一颗蓝牙 SoC，需要测试：

| 维度 | 示例值 |
|------|--------|
| **批次（Lot）** | EVT-A、EVT-B、DVT-01 |
| **每批 IC 数** | EVT-A: 10 片，DVT-01: 20 片 |
| **平台** | Socket/COB（裸片/封装，二选一）、整机 |
| **Socket/COB 测试条件** | Normal (25°C)、High Temp (85°C)、Low Temp (-40°C) |
| **Socket/COB 测试项目** | Current (sleep)、Current (TX)、RSSI、Throughput |
| **整机 测试条件** | Normal (25°C) |
| **整机 测试项目** | Pairing、OTA、功能测试 |

### 操作流程

**1. 新建实验，配置字段**

点击「⚙ 管理字段」，添加以上批次、平台、条件、项目。每个平台独立配置条件和项目，互不影响。

**2. 生成测试矩阵**

点「✓ 应用并关闭」，系统自动生成三级表头矩阵：

```
批次       | ic | Socket/COB                                | 整机          |
           |    | Normal 25°C       | High Temp 85°C    | ...| Normal 25°C  | ...
           |    | I_sleep|I_TX|RSSI | I_sleep|I_TX|RSSI |Sum | Pair|OTA|Func|Sum
-----------+----+--------------------+-------------------+----+-------------+----
EVT-A      | 1  |   P    | P  | P   |    P   | F  | P   | F  |  P  | P  | P  | P
           | 2  |   P    | P  | F   |   ...                                      
...
```

**3. 录入结果**

点击任意数据格 → 弹出录入窗口，选择 🟢 Pass 或 🟠 Fail，可附备注。

**4. 查看统计**

点顶部「📊 统计」切换视图，查看各批次通过率柱状图、各条件 Pass/Fail 分布。

**5. 关联 Redmine Issue（可选）**

顶部「🐛 提 Issue」→ 搜索或新建 Issue → 关联当前实验。关联后「📤 同步简报」一键把通过率摘要追加为 Issue 留言。

---

## 核心功能

### 📋 测试矩阵表格

- **三级表头**：平台 → 条件 → 项目（含每组总结列）
- **多次测试（重测）**：同一格录多次结果，每次独占一行，Pass Rate 按次数独立统计
- **Pass Rate 行**：分类内 PR 第N次 + 全局 PR 第N次 + 总计（颜色加深区分）
- **固定横向滚动条**：宽表格不需要滚到页面底部才能左右拖动

### ⚙️ 字段管理

- 每个平台独立管理条件和项目（完全隔离）
- 所有字段支持**拖拽排序**，data key 自动重映射，不会乱
- 👁 隐藏字段：临时隐藏某批次/平台/条件，数据保留
- 删除有数据的字段时弹出确认保护

### 🔍 多维筛选

| 筛选器 | 说明 |
|--------|------|
| 文本搜索 | 实时过滤批次/备注 |
| 结果类型 | Pass / Fail / 全Pass / 全Fail |
| 分类 | 多选批次（如只看 DVT-01） |
| 平台 | 多选平台 |
| 条件 | 多选条件（跨平台汇总） |
| 项目 | 多选项目 |
| 次数 | 多选第N次（如只看重测） |

### 📊 统计分析

- 各批次通过率柱状图（绿/橙/红颜色阈值）
- 各条件 Pass/Fail 分布对比
- 各项目通过情况（横向柱，快速定位问题项目）
- Pass/Fail 总览环形图
- 统计视图独立筛选（分类/平台/条件）

### 📁 数据导出/导入

```
导出 Excel → 两个 Sheet：
  - 实验数据：完整原始矩阵，表头格式 平台|条件|项目
  - 统计汇总：按批次×平台×条件聚合的 Pass/Fail 计数和通过率
```

支持从导出文件反向导入，也兼容旧格式（`条件 - 项目`）。

### 🐛 Redmine 集成

- 顶部配置 Redmine URL / API Key / 项目 / Tracker
- 搜索已有 Issue 关联，或直接新建
- 「📤 同步简报」：自动生成总体通过率 + 各平台/批次/Fail 清单，追加为 Issue journal

### 🤖 MCP Server（AI 助手接入）

`mcp-server.js` 以 stdio 模式暴露工具，供 WorkBuddy / Claude Desktop 等 AI 助手查询和录入：

```json
{
  "command": "node",
  "args": ["/path/to/lab-recorder/mcp-server.js"],
  "name": "labrecorder"
}
```

| 工具 | 说明 |
|------|------|
| `list_records` | 列出所有实验（id / 名称 / 通过率） |
| `get_record` | 获取实验完整结构 |
| `get_results` | 查询结果，支持按平台/条件/项目/P-F 筛选 |
| `get_pass_rate` | 按平台/条件分组汇总通过率 |
| `get_fail_list` | 获取所有 Fail 清单（含位置 + 备注） |
| `add_result` | 写入一条 P/F 结果 |

---

## 数据结构

数据存在同目录 `data.json`，结构如下：

```json
{
  "records": [
    {
      "id": "uuid",
      "name": "BT SoC EVT Validation",
      "categories": ["EVT-A", "EVT-B", "DVT-01"],
      "sampleCounts": [10, 10, 20],
      "platforms": [
        {
          "name": "Socket/COB",
          "conditions": ["Normal 25°C", "High Temp 85°C", "Low Temp -40°C"],
          "items": ["Current (sleep)", "Current (TX)", "RSSI", "Throughput"]
        },
        {
          "name": "整机",
          "conditions": ["Normal 25°C"],
          "items": ["Pairing", "OTA", "功能测试"]
        }
      ],
      "data": {
        "0_0_0_0_0": [{ "result": "P", "note": "" }],
        "0_0_0_0_1": [{ "result": "F", "note": "电流偏高 12mA vs spec 10mA" }]
      }
    }
  ]
}
```

Cell key 格式：`ci_ic_pli_cdi_ii`（分类索引\_样本编号\_平台索引\_条件索引\_项目索引）

---

## 项目结构

```
lab-recorder/
├── index.html          # 前端单页应用（全量）
├── server.js           # Node.js 本地服务器（数据持久化 + Redmine 代理）
├── mcp-server.js       # MCP Server（AI 助手接入）
├── data.json           # 数据文件（运行时自动生成）
├── 启动.bat            # Windows 一键启动脚本
├── package.json
├── README.md           # 本文件
├── SPEC.md             # 功能规格与设计文档
├── CHANGELOG.md        # 变更记录
└── 使用说明.md         # 中文详细使用手册
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML / CSS / JavaScript（零依赖，无框架） |
| 图表 | [Chart.js](https://www.chartjs.org/)（CDN） |
| Excel | [SheetJS](https://sheetjs.com/)（CDN） |
| 后端 | Node.js 内置 `http` 模块 |
| 数据存储 | `data.json`（主）+ localStorage（离线降级） |
| MCP | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) |

---

## 已知限制

- 无用户认证，适合**单机或信任局域网**使用
- Excel 导出为纯文字（P/F），暂无单元格颜色
- 暂不支持移动端（宽表格设计，需要足够屏幕宽度）

---

## License

MIT
