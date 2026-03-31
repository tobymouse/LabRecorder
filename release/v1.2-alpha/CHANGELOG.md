# CHANGELOG

所有版本变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [v1.2-alpha] — 2026-03-31

### ✨ 新增

- **同步简报：仅同步可见字段选项**：同步简报弹窗新增「仅同步可见字段」checkbox，**默认勾选**
  - 勾选时：隐藏的平台/条件/项目/分类不出现在简报中，通过率也只统计可见字段
  - 取消勾选：同步全部字段（含隐藏），与旧版行为一致
- **同步简报：多格式支持**：同步简报支持 HTML / Textile / Markdown 三种格式输出
  - 新建 Issue 和追加 journal 均可选格式
  - 格式选择器独立，不互相干扰
- **TinyMCE 替换 Quill**：实验备注编辑器从 Quill 升级为 TinyMCE 5.10.9
  - 通过 jsdelivr CDN 引入，无需 API key，无警告弹窗
  - 支持富文本编辑（图片内嵌 base64，不走 Redmine 上传）
  - 懒初始化（弹窗打开时才 init），避免 display:none 容器初始化失败

### 🎨 视觉优化

- **简报 HTML 通过率矩阵表头**：表头颜色从 Redmine 会过滤的深色背景改为浅蓝色背景（`#dbeafe`/`#e0f2fe`）+深蓝字（`#1e3a5f`/`#1e40af`），确保在 Redmine 中可读
- **简报 HTML 表头结构**：改为单行表头（Redmine 不支持 `rowspan`），平台和条件用 `<br>` 换行合并显示
- **简报通过率矩阵表头格式**（Textile/Markdown）：表头使用「平台名/条件名」合并格式，修复了之前矩阵缺失的问题

### 🔧 修复

- **Redmine 图片上传**：重构为递归函数，正确跟随 301/302 重定向；非 JSON 响应自动包装为友好错误
- **新建 Issue select ID 冲突**：新建 Issue 弹窗格式 select 由 `rm_desc_fmt` 改为 `rm_new_issue_fmt`，避免与追加 journal 弹窗同名 select 读值错误

---

## [v1.1-alpha] — 2026-03-29

### ✨ 新增

- **Redmine 集成**：顶部「🐛 提 Issue」按钮，可关联实验到 Redmine Issue
  - 支持搜索已有 Issue 或新建 Issue
  - 弹窗显示已关联 Issue 列表（可点击跳转、可取消关联）
  - 「📤 同步简报」：自动生成通过率摘要 + Fail 清单，追加为 Issue journal
  - server.js 新增 Redmine 代理接口（GET/POST/PUT，自动跟随重定向）
- **统计视图独立筛选**：统计分析 Tab 新增分类/平台/条件三维筛选栏，与表格视图筛选隔离
- **全局 Debug Logging**：7 个关键节点加入 `console.log`，前缀统一便于控制台 debug
  - `[loadStore]` / `[saveStore]` / `[loadRecord]` / `[saveRecord]`
  - `[setCell]` / `[renderTable]` / `[renderStats]`
- **帮助按钮**：顶部标题旁新增 `?` 圆圈图标，点击打开 help.html 使用说明
- **使用说明独立页面**：`help.html` 完整功能说明文档，含目录锚点导航

### 🎨 视觉优化

- 统计视图筛选栏样式与表格筛选栏对齐（`.search-bar` class、圆角、shadow）
- 筛选下拉面板「全选/清空」按钮统一改用 `.ms-panel-head button`（有边框 + hover 效果）
- 统计清除按钮颜色对齐表格清除按钮（`#f1f5f9` 浅灰底）
- 统计卡片与图表之间加入 16px 间距（`margin-top` 在 CSS 层定义）
- 顶部栏 `?` 帮助按钮：小圆圈样式，紧靠标题右侧，不占过多空间

### 🔧 修复

- `server.js` 对请求路径加入 `decodeURIComponent`，解决中文文件名 404 问题
- 帮助页改为英文文件名 `help.html`，彻底避免中文路径编码问题

---

## [v1.0-alpha] — 2026-03-28

### ✨ 新增

- **多平台支持**：实验可配置多个测试平台（如 Android / iOS），每个平台独立管理条件和项目
- **平台独立条件/项目**：管理字段弹窗中平台为独立 block，条件和项目互不影响
- **多次结果纵向对齐**：第N次各项目同行显示，每次独占一行，视觉清晰
- **每次独立总结列**：第N次所有项目全 Pass 才算 Pass
- **Pass Rate 统计行**：分类内 PR 行 + 全局 PR 行 + 总计行（颜色区分）
- **字段拖拽排序**：分类/平台/条件/项目均可拖拽排序，data key 自动重映射
- **字段隐藏/显示**：👁 图标临时隐藏字段，不影响数据
- **删除保护**：删除有数据的条件/项目时弹出确认提示
- **多维筛选**：结果类型 / 分类 / 平台 / 条件 / 项目 / 次数，均为多选下拉
- **导入 Excel**：支持新格式（`平台|条件|项目`）和旧格式（`条件 - 项目`）
- **本地服务器 + data.json**：数据持久化写入 `data.json`，localStorage 作降级
- **启动.bat**：双击自动启动服务器并打开浏览器
- **favicon**：SVG data URI 内嵌蓝底🔬图标
- **固定横向滚动条**：始终固定在视口底部，无需滚到页面末尾
- **旧数据兼容迁移**：加载旧格式数据自动迁移到新数据结构

### 🎨 视觉优化

- 三级表头：平台 → 条件 → 项目
- 样本行交替色 + hover 高亮（分类列/样本列联动）
- 同一样本多次行之间无分隔线（`same-sample-row`）
- PR 行颜色体系：标签列 / 总结列统一 `#dbeafe`，总计行加深 `#93c5fd`
- 添加样本按钮背景与样本编号列一致（`#f8fafc`），hover 不整行高亮
- 删除按钮 hover 颜色与样本行 hover 一致（`#e0f2fe`）
- PR 行末尾操作列合并为 `colspan="3"`

### 🔧 修复

- border-collapse 模式下格线去除：同时设置 `border-top: none` 和上一行 `border-bottom: none`
- null cell 兼容：旧数据中 `null` 条目统一转为 `{result:null, note:''}`
- 筛选后 PR 行不渲染操作列（避免列数错乱）

---

## [pre-alpha] — 2026-03-27

### 初始版本功能

- 基础 P/F 录入
- 单平台条件/项目管理
- localStorage 数据存储
- 导出 Excel（基础格式）
- 历史记录保存/加载/删除
- 文本搜索 + 结果类型筛选
- 统计图表（Chart.js）

---

*最后更新：2026-03-31（v1.2-alpha）*
