const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const PORT = 3030;
const ROOT = path.join(__dirname);
const DATA_FILE = path.join(ROOT, 'data.json');
const EXAMPLE_FILE = path.join(ROOT, 'data.example.json');
const MIME = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png' };

// 首次运行：data.json 不存在时自动从示例文件创建
if (!fs.existsSync(DATA_FILE)) {
  if (fs.existsSync(EXAMPLE_FILE)) {
    fs.copyFileSync(EXAMPLE_FILE, DATA_FILE);
    console.log('data.json 不存在，已从 data.example.json 自动创建');
  } else {
    fs.writeFileSync(DATA_FILE, '{"records":[],"categories":[]}', 'utf8');
    console.log('data.json 不存在，已创建空白数据文件');
  }
}

// ── Redmine 反向代理 ──────────────────────────────────────
// 请求：GET/POST http://localhost:3030/api/redmine/<path>
// 转发：GET/POST <REDMINE_URL>/<path>  (带 X-Redmine-API-Key)
// 查询参数中必须带 _rmUrl=<base> 和 _rmKey=<apikey>
// ─────────────────────────────────────────────────────────
function proxyRequest(method, targetUrl, rmKey, reqBody, res, redirectCount) {
  if (redirectCount > 5) {
    res.writeHead(502, corsHeaders()); res.end(JSON.stringify({ error: 'too many redirects' })); return;
  }
  const parsedTarget = url.parse(targetUrl);
  const isHttps = parsedTarget.protocol === 'https:';
  const lib = isHttps ? https : http;

  const bodyBuffer = (reqBody && typeof reqBody === 'string') ? Buffer.from(reqBody, 'utf8') : null;
  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: parsedTarget.path,
    method: method,
    headers: {
      'X-Redmine-API-Key': rmKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(bodyBuffer ? { 'Content-Length': bodyBuffer.length } : {})
    }
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    // 跟随 301/302 重定向
    if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
      let loc = proxyRes.headers.location;
      // 相对路径补全
      if (loc.startsWith('/')) {
        const base = url.parse(targetUrl);
        loc = `${base.protocol}//${base.host}${loc}`;
      }
      // 追加 key= 参数
      const sep = loc.includes('?') ? '&' : '?';
      loc = loc + sep + 'key=' + encodeURIComponent(rmKey);
      proxyRes.resume();
      proxyRequest(method, loc, rmKey, reqBody, res, redirectCount + 1);
      return;
    }
    let body = '';
    proxyRes.on('data', c => body += c);
    proxyRes.on('end', () => {
      if (proxyRes.statusCode >= 400) {
        console.error(`[proxy] ${method} ${targetUrl} => ${proxyRes.statusCode}\n`, body.slice(0, 500));
      }
      res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() });
      res.end(body);
    });
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, corsHeaders());
    res.end(JSON.stringify({ error: 'proxy error: ' + e.message }));
  });

  if ((method === 'POST' || method === 'PUT') && bodyBuffer) {
    proxyReq.write(bodyBuffer);
  }
  proxyReq.end();
}

function handleRedmineProxy(req, res) {
  // 从 URL 中解析代理目标
  const parsed = url.parse(req.url, true);
  const rmUrl  = parsed.query._rmUrl;
  const rmKey  = parsed.query._rmKey;
  if (!rmUrl || !rmKey) {
    res.writeHead(400, corsHeaders()); res.end(JSON.stringify({ error: 'missing _rmUrl or _rmKey' })); return;
  }

  // 剥离前缀 /api/redmine 和 _rm* 查询参数
  const subpath = parsed.pathname.replace(/^\/api\/redmine/, '');
  const qs = Object.entries(parsed.query)
    .filter(([k]) => !k.startsWith('_rm'))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  // PUT/DELETE 时不在 URL 里加 key=，避免 Redmine Rails 把 key 当作 issue 字段解析导致 500
  // GET/POST(search) 保留 key= 兼容性
  const needKeyInUrl = req.method === 'GET' || req.method === 'POST';
  const keyQs = needKeyInUrl ? `key=${encodeURIComponent(rmKey)}` : '';
  const fullQs = qs && keyQs ? qs + '&' + keyQs : (qs || keyQs);
  const targetUrl = rmUrl.replace(/\/$/, '') + subpath + (fullQs ? '?' + fullQs : '');

  if (req.method === 'POST' || req.method === 'PUT') {
    let reqBody = '';
    req.on('data', c => reqBody += c);
    req.on('end', () => proxyRequest(req.method, targetUrl, rmKey, reqBody, res, 0));
  } else {
    proxyRequest(req.method, targetUrl, rmKey, null, res, 0);
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Redmine-API-Key'
  };
}


// ── Redmine 图片上传代理 (/api/redmine-upload) ─────────────
// 前端 POST application/octet-stream，后端转发到 Redmine /uploads.json
// 查询参数：_rmUrl、_rmKey、filename
function handleRedmineUpload(req, res) {
  const parsed = url.parse(req.url, true);
  const rmUrl  = parsed.query._rmUrl;
  const rmKey  = parsed.query._rmKey;
  const filename = parsed.query.filename || 'image.png';
  if (!rmUrl || !rmKey) {
    res.writeHead(400, corsHeaders()); res.end(JSON.stringify({ error: 'missing _rmUrl or _rmKey' })); return;
  }

  // 收集请求 body（binary）
  const chunks = [];
  req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c, 'binary') : c));
  req.on('end', () => {
    const bodyBuf = Buffer.concat(chunks);
    const targetUrl = rmUrl.replace(/\/$/, '') + '/uploads.json?key=' + encodeURIComponent(rmKey) + '&filename=' + encodeURIComponent(filename);
    doUpload(targetUrl, rmKey, bodyBuf, res, 0);
  });
}

function doUpload(targetUrl, rmKey, bodyBuf, res, redirectCount) {
  if (redirectCount > 5) {
    res.writeHead(502, corsHeaders()); res.end(JSON.stringify({ error: 'too many redirects' })); return;
  }
  const parsedTarget = url.parse(targetUrl);
  const isHttps = parsedTarget.protocol === 'https:';
  const lib = isHttps ? https : http;

  const options = {
    hostname: parsedTarget.hostname,
    port: parsedTarget.port || (isHttps ? 443 : 80),
    path: parsedTarget.path,
    method: 'POST',
    headers: {
      'X-Redmine-API-Key': rmKey,
      'Content-Type': 'application/octet-stream',
      'Content-Length': bodyBuf.length
    }
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    // 跟随 301/302 重定向
    if ((proxyRes.statusCode === 301 || proxyRes.statusCode === 302) && proxyRes.headers.location) {
      let loc = proxyRes.headers.location;
      if (loc.startsWith('/')) {
        const base = url.parse(targetUrl);
        loc = `${base.protocol}//${base.host}${loc}`;
      }
      proxyRes.resume();
      doUpload(loc, rmKey, bodyBuf, res, redirectCount + 1);
      return;
    }
    let body = '';
    proxyRes.on('data', c => body += c);
    proxyRes.on('end', () => {
      if (proxyRes.statusCode >= 400) {
        console.error(`[upload] POST ${targetUrl} => ${proxyRes.statusCode}\n`, body.slice(0, 500));
      }
      // 若响应不是 JSON（如返回了 HTML），包装成错误对象
      const ct = (proxyRes.headers['content-type'] || '');
      if (!ct.includes('json') && !body.trimStart().startsWith('{')) {
        res.writeHead(502, corsHeaders());
        res.end(JSON.stringify({ error: `Redmine 返回非 JSON 响应 (HTTP ${proxyRes.statusCode})，请检查 URL 和 API Key` }));
        return;
      }
      res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() });
      res.end(body);
    });
  });
  proxyReq.on('error', (e) => {
    res.writeHead(502, corsHeaders());
    res.end(JSON.stringify({ error: 'upload proxy error: ' + e.message }));
  });
  proxyReq.write(bodyBuf);
  proxyReq.end();
}

const server = http.createServer((req, res) => {
  // Redmine 图片上传专用代理（必须在通用 /api/redmine 之前匹配）
  if (req.url.startsWith('/api/redmine-upload')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders()); res.end(); return;
    }
    handleRedmineUpload(req, res);
    return;
  }

  // Redmine 代理
  if (req.url.startsWith('/api/redmine')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders()); res.end(); return;
    }
    handleRedmineProxy(req, res);
    return;
  }

  // API: 读取数据
  if (req.method === 'GET' && req.url === '/api/data') {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    } catch(e) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('null');
    }
    return;
  }

  // API: 保存数据
  if (req.method === 'POST' && req.url === '/api/data') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body); // 验证JSON合法
        fs.writeFileSync(DATA_FILE, body, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end('{"ok":true}');
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok":false,"error":"invalid json"}');
      }
    });
    return;
  }

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  // 静态文件
  let p = req.url === '/' ? '/index.html' : req.url;
  try { p = decodeURIComponent(p); } catch(e) {}
  let fp = path.join(ROOT, p);
  try {
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  } catch(e) {
    res.writeHead(404); res.end('Not found');
  }
});

server.listen(PORT, () => { console.log('READY http://localhost:' + PORT); });
