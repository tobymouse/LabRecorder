# 🔬 IC Validation Lab Recorder — v1.3-alpha

**发布日期**：2026-04-02

---

## 📦 包含文件

| 文件 | 说明 |
|------|------|
| `index.html` | 主应用（单页 Web 应用） |
| `server.js` | 本地 Node.js 服务器 + Redmine 代理 |
| `help.html` | 完整使用说明文档 |
| `启动.bat` | 一键启动脚本 |
| `SPEC.md` | 功能规格说明 |
| `CHANGELOG.md` | 版本变更记录 |
| `data.example.json` | 数据示例 |

---

## 🚀 快速开始

### 1. 启动应用

双击 `启动.bat` 或在终端执行：

```bash
node server.js
```

服务器将在 http://localhost:3030 启动，浏览器会自动打开。

### 2. 基本使用

1. **创建实验**：顶部工具栏「新建实验」
2. **配置字段**：管理字段按钮添加分类/平台/条件/项目
3. **录入数据**：点击单元格选择 Pass/Fail，支持多轮次纵向对齐
4. **导出 Excel**：工具栏「📥 导出 Excel」

---

## ✨ v1.3-alpha 新增功能

### 条件备注功能
- 点击总结表头可查看/编辑该条件的备注
- 总结表头显示 `✎` 图标（有备注时显示）
- Excel 导出：条件备注转换为批注（放在批注最前面）
- 富文本编辑：使用 Quill 编辑器，支持标题、列表、链接、图片

### 界面总结备注
- 点击总结单元格可查看/编辑该轮次所有项目的备注
- 总结单元格显示 `✎` 图标（有备注时显示）
- Excel 导出：总结备注转换为批注（按轮次分组显示）

### 样本备注批注
- 样本备注不再显示为独立列，而是作为 ic 列的批注
- 默认隐藏：只显示红色三角提示，悬停查看

### 通过率单行显示
- 每个分类底部只显示一行通过率
- 每个项目列和总结列都显示各轮次的通过率
- 内部换行：用换行符 `\n` 分隔不同轮次的通过率
- 显示格式：`次1: 5/6 (83%)\n次2: 6/6 (100%)`

### 工具栏优化
- TinyMCE 工具栏添加 `formatselect`，支持标题格式（H1/H2/H3）

### 项目列宽度调整
- 项目列宽度从 14 改为 10，更紧凑

### Excel 导出优化
- 删除样本备注列，只有分类、ic 两个固定列
- 批注默认隐藏：只显示红色三角提示

---

## 📊 数据存储

数据自动保存到 `data.json`（与服务器同目录）。

**降级兜底**：如果服务器未运行，自动使用 `localStorage`（浏览器本地存储）。

---

## 🐛 Redmine 集成

### 功能
- 关联实验到 Redmine Issue
- 同步简报到 Issue Journal（支持 HTML/Textile/Markdown 格式）
- 通过率矩阵 + Fail 清单自动生成

### 配置
首次使用需在「📤 同步简报」弹窗中配置：
- Redmine URL
- API Key
- 项目 ID

---

## 🔧 MCP Server

内置 `mcp-server.js`，提供以下工具：

- `list_records` - 列出所有实验记录
- `get_record` - 获取某条实验的完整结构
- `get_results` - 查询测试结果（支持筛选）
- `get_pass_rate` - 获取通过率统计
- `get_fail_list` - 获取所有 Fail 结果列表
- `add_result` - 写入一条测试结果

启动方式：

```bash
npx @modelcontextprotocol/inspector mcp-server.js
```

---

## 📖 详细文档

- **使用说明**：打开 `help.html` 查看完整功能指南
- **功能规格**：查看 `SPEC.md` 了解技术细节
- **变更记录**：查看 `CHANGELOG.md` 了解版本历史

---

## ⚠️ 注意事项

1. **浏览器兼容性**：推荐使用 Chrome / Edge（基于 Chromium）
2. **服务器依赖**：数据持久化依赖 `server.js`，但浏览器会自动降级到 `localStorage`
3. **数据备份**：定期备份 `data.json` 文件

---

## 📝 问题反馈

如遇问题，请检查：
1. 服务器是否正常运行（http://localhost:3030）
2. 浏览器控制台是否有错误（F12 打开开发者工具）
3. `data.json` 文件权限是否正常

---

**技术栈**：纯前端 HTML/CSS/JS + Node.js + Chart.js + xlsx-js-style

*无外部依赖，开箱即用！*
