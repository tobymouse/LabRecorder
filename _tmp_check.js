<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>实验记录系统</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%231e40af'/><text x='16' y='23' font-size='20' text-anchor='middle' font-family='serif'>🔬</text></svg>">



<style>
  :root {
    --pass-color: #22c55e;
    --fail-color: #f97316;
    --pass-bg: #dcfce7;
    --fail-bg: #ffedd5;
    --header-bg: #eff6ff;
    --group-bg: #f0f9ff;
    --border: #d1d5db;
    --primary: #3b82f6;
    --primary-dark: #1d4ed8;
    --sidebar-w: 260px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif; background: #f8fafc; color: #1e293b; padding-bottom: 14px; }

  /* ── 顶部导航 ── */
  .topbar {
    position: fixed; top: 0; left: 0; right: 0; height: 52px;
    background: linear-gradient(90deg, #1e40af, #3b82f6);
    display: flex; align-items: center; padding: 0 16px; gap: 12px;
    z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,.18);
  }
  .topbar h1 { color: #fff; font-size: 17px; font-weight: 600; flex: 1; }
  .topbar .badge { background: rgba(255,255,255,.2); color: #fff; font-size: 11px; padding: 2px 8px; border-radius: 20px; }
  .btn { cursor: pointer; border: none; border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500; transition: all .15s; }
  .btn-primary { background: #fff; color: #1e40af; }
  .btn-primary:hover { background: #dbeafe; }
  .btn-danger { background: #ef4444; color: #fff; }
  .btn-danger:hover { background: #dc2626; }
  .btn-success { background: #22c55e; color: #fff; }
  .btn-success:hover { background: #16a34a; }
  .btn-outline { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.5); }
  .btn-outline:hover { background: rgba(255,255,255,.15); }

  /* ── 侧边栏 ── */
  .layout { display: flex; padding-top: 52px; min-height: 100vh; }
  .sidebar {
    width: var(--sidebar-w); flex-shrink: 0;
    background: #fff; border-right: 1px solid var(--border);
    padding: 16px 12px; overflow-y: auto;
    position: fixed; top: 52px; bottom: 0; left: 0;
    transition: width .2s ease, padding .2s ease;
  }
  .sidebar.collapsed { width: 36px; padding: 12px 6px; overflow: hidden; }
  .sidebar.collapsed .sidebar-body { display: none; }
  .sidebar-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; cursor: pointer; user-select: none;
  }
  .sidebar.collapsed .sidebar-header { justify-content: center; margin-bottom: 0; }
  .sidebar-toggle {
    width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
    border-radius: 5px; color: #94a3b8; font-size: 14px; flex-shrink: 0;
    transition: background .1s;
  }
  .sidebar-toggle:hover { background: #f1f5f9; color: #475569; }
  .sidebar-section { margin-bottom: 20px; }
  .sidebar-section h3 { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; padding: 0 4px; }
  .record-item {
    padding: 8px 10px; border-radius: 7px; cursor: pointer;
    margin-bottom: 4px; transition: background .1s;
    border: 1px solid transparent;
  }
  .record-item:hover { background: #f1f5f9; }
  .record-item.active { background: #dbeafe; border-color: #93c5fd; }
  .record-item .rec-name { font-size: 13px; font-weight: 500; }
  .record-item .rec-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .record-item .rec-actions { display: none; gap: 4px; margin-top: 4px; }
  .record-item:hover .rec-actions { display: flex; }
  .rec-btn { font-size: 11px; padding: 2px 6px; border-radius: 4px; cursor: pointer; border: 1px solid var(--border); background: #fff; }
  .rec-btn:hover { background: #f1f5f9; }
  .rec-btn.del { color: #ef4444; border-color: #fca5a5; }
  .rec-btn.del:hover { background: #fef2f2; }

  /* ── 主区域 ── */
  .main { margin-left: var(--sidebar-w); flex: 1; padding: 20px; min-width: 0; max-width: calc(100vw - var(--sidebar-w)); overflow-x: visible; transition: margin-left .2s ease; }
  .sidebar.collapsed ~ .main { margin-left: 36px; max-width: calc(100vw - 36px); }

  /* ── 工具栏 ── */
  .toolbar-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 16px;
  }
  .toolbar {
    background: #fff; border-radius: 10px; padding: 14px 16px;
    display: flex; flex-wrap: wrap; gap: 10px;
    align-items: center; box-shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  .toolbar-container .toolbar:first-child {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    margin-bottom: 0;
  }
  .toolbar-container .toolbar:last-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: 0;
  }
  .toolbar-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 0;
  }
  .toolbar input[type=text] {
    padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px;
    font-size: 13px; outline: none; transition: border .15s;
  }
  .toolbar input[type=text]:focus { border-color: var(--primary); }
  .toolbar input[type=number] { transition: border-color .15s; }
  .toolbar input[type=number]:focus { border-color: var(--primary); }
  .toolbar input[type=number]::selection { background: #bfdbfe; color: #1e3a8a; }
  #expNotePreview { transition: border-color .15s; }
  #expNotePreview:hover { border-color: var(--primary); }
  .toolbar-sep { flex: 1; }

  /* ── 搜索栏 ── */
  .search-bar {
    background: #fff; border-radius: 10px; padding: 12px 16px;
    margin-bottom: 16px; display: flex; gap: 10px; align-items: center;
    box-shadow: 0 1px 4px rgba(0,0,0,.08); flex-wrap: wrap;
  }
  .search-bar input, .search-bar select {
    padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px;
    font-size: 13px; outline: none;
  }
  .search-bar input:focus, .search-bar select:focus { border-color: var(--primary); }
  .search-tag { display: inline-flex; align-items: center; gap: 4px; background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 20px; font-size: 12px; }

  /* ── 多选下拉组件 ── */
  .ms-wrap { position: relative; display: inline-block; }
  .ms-btn {
    display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
    padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px;
    font-size: 13px; background: #fff; white-space: nowrap; user-select: none;
    min-width: 90px; max-width: 160px;
  }
  .ms-btn:hover { border-color: var(--primary); }
  .ms-btn.active { border-color: var(--primary); background: #eff6ff; }
  .ms-btn .ms-label { flex: 1; overflow: hidden; text-overflow: ellipsis; }
  .ms-btn .ms-arrow { font-size: 10px; color: #94a3b8; transition: transform .2s; }
  .ms-btn.open .ms-arrow { transform: rotate(180deg); }
  .ms-panel {
    display: none; position: absolute; top: calc(100% + 4px); left: 0; z-index: 1000;
    background: #fff; border: 1px solid var(--border); border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,.12); min-width: 140px; max-width: 200px;
    max-height: 240px; overflow-y: auto; padding: 4px 0;
  }
  .ms-panel.show { display: block; }
  .ms-panel-head {
    display: flex; gap: 4px; padding: 6px 8px 4px;
    font-size: 12px;
  }
  .ms-panel-head button {
    flex: 1; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px;
    background: #f8fafc; cursor: pointer; font-size: 11px; color: #475569;
  }
  .ms-panel-head button:hover { background: #e2e8f0; }
  .ms-item {
    display: flex; align-items: center; gap: 8px; padding: 5px 10px;
    cursor: pointer; font-size: 13px; transition: background .1s;
  }
  .ms-item:hover { background: #f8fafc; }
  .ms-item input[type=checkbox] { margin: 0; cursor: pointer; accent-color: var(--primary); }
  .ms-group-header {
    padding: 8px 10px 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 4px;
  }

  /* 隐藏眼睛按钮 */
  .eye-btn { font-size: 13px; cursor: pointer; opacity: .55; transition: opacity .15s; margin-right: 2px; }
  .eye-btn:hover { opacity: 1; }

  /* ── 实验表格容器 ── */
  .table-container {
    background: #fff; border-radius: 10px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
    overflow-x: scroll; overflow-y: visible;
    margin-bottom: 16px;
  }
  table { border-collapse: collapse; min-width: 100%; font-size: 12px; }
  th, td { border: 1px solid var(--border); white-space: nowrap; }
  
  table { border-collapse: collapse; min-width: 100%; font-size: 12px; }
  th, td { border: 1px solid var(--border); white-space: nowrap; }
  th { background: var(--header-bg); font-weight: 600; padding: 6px 10px; text-align: center; }
  th.cond-header { background: #dbeafe; font-size: 13px; color: #1d4ed8; }
  td { padding: 4px 6px; text-align: center; min-width: 60px; }
  
  /* 数据行交替背景色 */
  tr.sample-even td:not(.cat-cell):not(.ic-cell) { background: #f8fafc; }
  tr.sample-odd  td:not(.cat-cell):not(.ic-cell) { background: #ffffff; }
  
  td.cat-cell { background: #eff6ff; font-weight: 600; writing-mode: horizontal-tb; min-width: 60px; vertical-align: middle; color: #1e40af; }
  td.ic-cell { background: #f8fafc; color: #334155; font-weight: 600; min-width: 40px; }
  td.summary-cell-col { min-width: 68px; padding: 0 !important; vertical-align: top; }
  .add-sample-row td { background: #f8fafc; }
  .add-sample-row:hover td { background: inherit !important; }
  .add-sample-btn { color: #3b82f6; font-size: 13px; cursor: pointer; padding: 2px 8px; border-radius: 4px; border: 1px dashed #93c5fd; background: #f8fafc; }
  .add-sample-btn:hover { background: #e0f2fe; }
  .add-round-row td { background: #eff6ff; }
  .add-round-btn { color: #3b82f6; font-size: 12px; cursor: pointer; padding: 2px 8px; border-radius: 4px; border: 1px dashed #93c5fd; background: #eff6ff; white-space:nowrap; }
  .add-round-btn:hover { background: #dbeafe; }
  .del-round-btn { color: #f97316; font-size: 12px; cursor: pointer; padding: 2px 8px; border-radius: 4px; border: 1px dashed #fdba74; background: #fff7ed; white-space:nowrap; }
  .del-round-btn:hover { background: #ffedd5; }
  .del-sample-btn { color: #ef4444; font-size: 12px; cursor: pointer; padding: 2px 8px; border-radius: 4px; border: 1px dashed #fca5a5; background: #fff1f2; white-space:nowrap; }
  .del-sample-btn:hover { background: #e0f2fe; }
  .add-cat-btn { display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; color: #3b82f6; font-size: 12px; cursor: pointer; padding: 3px 10px; border-radius: 4px; border: 1px dashed #93c5fd; background: #eff6ff; }
  .add-cat-btn:hover { background: #dbeafe; }
  /* 同一样本的非首次行：去掉上边框；上一行（前序行）的下边框也去掉，融为一组 */
  tr.same-sample-row td { border-top: none !important; }
  tr:has(+ tr.same-sample-row) td { border-bottom: none !important; }
  /* 行高亮：!important 确保覆盖 sample-even/odd 的背景色 */
  tr.sample-even:hover td,
  tr.sample-odd:hover  td { background: #e0f2fe !important; }
  tr:hover td.cat-cell { background: #e0f2fe !important; }
  tr:hover td.ic-cell  { background: #e0f2fe !important; }
  /* add-sample-row 不参与行高亮 */
  tr.add-sample-row:hover td { background: #f8fafc !important; }
  /* cat-cell 联动高亮（rowspan跨行时由JS控制） */
  td.cat-cell.cat-hover { background: #e0f2fe !important; }
  td.ic-cell.ic-hover   { background: #e0f2fe !important; }
  /* passrate 行保持原背景，不被 hover 覆盖 */
  tr.passrate-row td { background: #eff6ff; font-weight: 700; font-size: 12px; color: #1e3a8a; border-top: 2px solid #93c5fd; }
  tr.passrate-row td.pr-label { background: #dbeafe; }
  tr.passrate-row:hover td { background: #eff6ff !important; }
  tr.passrate-row:hover td.pr-label { background: #dbeafe !important; }
  tr.cat-passrate-row:hover td { background: #eff6ff !important; }
  tr.cat-passrate-row:hover td.cpr-label { background: #dbeafe !important; }

  /* ── P/F 标签 ── */
  .result-cell { cursor: pointer; min-width: 72px; padding: 0 !important; vertical-align: middle; }
  /* 每次测试对齐行 */
  .round-row { display: flex; align-items: center; justify-content: center; padding: 3px 4px; min-height: 28px; }
  .round-row:last-child { border-bottom: none; }
  .round-row.add-row { min-height: 24px; }
  .tag {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer;
    transition: transform .1s;
  }
  .tag:hover { transform: scale(1.08); box-shadow: 0 1px 4px rgba(0,0,0,.15); }
  .tag.pass { background: var(--pass-bg); color: var(--pass-color); border: 1px solid var(--pass-color); }
  .tag.fail { background: var(--fail-bg); color: var(--fail-color); border: 1px solid var(--fail-color); }
  .tag.empty { background: #f1f5f9; color: #94a3b8; border: 1px dashed #cbd5e1; }
  .tag .del-tag { opacity: .6; font-size: 10px; cursor: pointer; }
  .tag .del-tag:hover { opacity: 1; color: #ef4444; }
  .add-result-btn { color: #94a3b8; font-size: 15px; cursor: pointer; line-height: 1; }
  .add-result-btn:hover { color: var(--primary); }
  /* 总结列每行对齐 */
  .summary-cell { padding: 0 !important; min-width: 68px; }
  .sum-row { display: flex; align-items: center; justify-content: center; padding: 3px 4px; min-height: 28px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: 700; }
  .sum-row:last-child { border-bottom: none; }
  .sum-row.pass { background: #dcfce7; color: #16a34a; }
  .sum-row.fail { background: #ffedd5; color: #ea580c; }
  .sum-row.empty { background: #f8fafc; color: #cbd5e1; }
  /* 分类 Pass Rate 小计行 */
  tr.cat-passrate-row td { background: #eff6ff; font-size: 12px; color: #1d4ed8; border-top: 1px dashed #93c5fd; }
  tr.cat-passrate-row td.cpr-label { background: #dbeafe; font-weight: 600; color: #1e3a8a; font-size: 11px; text-align: center; }

  /* ── 单元格快速下拉 ── */
  #cellDropdown {
    display: none; position: fixed; z-index: 300;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,.15); padding: 4px; min-width: 110px;
    animation: dropIn .12s ease;
  }
  #cellDropdown.show { display: block; }
  #addRoundDropdown {
    display: none; position: fixed; z-index: 300;
    background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,.15); padding: 4px; min-width: 130px;
    animation: dropIn .12s ease;
  }
  #addRoundDropdown.show { display: block; }
  @keyframes dropIn { from { opacity:0; transform: translateY(-6px) scale(.96); } to { opacity:1; transform: none; } }
  .cd-item {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 12px; border-radius: 7px; cursor: pointer; font-size: 13px; font-weight: 500;
    transition: background .1s;
  }
  .cd-item:hover { background: #f1f5f9; }
  .cd-item.cd-pass { color: var(--pass-color); }
  .cd-item.cd-pass:hover { background: var(--pass-bg); }
  .cd-item.cd-fail { color: var(--fail-color); }
  .cd-item.cd-fail:hover { background: var(--fail-bg); }
  .cd-item.cd-empty { color: #94a3b8; }
  .cd-item.cd-note { color: #6366f1; }
  .cd-item.cd-del { color: #ef4444; border-top: 1px solid #f1f5f9; margin-top: 2px; padding-top: 9px; }
  .cd-item.cd-del:hover { background: #fff1f2; }
  .cd-item.cd-redmine { color: #b45309; }
  .cd-item.cd-redmine:hover { background: #fef3c7; }
  .cd-sep { height: 1px; background: #f1f5f9; margin: 3px 0; }

  /* ── Redmine 配置弹窗 ── */
  #redmineCfgModal .modal { max-width: 440px; width: 95vw; }
  #redmineCfgModal .rm-field { margin-bottom: 12px; }
  #redmineCfgModal .rm-field label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
  #redmineCfgModal .rm-field input,
  #redmineCfgModal .rm-field select { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; outline: none; transition: border-color .15s; }
  #redmineCfgModal .rm-field input:focus,
  #redmineCfgModal .rm-field select:focus { border-color: #3b82f6; }
  #redmineCfgModal .rm-hint { font-size: 11px; color: #94a3b8; margin-top: 3px; }

  /* ── Redmine Issue 提交弹窗 ── */
  #redmineIssueModal .modal { max-width: 480px; width: 95vw; }
  #redmineIssueModal .rm-field { margin-bottom: 12px; }
  #redmineIssueModal .rm-field label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
  #redmineIssueModal .rm-field input,
  #redmineIssueModal .rm-field select,
  #redmineIssueModal .rm-field textarea { width: 100%; padding: 7px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; outline: none; transition: border-color .15s; font-family: inherit; resize: vertical; }
  #redmineIssueModal .rm-field input:focus,
  #redmineIssueModal .rm-field select:focus,
  #redmineIssueModal .rm-field textarea:focus { border-color: #3b82f6; }
  #redmineIssueModal .rm-info-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #92400e; margin-bottom: 14px; line-height: 1.5; }
  .rm-issue-link { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: #3b82f6; text-decoration: none; vertical-align: middle; margin-left: 3px; }
  .rm-issue-link:hover { text-decoration: underline; }

  /* ── Redmine Issue 搜索 ── */
  .rm-search-wrap { position: relative; }
  .rm-search-wrap input { padding-right: 70px !important; }
  .rm-search-btn { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); padding: 3px 10px; background: #3b82f6; color: #fff; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; }
  .rm-search-btn:hover { background: #2563eb; }
  .rm-issue-list { border: 1px solid #e2e8f0; border-radius: 6px; max-height: 200px; overflow-y: auto; margin-top: 6px; display: none; }
  .rm-issue-list.show { display: block; }
  .rm-issue-item { padding: 7px 10px; cursor: pointer; border-bottom: 1px solid #f1f5f9; font-size: 12px; display: flex; gap: 8px; align-items: flex-start; transition: background .12s; }
  .rm-issue-item:last-child { border-bottom: none; }
  .rm-issue-item:hover { background: #eff6ff; }
  .rm-issue-item.selected { background: #dbeafe; }
  .rm-issue-item .ri-id { color: #64748b; white-space: nowrap; font-weight: 600; }
  .rm-issue-item .ri-subj { flex: 1; color: #1e293b; }
  .rm-issue-item .ri-status { font-size: 11px; color: #94a3b8; white-space: nowrap; }
  .rm-new-issue-row { padding: 7px 10px; cursor: pointer; font-size: 12px; color: #16a34a; font-weight: 600; border-top: 1px dashed #bbf7d0; display: flex; align-items: center; gap: 6px; }
  .rm-new-issue-row:hover { background: #f0fdf4; }
  .rm-mode-hint { font-size: 11px; color: #3b82f6; margin-top: 4px; font-weight: 500; }
  /* 新建区域折叠 */
  .rm-new-section { display: none; }
  .rm-new-section.show { display: block; }
  /* 追加描述编辑区 */
  .rm-append-section { display: none; margin-top: 12px; }
  .rm-append-section.show { display: block; }
  .rm-append-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .rm-append-header .rm-append-label { font-size: 12px; font-weight: 600; color: #475569; }
  .rm-append-header .rm-append-fmt { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; }
  .rm-append-header .rm-append-fmt select { font-size: 11px; padding: 2px 5px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; color: #334155; cursor: pointer; }
  .rm-append-header .rm-append-reset { font-size: 11px; color: #94a3b8; cursor: pointer; padding: 1px 6px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; transition: all .12s; }
  .rm-append-header .rm-append-reset:hover { color: #3b82f6; border-color: #93c5fd; background: #eff6ff; }
  /* Quill 编辑器定制 */
  #rmAppendQuill { border-radius: 0 0 6px 6px; font-size: 13px; min-height: 90px; max-height: 220px; overflow-y: auto; }
  .rm-append-section .ql-toolbar { border-radius: 6px 6px 0 0; border-color: #d1d5db; background: #f8fafc; padding: 4px 6px; }
  .rm-append-section .ql-toolbar .ql-formats { margin-right: 8px; }
  .rm-append-section .ql-container { border-color: #d1d5db; font-family: inherit; }
  .rm-append-section .ql-container:focus-within { border-color: #3b82f6; }
  .rm-append-section .ql-editor { min-height: 90px; max-height: 220px; padding: 8px 10px; font-size: 13px; color: #334155; line-height: 1.6; }
  .rm-append-section .ql-editor p { margin: 0 0 4px; }
  .rm-append-section label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
  .rm-append-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }

  /* ── 备注弹窗 Quill ── */
  #noteModal .ql-toolbar { border-radius: 6px 6px 0 0; border-color: #d1d5db; background: #f8fafc; padding: 4px 6px; }
  #noteModal .ql-container { border-radius: 0 0 6px 6px; border-color: #d1d5db; font-family: inherit; }
  #noteModal .ql-editor { min-height: 160px; padding: 8px 10px; font-size: 13px; color: #334155; line-height: 1.6; }
  #noteModal .ql-editor p { margin: 0 0 4px; }

  /* ── 同步简报弹窗 ── */
  #rmSyncModal .modal { max-width: 540px; width: 95vw; }
  #rmSyncModal .rm-field { margin-bottom: 12px; }
  #rmSyncModal .rm-field label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 500; }
  /* 简报 Quill 容器 */
  #rmSyncContentQuill { min-height: 400px; max-height: 600px; overflow-y: auto; border-radius: 0 0 6px 6px; font-size: 12px; font-family: monospace; line-height: 1.6; }
  #rmSyncModal .ql-toolbar { border-radius: 6px 6px 0 0; border-color: #d1d5db; background: #f8fafc; padding: 4px 6px; }
  /* 新建 Issue 描述 Quill 容器 */
  #rmIssueDescQuill { min-height: 100px; max-height: 220px; overflow-y: auto; border-radius: 0 0 6px 6px; font-size: 13px; }
  #redmineIssueModal .ql-toolbar { border-radius: 6px 6px 0 0; border-color: #d1d5db; background: #f8fafc; padding: 4px 6px; }
  #rmSyncModal .rm-issue-targets { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #f8fafc; max-height: 160px; overflow-y: auto; }
  #rmSyncModal .rm-target-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
  #rmSyncModal .rm-target-item input[type=checkbox] { accent-color: #3b82f6; width: 14px; height: 14px; flex-shrink: 0; }
  #rmSyncModal .rm-target-item a { color: #3b82f6; text-decoration: none; font-weight: 600; }
  #rmSyncModal .rm-target-item a:hover { text-decoration: underline; }
  #rmSyncModal .rm-target-item span { color: #475569; flex: 1; font-size: 12px; }

  /* ── 浮层弹窗 ── */
  .modal-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,.4); z-index: 200; align-items: center; justify-content: center;
  }
  .modal-overlay.show { display: flex; }
  .modal {
    background: #fff; border-radius: 12px; padding: 24px; min-width: 320px; max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,.2); position: relative;
  }
  .modal h2 { font-size: 16px; margin-bottom: 16px; }
  .modal .close-btn { position: absolute; top: 14px; right: 14px; cursor: pointer; color: #94a3b8; font-size: 18px; line-height: 1; }
  .modal .close-btn:hover { color: #1e293b; }
  .form-row { margin-bottom: 12px; }
  .form-row label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .form-row input, .form-row select {
    width: 100%; padding: 8px 10px; border: 1px solid var(--border);
    border-radius: 6px; font-size: 13px; outline: none;
  }
  .form-row input:focus, .form-row select:focus { border-color: var(--primary); }
  .chip-group { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 6px 14px; border-radius: 20px; border: 2px solid var(--border);
    cursor: pointer; font-size: 13px; font-weight: 500; transition: all .1s;
  }
  .chip.pass { border-color: var(--pass-color); color: var(--pass-color); }
  .chip.pass.sel { background: var(--pass-bg); }
  .chip.fail { border-color: var(--fail-color); color: var(--fail-color); }
  .chip.fail.sel { background: var(--fail-bg); }
  .modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  /* ── 管理面板 ── */
  .manage-section { margin-bottom: 20px; }
  .manage-section h3 { font-size: 13px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
  .tag-list { display: flex; flex-wrap: wrap; gap: 8px; min-height: 36px; }
  .editable-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: #f1f5f9; border: 1px solid var(--border); border-radius: 20px;
    padding: 4px 10px; font-size: 13px; cursor: grab;
    user-select: none; transition: box-shadow .15s, opacity .15s;
  }
  .editable-tag:hover { border-color: var(--primary); background: #eff6ff; }
  .editable-tag .x { cursor: pointer; color: #94a3b8; }
  .editable-tag .x:hover { color: #ef4444; }
  .editable-tag.dragging { opacity: .4; cursor: grabbing; }
  .editable-tag.drag-over { border-color: var(--primary); box-shadow: 0 0 0 2px #bfdbfe; background: #eff6ff; }
  .drag-handle { color: #94a3b8; font-size: 11px; margin-right: -2px; cursor: grab; }
  .tag-list .drag-placeholder {
    display: inline-flex; align-items: center; min-width: 60px; height: 30px;
    border: 2px dashed #93c5fd; border-radius: 20px; background: #eff6ff;
  }
  .add-inline { display: flex; gap: 6px; margin-top: 8px; }
  .add-inline input { flex: 1; padding: 6px 10px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; outline: none; }
  .add-inline input:focus { border-color: var(--primary); }

  /* ── 统计面板 ── */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; margin-top: 16px; }

  .stat-card {
    background: #fff; border-radius: 10px; padding: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08); text-align: center;
  }
  .stat-card .val { font-size: 28px; font-weight: 700; }
  .stat-card .lbl { font-size: 12px; color: #64748b; margin-top: 4px; }
  .stat-card.pass .val { color: var(--pass-color); }
  .stat-card.fail .val { color: var(--fail-color); }
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .chart-card {
    background: #fff; border-radius: 10px; padding: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,.08);
  }
  .chart-card h3 { font-size: 13px; font-weight: 600; margin-bottom: 12px; color: #475569; }
  .chart-wrap { position: relative; height: 240px; }

  /* ── 空状态 ── */
  .empty-state { padding: 60px 20px; text-align: center; color: #94a3b8; }
  .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state p { font-size: 14px; }

  /* ── Tab 切换 ── */
  .tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 8px; padding: 4px; margin-bottom: 16px; width: fit-content; }
  .tab { padding: 7px 18px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: #64748b; transition: all .15s; }
  .tab.active { background: #fff; color: #1e40af; box-shadow: 0 1px 4px rgba(0,0,0,.1); }

  /* ── 响应式 ── */
  @media (max-width: 900px) {
    .charts-grid { grid-template-columns: 1fr; }
  }

  .highlight { background: #fef08a !important; }
  .no-results { padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; }

  /* ── 平台管理块 ── */
  .plat-block {
    border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 12px; margin-bottom: 10px; background: #fafbfc;
    transition: border-color .15s;
  }
  .plat-block:hover { border-color: #93c5fd; }
  .plat-block.drag-over { border-color: var(--primary); box-shadow: 0 0 0 2px #bfdbfe; background: #eff6ff; }
  .plat-block-header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
  }
  .plat-block-header .plat-name {
    font-size: 13px; font-weight: 600; color: #1e40af;
    cursor: pointer; padding: 2px 6px; border-radius: 4px;
    border: 1px solid transparent;
  }
  .plat-block-header .plat-name:hover { border-color: var(--primary); background: #eff6ff; }
  .plat-block-header .plat-del {
    margin-left: auto; font-size: 11px; color: #ef4444; cursor: pointer;
    padding: 2px 6px; border-radius: 4px; border: 1px solid #fca5a5;
  }
  .plat-block-header .plat-del:hover { background: #fef2f2; }
  .plat-block-header .eye-btn { font-size:13px; cursor:pointer; opacity:.55; }
  .plat-block-header .eye-btn:hover { opacity:1; }
  .plat-block .tag-list { min-height: 28px; }
  .plat-block .add-inline { margin-top: 6px; }

</style>
</head>
<body>

<!-- 顶部导航 -->
<div class="topbar">
  <div style="display:flex;align-items:center;gap:26px;flex:1;min-width:0;">
    <h1 style="flex:none;">🔬 实验记录系统</h1>
    <a href="/help.html" target="_blank" title="查看使用说明" style="font-size:12px;line-height:1;text-decoration:none;color:rgba(255,255,255,.75);background:rgba(255,255,255,.2);border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">?</a>
  </div>
  <span class="badge" id="recordCount">0 条记录</span>
  <button class="btn btn-outline" onclick="openManageModal()">⚙ 管理字段</button>
  <button class="btn btn-outline" onclick="showTab('stats')">📊 统计</button>
  <button class="btn btn-outline" id="redmineCfgBtn" onclick="openRedmineCfgModal()" title="Redmine 集成配置">🐛 Redmine</button>
  <button class="btn btn-outline" onclick="openRedmineIssueModal()" title="关联/新建 Redmine Issue">🐛 提 Issue</button>
  <button class="btn btn-outline" id="rmSyncBtn" onclick="openRmSyncModal()" title="将实验统计简报同步到关联的 Redmine Issue" style="display:none;">📤 同步简报</button>
  <button class="btn btn-primary" onclick="newRecord()">＋ 新建实验</button>
</div>

<div class="layout">
  <!-- 侧边栏：历史记录 -->
  <div class="sidebar" id="sidebar">
    <div class="sidebar-header" onclick="toggleSidebar()">
      <span class="sidebar-section-title" style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;">历史实验</span>
      <span class="sidebar-toggle" id="sidebarToggleIcon">◀</span>
    </div>
    <div class="sidebar-body">
      <div id="recordList"><div class="no-results">暂无记录</div></div>
    </div>
  </div>

  <!-- 主区域 -->
  <div class="main">
    <div class="tabs">
      <div class="tab active" onclick="showTab('table')" id="tab-table">📋 实验表格</div>
      <div class="tab" onclick="showTab('stats')" id="tab-stats">📊 统计分析</div>
    </div>

    <!-- 表格视图 -->
    <div id="view-table">
      <!-- 工具栏容器 -->
      <div class="toolbar-container">
        <!-- 工具栏第一行：实验信息 -->
        <div class="toolbar" id="toolbar">
          <input type="text" id="expName" placeholder="实验名称" style="width:200px">
          <span id="expNotePreview" onclick="openNoteModal()" title="点击编辑实验备注"
            style="display:inline-flex;align-items:center;gap:6px;max-width:160px;font-size:13px;color:#374151;border:1px solid var(--border);border-radius:6px;padding:6px 12px;background:#fff;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            <span id="expNoteText" style="overflow:hidden;text-overflow:ellipsis;flex:1;">备注（可选）</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.5;"><path d="M11.5 2.5a2.121 2.121 0 1 1 3 3L5 15H1v-4L11.5 2.5z"/></svg>
          </span>
          <span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;" title="目标通过率，低于此值显示青绿">目标PR：<input type="number" id="expTargetPR" min="0" max="100" step="1" value="80" style="width:52px;font-size:12px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;background:#fff;">%</span>
          <span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:4px;" title="报警通过率，低于此值显示红色">报警PR：<input type="number" id="expAlarmPR" min="0" max="100" step="1" value="60" style="width:52px;font-size:12px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;background:#fff;">%</span>
          <button class="btn" style="font-size:12px;padding:2px 10px;background:#f1f5f9;color:#374151;border:none;border-radius:4px;cursor:pointer;" title="按目标PR/报警PR刷新表格颜色" onclick="renderTable();">↺ 刷新</button>
          <div style="flex: 1"></div>
          <button class="btn btn-outline" style="background:#f1f5f9;color:#374151;" onclick="exportExcel()">⬇ 导出 Excel</button>
          <label class="btn btn-outline" style="background:#eff6ff;color:#1d4ed8;cursor:pointer;" title="导入之前导出的Excel文件">
            ⬆ 导入 Excel
            <input type="file" accept=".xlsx,.xls" style="display:none" onchange="importExcel(event)">
          </label>
          <button class="btn btn-success" onclick="saveRecord()">💾 保存</button>
        </div>

        <!-- 工具栏第二行：筛选 -->
        <div class="toolbar" id="filterToolbar">
          <span style="font-size:13px;color:#64748b;font-weight:500;">筛选：</span>
          <input type="text" id="searchText" placeholder="搜索样本/分类/条件..." oninput="applyFilter()" style="width:160px">
          <div class="ms-wrap" id="mswrap-result">
            <div class="ms-btn" id="msbtn-result" onclick="msToggle('result')">
              <span class="ms-label" id="mslabel-result">全部结果</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-result">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('result')">全选</button>
                <button onclick="msClearAll('result')">清空</button>
              </div>
              <div id="mslist-result"></div>
            </div>
          </div>
          <div class="ms-wrap" id="mswrap-cat">
            <div class="ms-btn" id="msbtn-cat" onclick="msToggle('cat')">
              <span class="ms-label" id="mslabel-cat">全部分类</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-cat">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('cat')">全选</button>
                <button onclick="msClearAll('cat')">清空</button>
              </div>
              <div id="mslist-cat"></div>
            </div>
          </div>
          <div class="ms-wrap" id="mswrap-plat">
            <div class="ms-btn" id="msbtn-plat" onclick="msToggle('plat')">
              <span class="ms-label" id="mslabel-plat">全部平台</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-plat">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('plat')">全选</button>
                <button onclick="msClearAll('plat')">清空</button>
              </div>
              <div id="mslist-plat"></div>
            </div>
          </div>
          <div class="ms-wrap" id="mswrap-cond">
            <div class="ms-btn" id="msbtn-cond" onclick="msToggle('cond')">
              <span class="ms-label" id="mslabel-cond">全部条件</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-cond">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('cond')">全选</button>
                <button onclick="msClearAll('cond')">清空</button>
              </div>
              <div id="mslist-cond"></div>
            </div>
          </div>
          <div class="ms-wrap" id="mswrap-item">
            <div class="ms-btn" id="msbtn-item" onclick="msToggle('item')">
              <span class="ms-label" id="mslabel-item">全部项目</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-item">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('item')">全选</button>
                <button onclick="msClearAll('item')">清空</button>
              </div>
              <div id="mslist-item"></div>
            </div>
          </div>
          <div class="ms-wrap" id="mswrap-round">
            <div class="ms-btn" id="msbtn-round" onclick="msToggle('round')">
              <span class="ms-label" id="mslabel-round">全部次数</span>
              <span class="ms-arrow">▼</span>
            </div>
            <div class="ms-panel" id="mspanel-round">
              <div class="ms-panel-head">
                <button onclick="msSelectAll('round')">全选</button>
                <button onclick="msClearAll('round')">清空</button>
              </div>
              <div id="mslist-round"></div>
            </div>
          </div>
          <button class="btn" style="padding:5px 12px;background:#f1f5f9;font-size:12px;" onclick="clearFilter()">✕ 清除</button>
        </div>
      </div>

      <!-- 实验表格 -->
      <div class="table-container">
        <div id="tableWrap"></div>
      </div>
    </div>

    <!-- 统计视图 -->
    <div id="view-stats" style="display:none">
      <div class="toolbar" style="margin-bottom:16px;">
        <span style="font-size:13px;color:#64748b;font-weight:500;">筛选：</span>
        <!-- 分类 -->
        <div class="ms-wrap" id="mswrap-stat-cat">
          <div class="ms-btn" id="msbtn-stat-cat" onclick="msToggle('stat-cat')">
            <span class="ms-label" id="mslabel-stat-cat">全部分类</span>
            <span class="ms-arrow">▼</span>
          </div>
          <div class="ms-panel" id="mspanel-stat-cat">
            <div class="ms-panel-head">
              <button onclick="msSelectAll('stat-cat')">全选</button>
              <button onclick="msClearAll('stat-cat')">清空</button>
            </div>
            <div class="ms-list" id="mslist-stat-cat"></div>
          </div>
        </div>
        <!-- 平台 -->
        <div class="ms-wrap" id="mswrap-stat-plat">
          <div class="ms-btn" id="msbtn-stat-plat" onclick="msToggle('stat-plat')">
            <span class="ms-label" id="mslabel-stat-plat">全部平台</span>
            <span class="ms-arrow">▼</span>
          </div>
          <div class="ms-panel" id="mspanel-stat-plat">
            <div class="ms-panel-head">
              <button onclick="msSelectAll('stat-plat')">全选</button>
              <button onclick="msClearAll('stat-plat')">清空</button>
            </div>
            <div class="ms-list" id="mslist-stat-plat"></div>
          </div>
        </div>
        <!-- 条件 -->
        <div class="ms-wrap" id="mswrap-stat-cond">
          <div class="ms-btn" id="msbtn-stat-cond" onclick="msToggle('stat-cond')">
            <span class="ms-label" id="mslabel-stat-cond">全部条件</span>
            <span class="ms-arrow">▼</span>
          </div>
          <div class="ms-panel" id="mspanel-stat-cond">
            <div class="ms-panel-head">
              <button onclick="msSelectAll('stat-cond')">全选</button>
              <button onclick="msClearAll('stat-cond')">清空</button>
            </div>
            <div class="ms-list" id="mslist-stat-cond"></div>
          </div>
        </div>
        <button class="btn" style="padding:5px 12px;background:#f1f5f9;font-size:12px;" onclick="statClearAllFilters()">✕ 清除</button>
      </div>
      <div class="stats-grid" id="statsGrid"></div>
      <div class="charts-grid">
        <div class="chart-card">
          <h3>各分类通过率</h3>
          <div class="chart-wrap"><canvas id="chartPassRate"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>各条件 Pass/Fail 分布</h3>
          <div class="chart-wrap"><canvas id="chartCondDist"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>各测试项目通过情况</h3>
          <div class="chart-wrap"><canvas id="chartItemPass"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>Pass/Fail 总览</h3>
          <div class="chart-wrap"><canvas id="chartTotal"></canvas></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- 单元格快速下拉 -->
<div id="cellDropdown">
  <div class="cd-item cd-pass"    onclick="cdSelect('pass')">✓ Pass</div>
  <div class="cd-item cd-fail"    onclick="cdSelect('fail')">✗ Fail</div>
  <div class="cd-item cd-empty"   onclick="cdSelect(null)">— 空</div>
  <div class="cd-sep"></div>
  <div class="cd-item cd-note"    onclick="cdNote()">✎ 备注</div>
  <div class="cd-item cd-redmine" id="cdRedmineBtn" onclick="cdSubmitRedmine()" style="display:none;">🐛 提 Redmine Issue</div>
  <div class="cd-item cd-del"     id="cdDelBtn" onclick="cdDelete()">✕ 删除</div>
</div>

<!-- 次操作下拉菜单 -->
<div id="addRoundDropdown">
  <div class="cd-item" onclick="addRoundAt('before')">⇞ 之前插入</div>
  <div class="cd-item" onclick="addRoundAt('after')">⇟ 之后插入</div>
  <div class="cd-sep"></div>
  <div class="cd-item" onclick="moveRound('up')">↟ 上移</div>
  <div class="cd-item" onclick="moveRound('down')">↡ 下移</div>
  <div class="cd-sep"></div>
  <div class="cd-item" id="ardNoteBtn" onclick="openRoundNoteModalFromDropdown()">✎ 备注</div>
</div>

<!-- 次备注弹窗 -->
<div class="modal-overlay" id="roundNoteModal">
  <div class="modal" style="max-width:600px;width:95vw;">
    <span class="close-btn" onclick="closeModal('roundNoteModal')">✕</span>
    <h3 id="roundNoteTitle" style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1e293b;">📝 次备注</h3>
    <textarea id="roundNoteInput" style="width:100%;height:200px;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;line-height:1.5;resize:vertical;" placeholder="请输入次备注..."></textarea>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('roundNoteModal')">取消</button>
      <button class="btn btn-success" onclick="saveRoundNote()">保存</button>
    </div>
  </div>
</div>

<!-- 录入结果弹窗（仅用于编辑备注）-->

<div class="modal-overlay" id="resultModal">
  <div class="modal">
    <span class="close-btn" onclick="closeModal('resultModal')">✕</span>
    <h2 id="resultModalTitle">录入测试结果</h2>
    <div style="color:#64748b;font-size:12px;margin-bottom:14px;" id="resultModalInfo"></div>
    <div class="form-row">
      <label>结果</label>
      <div class="chip-group">
        <div class="chip pass" id="chipPass" onclick="toggleChip('pass')">✓ Pass</div>
        <div class="chip fail" id="chipFail" onclick="toggleChip('fail')">✗ Fail</div>
      </div>
    </div>
    <div class="form-row">
      <label>备注（可选）</label>
      <input type="text" id="resultNote" placeholder="如：第2次重测">
    </div>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('resultModal')">取消</button>
      <button class="btn btn-success" id="resultModalConfirmBtn" onclick="confirmResult()">确认添加</button>
    </div>
  </div>
</div>

<!-- 管理字段弹窗 -->
<div class="modal-overlay" id="manageModal">
  <div class="modal" style="max-width:600px;width:95vw;max-height:90vh;overflow-y:auto;">
    <span class="close-btn" onclick="closeModal('manageModal')">✕</span>
    <h2>⚙ 管理实验字段
      <span style="font-size:11px;color:#94a3b8;font-weight:400;">（双击编辑 · 拖拽⠿排序）</span>
    </h2>
    <div class="manage-section">
      <h3>📁 分类
        <span style="font-size:11px;color:#94a3b8;font-weight:400;">（样本数量可在表格中动态添加）</span>
      </h3>
      <div class="tag-list" id="catList"></div>
      <div class="add-inline">
        <input type="text" id="newCat" placeholder="新分类名称" onkeydown="if(event.key==='Enter')addCat()">
        <button class="btn btn-primary" style="background:var(--primary);color:#fff;" onclick="addCat()">添加</button>
      </div>
    </div>
    <div class="manage-section">
      <h3>📱 平台
        <span style="font-size:11px;color:#94a3b8;font-weight:400;">（每个平台可独立配置条件和测试项目）</span>
      </h3>
      <div id="platManageList"></div>
      <div class="add-inline" style="margin-top:8px;">
        <input type="text" id="newPlat" placeholder="新平台名称" onkeydown="if(event.key==='Enter')addPlatform()">
        <button class="btn btn-primary" style="background:var(--primary);color:#fff;" onclick="addPlatform()">添加平台</button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-success" onclick="applyManage()">✓ 应用并关闭</button>
    </div>
  </div>
</div>

<!-- Redmine 配置弹窗 -->
<div class="modal-overlay" id="redmineCfgModal">
  <div class="modal" style="max-width:440px;width:95vw;">
    <span class="close-btn" onclick="closeModal('redmineCfgModal')">✕</span>
    <h2>🐛 Redmine 集成配置</h2>
    <div class="rm-field">
      <label>Redmine 地址</label>
      <input id="rmUrl" type="text" placeholder="http://redmine.example.com/redmine" />
      <div class="rm-hint">末尾不需要加斜杠</div>
    </div>
    <div class="rm-field">
      <label>API Key</label>
      <input id="rmApiKey" type="password" placeholder="个人设置 → API 访问密钥" />
    </div>
    <div class="rm-field">
      <label>默认项目</label>
      <select id="rmProjectId">
        <option value="">— 请先填写 URL 和 API Key 后加载 —</option>
      </select>
      <button class="btn btn-primary" style="margin-top:6px;background:#3b82f6;color:#fff;font-size:12px;padding:4px 12px;" onclick="loadRedmineProjects()">↻ 加载项目列表</button>
    </div>
    <div class="rm-field">
      <label>默认 Tracker</label>
      <select id="rmTrackerId">
        <option value="9">Validation</option>
        <option value="16">问题</option>
        <option value="1">错误</option>
        <option value="4">任务</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('redmineCfgModal')">取消</button>
      <button class="btn btn-success" onclick="saveRedmineCfg()">✓ 保存配置</button>
    </div>
  </div>
</div>

<!-- Redmine Issue 提交弹窗 -->
<div class="modal-overlay" id="redmineIssueModal">
  <div class="modal" style="max-width:520px;width:95vw;">
    <span class="close-btn" onclick="closeModal('redmineIssueModal')">✕</span>
    <h2>🐛 关联 / 新建 Redmine Issue</h2>

    <!-- 已关联 Issue 列表 -->
    <div id="rmLinkedSection" style="display:none;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;">已关联 Issue</div>
      <div id="rmLinkedList" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
    </div>

    <!-- 搜索已有 Issue -->
    <div class="rm-field">
      <label>🔍 搜索已有 Issue（关键词 / Issue#）</label>
      <div class="rm-search-wrap">
        <input id="rmSearchInput" type="text" placeholder="如：ADC Fail、#1234…" onkeydown="if(event.key==='Enter')rmSearchIssues()" />
        <button class="rm-search-btn" onclick="rmSearchIssues()">搜索</button>
      </div>
      <div class="rm-issue-list" id="rmIssueList"></div>
      <div class="rm-mode-hint" id="rmModeHint" style="display:none;"></div>
    </div>


    <!-- 追加到描述编辑区（选中已有 Issue 后展开） -->
    <div class="rm-append-section" id="rmAppendSection">
      <div class="rm-append-header">
        <span class="rm-append-label">📝 追加到 Issue 描述</span>
        <span class="rm-append-reset" onclick="rmRefreshAppend(true)" title="重置为自动生成内容">↺ 重置</span>
      </div>
      <div style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        描述格式：
        <select id="rm_desc_fmt" style="font-size:12px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:#334155;cursor:pointer;width:auto;" onchange="rmRefreshAppend()">
          <option value="textile" selected>Textile</option>
          <option value="md">Markdown</option>
          <option value="html">HTML</option>
          <option value="text">纯文本</option>
        </select>
      </div>
      <label>描述</label>
      <div id="rmAppendQuill"></div>
      <div class="rm-append-hint">✏️ 内容可自由编辑，留空则不追加描述</div>
    </div>

    <!-- 新建 Issue 区域（折叠） -->
    <div class="rm-new-section" id="rmNewSection">
      <div style="border-top:1px dashed #e2e8f0;margin:10px 0 14px;"></div>
      <div style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:10px;">＋ 新建 Issue</div>
      <div class="rm-field">
        <label>标题</label>
        <input id="rmIssueTitle" type="text" />
      </div>
      <div class="rm-field">
        <label>项目</label>
        <select id="rmIssueProject"></select>
      </div>
      <div class="rm-field">
        <label>Tracker</label>
        <select id="rmIssueTracker">
          <option value="9">Validation</option>
          <option value="16">问题</option>
          <option value="1">错误</option>
          <option value="4">任务</option>
        </select>
      </div>
      <div class="rm-field">
        <div style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          描述格式：
          <select id="rm_new_issue_fmt" style="font-size:12px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:#334155;cursor:pointer;width:auto;" onchange="rmRefreshDesc()">
            <option value="textile" selected>Textile</option>
            <option value="md">Markdown</option>
            <option value="html">HTML</option>
            <option value="text">纯文本</option>
          </select>
        </div>
        <label>描述</label>
        <div id="rmIssueDescQuill"></div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('redmineIssueModal')">关闭</button>
      <button class="btn btn-success" id="rmSubmitBtn" onclick="confirmSubmitRedmine()">🔗 关联 Issue</button>
    </div>
  </div>
</div>

<!-- 实验备注编辑弹窗 -->
<div class="modal-overlay" id="noteModal">
  <div class="modal" style="max-width:800px;width:95vw;max-height:90vh;overflow-y:auto;">
    <span class="close-btn" onclick="closeModal('noteModal')">✕</span>
    <h3 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1e293b;">📝 实验备注</h3>
    <div id="noteQuillContainer"></div>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('noteModal')">取消</button>
      <button class="btn btn-success" onclick="saveNoteModal()">保存</button>
    </div>
  </div>
</div>

<!-- 样本备注弹窗 -->
<div class="modal-overlay" id="sampleNoteModal">
  <div class="modal" style="max-width:600px;width:95vw;">
    <span class="close-btn" onclick="closeModal('sampleNoteModal')">✕</span>
    <h3 id="sampleNoteTitle" style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1e293b;">📝 样本备注</h3>
    <textarea id="sampleNoteInput" style="width:100%;height:200px;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;line-height:1.5;resize:vertical;" placeholder="请输入样本备注..."></textarea>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('sampleNoteModal')">取消</button>
      <button class="btn btn-success" onclick="saveSampleNote()">保存</button>
    </div>
  </div>
</div>

<!-- 总结备注弹窗 -->
<!-- 条件备注弹窗 -->
<div class="modal-overlay" id="conditionNoteModal">
  <div class="modal" style="max-width:800px;width:95vw;max-height:90vh;overflow-y:auto;">
    <span class="close-btn" onclick="closeModal('conditionNoteModal')">✕</span>
    <h3 id="conditionNoteTitle" style="margin:0 0 12px;font-size:15px;font-weight:600;color:#1e293b;">📝 条件备注</h3>
    <div id="conditionNoteQuillContainer"></div>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('conditionNoteModal')">取消</button>
      <button class="btn btn-success" onclick="saveConditionNote()">保存</button>
    </div>
  </div>
</div>

<!-- 同步简报弹窗 -->
<div class="modal-overlay" id="rmSyncModal">
  <div class="modal" style="max-width:620px;width:95vw;">
    <span class="close-btn" onclick="closeModal('rmSyncModal')">✕</span>
    <h2>📤 同步实验简报到 Redmine</h2>
    <div class="rm-field">
      <label>目标 Issue（勾选后将追加 journal 留言）</label>
      <div class="rm-issue-targets" id="rmSyncTargets">
        <div style="color:#94a3b8;font-size:12px;">加载中…</div>
      </div>
    </div>
    <div class="rm-field">
      <label style="margin-bottom:6px;">简报内容模块（勾选后点刷新）</label>
      <div style="display:flex;flex-wrap:wrap;gap:6px 14px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;">
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_header" checked> 标题 &amp; 时间</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_desc"> 备注</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_overall" checked> 总体通过率</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_matrix" checked> <b>通过率矩阵</b></label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_platform"> 各平台统计</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_condition"> 各条件统计</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_category"> 各分类（批次）统计</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="rso_fail"> Fail 清单</label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;" title="勾选后，隐藏的平台/条件/项目/分类不会出现在简报中"><input type="checkbox" id="rso_visible_only" checked> 仅同步可见字段</label>
      </div>
      <div style="margin-top:5px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:12px;color:#64748b;display:flex;align-items:center;gap:6px;">
          简报格式：
          <select id="rso_fmt" onchange="localStorage.setItem('labrecord_sync_fmt',this.value);refreshRmSyncContent()" style="font-size:12px;padding:2px 6px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:#334155;cursor:pointer;">
            <option value="textile" selected>Textile</option>
            <option value="md">Markdown</option>
            <option value="html">HTML</option>
            <option value="text">纯文本</option>
          </select>
        </span>
        <button class="btn" style="padding:3px 10px;font-size:12px;background:#e0f2fe;color:#0369a1;border:1px solid #7dd3fc;" onclick="refreshRmSyncContent()">🔄 刷新内容</button>
      </div>
    </div>
    <div class="rm-field">
      <label>简报内容（可编辑，支持插图）</label>
      <div id="rmSyncContentQuill"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" style="background:#f1f5f9;" onclick="closeModal('rmSyncModal')">取消</button>
      <button class="btn btn-success" id="rmSyncSubmitBtn" onclick="confirmRmSync()">📤 同步留言</button>
    </div>
  </div>
</div>




</body>
</html>
