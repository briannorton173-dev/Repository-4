import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const INDEX = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

export async function launch({ width = 1280, height = 800 } = {}) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--hide-scrollbars'],
  });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(INDEX, { waitUntil: 'load' });
  await page.waitForFunction(() => window.GAME && window.GAME.screenshotReady && window.GAME.screenshotReady());
  return { browser, context, page, errors };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
