#!/usr/bin/env node
/**
 * LabRecord MCP Server
 * 通过 MCP 协议暴露实验记录数据的读写能力
 * 运行方式：node mcp-server.js
 * stdio 模式，供 WorkBuddy / Claude Desktop 等接入
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// ─── 数据读写 ────────────────────────────────────────────────────────────────

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { records: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function cellKey(ci, ic, pli, cdi, ii) {
  return `${ci}_${ic}_${pli}_${cdi}_${ii}`;
}

function getCell(record, ci, ic, pli, cdi, ii) {
  const key = cellKey(ci, ic, pli, cdi, ii);
  const cells = record.data || record.cells || {};
  const arr = cells[key];
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.filter(r => r != null);
}

function countResults(record) {
  const cells = record.data || record.cells || {};
  let pass = 0, fail = 0;
  for (const arr of Object.values(cells)) {
    if (!Array.isArray(arr)) continue;
    for (const r of arr) {
      if (!r) continue;
      if (r.result === 'P') pass++;
      if (r.result === 'F') fail++;
    }
  }
  return { pass, fail, total: pass + fail };
}

function getPassRate(record) {
  const { pass, total } = countResults(record);
  if (total === 0) return null;
  return Math.round((pass / total) * 1000) / 10; // 保留1位小数
}

// ─── MCP Server 定义 ─────────────────────────────────────────────────────────

const server = new Server(
  { name: 'labrecord-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// 工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_records',
      description: '列出所有实验记录（id、名称、创建时间、平台数、通过率）',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_record',
      description: '获取某条实验记录的完整结构（平台、条件、项目、分类）',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '实验记录 id' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_results',
      description: '查询某条实验的测试结果，支持按平台/条件/项目/分类筛选',
      inputSchema: {
        type: 'object',
        properties: {
          id:       { type: 'string', description: '实验记录 id' },
          platform: { type: 'string', description: '平台名称（可选，模糊匹配）' },
          condition:{ type: 'string', description: '条件名称（可选，模糊匹配）' },
          item:     { type: 'string', description: '项目名称（可选，模糊匹配）' },
          result:   { type: 'string', enum: ['P', 'F', 'all'], description: '筛选结果类型，默认 all' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_pass_rate',
      description: '获取通过率统计，按平台/条件分组汇总',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '实验记录 id' },
        },
        required: ['id'],
      },
    },
    {
      name: 'get_fail_list',
      description: '获取所有 Fail 结果列表，含位置信息和备注，适合生成报告或提 Issue',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '实验记录 id' },
        },
        required: ['id'],
      },
    },
    {
      name: 'add_result',
      description: '写入一条测试结果（P/F）',
      inputSchema: {
        type: 'object',
        properties: {
          id:        { type: 'string', description: '实验记录 id' },
          category:  { type: 'number', description: '分类索引（ci，0-based）' },
          sample:    { type: 'number', description: '样本编号（ic，0-based）' },
          platform:  { type: 'number', description: '平台索引（pli，0-based）' },
          condition: { type: 'number', description: '条件索引（cdi，0-based）' },
          item:      { type: 'number', description: '项目索引（ii，0-based）' },
          result:    { type: 'string', enum: ['P', 'F'], description: 'Pass 或 Fail' },
          note:      { type: 'string', description: '备注（可选）' },
        },
        required: ['id', 'category', 'sample', 'platform', 'condition', 'item', 'result'],
      },
    },
  ],
}));

// 工具执行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const data = readData();
  const records = data.records || [];

  // ── list_records ──────────────────────────────────────────────────────────
  if (name === 'list_records') {
    const list = records.map(r => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      platforms: (r.platforms || []).map(p => p.name),
      categories: r.categories || [],
      ...countResults(r),
      passRate: getPassRate(r),
    }));
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(list, null, 2),
      }],
    };
  }

  // ── get_record ────────────────────────────────────────────────────────────
  if (name === 'get_record') {
    const rec = records.find(r => r.id === args.id);
    if (!rec) return { content: [{ type: 'text', text: `未找到 id=${args.id} 的记录` }], isError: true };

    const summary = {
      id: rec.id,
      name: rec.name,
      note: rec.note || '',
      createdAt: rec.createdAt,
      categories: rec.categories || [],
      sampleCounts: rec.sampleCounts || [],
      platforms: (rec.platforms || []).map((pl, pli) => ({
        index: pli,
        name: pl.name,
        conditions: pl.conditions || [],
        items: pl.items || [],
        hidden: (rec.hiddenPlats || []).includes(pli),
      })),
    };
    return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
  }

  // ── get_results ───────────────────────────────────────────────────────────
  if (name === 'get_results') {
    const rec = records.find(r => r.id === args.id);
    if (!rec) return { content: [{ type: 'text', text: `未找到 id=${args.id} 的记录` }], isError: true };

    const resultFilter = args.result || 'all';
    const rows = [];
    const cats = rec.categories || [];
    const sampleCounts = rec.sampleCounts || [];

    (rec.platforms || []).forEach((pl, pli) => {
      if (args.platform && !pl.name.includes(args.platform)) return;
      (pl.conditions || []).forEach((cond, cdi) => {
        if (args.condition && !cond.includes(args.condition)) return;
        (pl.items || []).forEach((item, ii) => {
          if (args.item && !item.includes(args.item)) return;
          cats.forEach((cat, ci) => {
            const count = sampleCounts[ci] || rec.icCount || 1;
            for (let ic = 0; ic < count; ic++) {
              const results = getCell(rec, ci, ic, pli, cdi, ii);
              results.forEach((r, round) => {
                if (resultFilter !== 'all' && r.result !== resultFilter) return;
                rows.push({
                  category: cat,
                  sample: ic,
                  platform: pl.name,
                  condition: cond,
                  item,
                  round,
                  result: r.result,
                  note: r.note || '',
                });
              });
            }
          });
        });
      });
    });

    return { content: [{ type: 'text', text: JSON.stringify(rows, null, 2) }] };
  }

  // ── get_pass_rate ─────────────────────────────────────────────────────────
  if (name === 'get_pass_rate') {
    const rec = records.find(r => r.id === args.id);
    if (!rec) return { content: [{ type: 'text', text: `未找到 id=${args.id} 的记录` }], isError: true };

    const cats = rec.categories || [];
    const sampleCounts = rec.sampleCounts || [];
    const byPlatform = {};

    (rec.platforms || []).forEach((pl, pli) => {
      byPlatform[pl.name] = byPlatform[pl.name] || { pass: 0, fail: 0, byCondition: {} };
      (pl.conditions || []).forEach((cond, cdi) => {
        byPlatform[pl.name].byCondition[cond] = { pass: 0, fail: 0 };
        (pl.items || []).forEach((_, ii) => {
          cats.forEach((_, ci) => {
            const count = sampleCounts[ci] || rec.icCount || 1;
            for (let ic = 0; ic < count; ic++) {
              const results = getCell(rec, ci, ic, pli, cdi, ii);
              results.forEach(r => {
                if (!r) return;
                if (r.result === 'P') {
                  byPlatform[pl.name].pass++;
                  byPlatform[pl.name].byCondition[cond].pass++;
                } else if (r.result === 'F') {
                  byPlatform[pl.name].fail++;
                  byPlatform[pl.name].byCondition[cond].fail++;
                }
              });
            }
          });
        });
      });
    });

    // 计算通过率
    const result = {};
    for (const [plName, stat] of Object.entries(byPlatform)) {
      const total = stat.pass + stat.fail;
      result[plName] = {
        pass: stat.pass,
        fail: stat.fail,
        total,
        passRate: total ? `${Math.round(stat.pass / total * 1000) / 10}%` : 'N/A',
        byCondition: {},
      };
      for (const [cond, cs] of Object.entries(stat.byCondition)) {
        const ct = cs.pass + cs.fail;
        result[plName].byCondition[cond] = {
          pass: cs.pass, fail: cs.fail, total: ct,
          passRate: ct ? `${Math.round(cs.pass / ct * 1000) / 10}%` : 'N/A',
        };
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  // ── get_fail_list ─────────────────────────────────────────────────────────
  if (name === 'get_fail_list') {
    const rec = records.find(r => r.id === args.id);
    if (!rec) return { content: [{ type: 'text', text: `未找到 id=${args.id} 的记录` }], isError: true };

    const cats = rec.categories || [];
    const sampleCounts = rec.sampleCounts || [];
    const fails = [];

    (rec.platforms || []).forEach((pl, pli) => {
      (pl.conditions || []).forEach((cond, cdi) => {
        (pl.items || []).forEach((item, ii) => {
          cats.forEach((cat, ci) => {
            const count = sampleCounts[ci] || rec.icCount || 1;
            for (let ic = 0; ic < count; ic++) {
              const results = getCell(rec, ci, ic, pli, cdi, ii);
              results.forEach((r, round) => {
                if (r.result === 'F') {
                  fails.push({
                    category: cat,
                    sample: `#${ic + 1}`,
                    platform: pl.name,
                    condition: cond,
                    item,
                    round: round + 1,
                    note: r.note || '',
                  });
                }
              });
            }
          });
        });
      });
    });

    const summary = `共 ${fails.length} 条 Fail 记录`;
    return {
      content: [{
        type: 'text',
        text: `${summary}\n\n${JSON.stringify(fails, null, 2)}`,
      }],
    };
  }

  // ── add_result ────────────────────────────────────────────────────────────
  if (name === 'add_result') {
    const recIdx = records.findIndex(r => r.id === args.id);
    if (recIdx === -1) return { content: [{ type: 'text', text: `未找到 id=${args.id} 的记录` }], isError: true };

    const rec = records[recIdx];
    if (!rec.data) rec.data = {};
    const key = cellKey(args.category, args.sample, args.platform, args.condition, args.item);
    if (!Array.isArray(rec.data[key])) rec.data[key] = [];
    rec.data[key].push({ result: args.result, note: args.note || '' });

    writeData(data);
    return {
      content: [{
        type: 'text',
        text: `✅ 已写入：[${args.result}] ${key}（第 ${rec.data[key].length} 次）`,
      }],
    };
  }

  return { content: [{ type: 'text', text: `未知工具：${name}` }], isError: true };
});

// ─── 启动 ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('LabRecord MCP Server started (stdio)\n');
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
