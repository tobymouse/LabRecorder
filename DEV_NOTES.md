# LabRecorder 开发经验与 Flow 总结

> 项目：实验记录系统（LabRecorder）
> 时间跨度：2026-03-28 ~ 2026-03-29
> 技术栈：纯前端单页应用（HTML/CSS/JS）+ Node.js 本地服务器

---

## 一、整体开发流程

```
需求描述 → 功能设计 → 代码实现 → JS 语法验证 → 人工验收 → 文档更新 → Release 打包 → Git Push
```

每个迭代都是这个小循环，通常一次 15~30 分钟。功能越复杂，迭代粒度越细。

---

## 二、项目架构决策

### 为什么选纯前端单页应用？

- 不需要数据库、部署简单，双击 `.bat` 即可启动
- 所有功能在一个 `index.html` 里，便于非技术用户分发使用
- 数据以 `data.json` 形式存储，方便备份和迁移

### 数据存储演进

| 阶段 | 方案 | 问题 |
|------|------|------|
| v0 | `localStorage` | Edge 的 Tracking Prevention 在 `file://` 协议下阻断访问 |
| v1 | `data.json` via `GET/POST /api/data` | 需要先启动服务器；服务器未运行时自动降级回 localStorage |

**关键教训**：降级兜底逻辑（localStorage）是把双刃剑。它保证了不崩溃，但也掩盖了"服务器没跑"的问题，容易导致数据不在预期位置。应在 UI 上明显提示服务器状态。

### 数据结构版本管理

cell key 格式经历了两次升级：

```
旧格式：ci_ic_cdi_ii
↓ 平台维度加入
新格式：ci_ic_pli_cdi_ii
```

每次升级都在 `loadRecord()` 里写自动迁移逻辑，做到向后兼容。**经验：数据结构变更要同步写迁移，不能假设用户手动清数据。**

---

## 三、关键技术经验

### 3.1 JS 语法检查必须做

**这是本项目最重要的流程规范。**

单文件 HTML 里 `<script>` 解析失败会导致整个页面白屏，且错误信息不直观。实际踩过一次：重构 `confirmSubmitRedmine` 时遗留孤立代码片段，导致页面白屏，数据"消失"（实际在 data.json，但看不到）。

**标准检查命令：**

```powershell
# 提取 <script> 内容到临时文件，再 --check 验证
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);fs.writeFileSync('_tmp_check.js',m[1]);"
node --check _tmp_check.js
```

**规范：每次大改动后必须执行一遍，不通过不提交。**

### 3.2 CORS 与本地代理

浏览器直接 `fetch` 第三方 API（如 Redmine）会被 CORS 拦截。解决方案：在 `server.js` 里写反向代理路由 `/api/redmine/*`，由 Node.js 代替浏览器发请求。

```
browser → fetch /api/redmine/issues.json
         ↓
server.js proxyRequest()
         ↓
Redmine API (服务端无 CORS 限制)
```

**坑：**
- Redmine 未登录时会 301/302 重定向到登录页，需要在代理里自动跟随重定向
- PUT 请求不能把 API Key 加到 URL 参数（`?key=xxx`），否则 Rails 会把它当作字段值导致 500；应只放在 `X-Redmine-API-Key` Header
- PUT body 必须转 `Buffer` 并写 `Content-Length`，否则 Redmine 读不到 body

### 3.3 中文路径问题

文件命名不要用中文（比如 `使用说明.html`），浏览器在 `file://` 下编码没问题，但通过 HTTP server 访问时 URL 编码可能不一致，导致 404。

**解决方案：改英文文件名（`help.html`）是根本解法**，`decodeURIComponent` 是兜底。

### 3.4 Redmine 简报格式

Redmine Journal 留言（`notes` 字段）的渲染行为取决于实例配置：
- 老版本 Redmine/Rails 对 Markdown、emoji（4字节 Unicode）的兼容性差，容易 500
- **稳妥方案**：先用 Textile 格式，如不行改纯文本；发送前用正则去除 4字节 emoji

```javascript
content = content.replace(/[\u{1F300}-\u{1FFFF}]/gu, '');
```

---

## 四、功能迭代节奏

### 典型的一次迭代

1. **用户描述需求**（一句话或截图）
2. **AI 分析影响范围**：哪些函数要改，有没有数据结构变更
3. **最小可用改动**：只动必要的代码，其他不碰
4. **JS 语法验证**：提取 script 块，`node --check`
5. **用户在浏览器里验收**：刷新页面，测试功能
6. **快速修复**：如有问题，立刻定位，改完再验证
7. **提交进 memory**：记录本次改了什么、为什么

### 粒度原则

- **UI 调整**（颜色、布局、文案）：可以批量做，一次提交多个
- **逻辑/数据结构变更**：一次只做一件事，改完立刻验证
- **重构**：先备份或确保有 git 历史，逐步替换，不要大刀阔斧一次全改

---

## 五、文档同步规范

文档不是开发完再补的，是**和代码同步演进**的：

| 文档 | 内容 | 更新时机 |
|------|------|---------|
| `CHANGELOG.md` | 每个版本的变更列表 | 每次 release 前 |
| `SPEC.md` | 功能规格说明 | 新增功能时同步更新 |
| `README.md` | 快速上手 + 场景示例 | 大版本时更新 |
| `help.html` | 完整使用说明（用户端） | 功能稳定后更新 |
| `.workbuddy/memory/` | 开发过程工作记忆 | 每次实质性改动后追加 |

---

## 六、Release 流程

```
1. 更新 CHANGELOG.md（补全本版本条目，修正版本号）
2. 更新 SPEC.md 版本号
3. 创建 release/vX.Y-alpha/ 目录
4. 复制核心文件：index.html, server.js, help.html, 启动.bat,
                  README.md, SPEC.md, CHANGELOG.md, data.example.json
5. 写 release/vX.Y-alpha/README.md（该版本专属说明）
6. git add -A && git commit -m "release: vX.Y-alpha"
7. git push origin main
8. git push bitbucket main（同步镜像）
```

**文件清单检查（v1.1-alpha 共 8 个文件）：**

```
release/v1.1-alpha/
  ├── index.html          主应用
  ├── server.js           本地服务器 + Redmine 代理
  ├── help.html           使用说明页
  ├── 启动.bat            一键启动脚本
  ├── README.md           版本专属说明
  ├── SPEC.md             功能规格
  ├── CHANGELOG.md        变更记录
  └── data.example.json   数据示例
```

---

## 七、AI 协作经验

本项目完全由 AI（WorkBuddy）辅助开发，以下是有效的协作模式：

### 什么样的需求描述效率最高？

- **给结果，不给实现**：「把条件筛选做成多选下拉」比「在某某函数里加一个 array 然后……」清晰得多
- **附截图或错误信息**：比文字描述快 10 倍
- **一次一个功能点**：避免「顺便再改一下……」，容易引入遗漏

### 什么时候要人工介入？

- **视觉验收**：颜色、间距、对齐——AI 写得出来，但看不到效果，需要人眼确认
- **业务判断**：平台示例用 Socket/COB 还是 Android/iOS，这是业务决策不是技术问题
- **数据恢复**：localStorage 里有数据但不在 data.json，这需要人手动操作

### 避免踩坑的工作习惯

- **每次改完，告诉 AI 验证结果**：「刷新后 X 功能 OK，Y 还有问题」，AI 才能准确定位
- **不要说「感觉没问题」就跳过**：尤其是数据结构变更，要实际存一条数据再读出来确认
- **复杂改动前先描述影响范围**：「这个改动会影响哪些函数？」，AI 会先分析再动手

---

## 八、已知技术债

| 问题 | 影响 | 优先级 |
|------|------|--------|
| 单文件架构（index.html 已很大） | 维护难度随功能增加上升 | 中（短期不影响使用） |
| localStorage 降级无明显提示 | 用户可能以为数据存上了 | 高 |
| 无自动化测试 | 每次改动靠人工验收 | 中 |
| Redmine API Key 存 localStorage 明文 | 非生产环境可接受 | 低（内部工具） |

---

## 九、版本历史速览

| 版本 | 日期 | 主要内容 |
|------|------|---------|
| v1.0-alpha | 2026-03-28 | 基础 P/F 录入、平台独立条件、拖拽排序、Excel 导入导出、MCP Server |
| v1.1-alpha | 2026-03-29 | Redmine 集成（关联 Issue + 同步简报）、统计视图独立筛选、帮助页、server.js 修复 |

---

*文档生成时间：2026-03-29*
