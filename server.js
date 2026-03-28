const http = require('http');
const fs = require('fs');
const path = require('path');
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

const server = http.createServer((req, res) => {
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
