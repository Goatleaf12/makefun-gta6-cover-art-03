// Screenshot driver for Sunset State Cover Studio (build tooling).
//
// Serves app/ on a local port, drives the Playwright headless Chromium
// over CDP, waits for each ?shot= scene to flag window.__shotReady, and
// captures the four entry screenshots into screenshots/ as PNG.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const APP = join(ROOT, 'app');
const OUT = join(ROOT, 'screenshots');
const CHROME = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-linux64/chrome-headless-shell');
const PORT = 8931;
const CDP_PORT = 9355;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf', '.txt': 'text/plain',
};

const SHOTS = [
  { file: '1-cover-landscape.png', query: 'shot=landscape', w: 1280, h: 720 },
  { file: '2-editor.png', query: 'shot=editor', w: 1280, h: 800 },
  { file: '3-cover-portrait.png', query: 'shot=portrait', w: 1024, h: 1280 },
  { file: '4-cover-square.png', query: 'shot=square', w: 1280, h: 1280 },
];

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const path = normalize(join(APP, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
      if (!path.startsWith(APP)) throw new Error('outside app');
      const data = await readFile(path);
      res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpSession() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        let nextId = 0;
        const pending = new Map();
        ws.onmessage = (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
          }
        };
        const send = (method, params = {}) => new Promise((resolve, reject) => {
          const id = ++nextId;
          pending.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method, params }));
        });
        return { ws, send };
      }
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('CDP never came up');
}

async function main() {
  const server = await serve();
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${CDP_PORT}`, '--no-sandbox', '--disable-gpu',
    '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    const { ws, send } = await cdpSession();
    await send('Page.enable');
    await send('Runtime.enable');
    await mkdir(OUT, { recursive: true });
    for (const shot of SHOTS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: shot.w, height: shot.h, deviceScaleFactor: 1, mobile: false,
      });
      await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html?${shot.query}` });
      let ready = false;
      for (let i = 0; i < 120 && !ready; i++) {
        const r = await send('Runtime.evaluate', { expression: 'window.__shotReady === true', returnByValue: true });
        ready = r.result && r.result.value === true;
        if (!ready) await sleep(250);
      }
      if (!ready) throw new Error(`shot ${shot.file} never became ready`);
      await sleep(350);
      const shotRes = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const path = join(OUT, shot.file);
      await writeFile(path, Buffer.from(shotRes.data, 'base64'));
      console.log(`${shot.file}: written`);
    }
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
