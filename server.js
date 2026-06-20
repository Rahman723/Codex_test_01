import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = process.env.PORT || 4173;
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const safePath = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\.\.(?:\/|$)/, '');
    const filePath = join(ROOT, safePath);
    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': TYPES[extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Voice Priority Planner running at http://localhost:${PORT}`);
});
