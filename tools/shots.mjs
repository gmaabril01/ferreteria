// Capturas de revisión con Chrome local (sin descargas): node shots.mjs <desktop|mobile> <salida> [puntos...]
// Puntos: i0.3 (pantallas desde arriba), p0.5 (pantallas desde «Lo que hacemos»), #id (sección), full (página completa)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [mode = 'desktop', outDir = 'shots', ...points] = process.argv.slice(2);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.env.URL || 'http://localhost:5173/';
const vp = mode === 'mobile'
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: Number(process.env.VW) || 1440, height: Number(process.env.VH) || 900, deviceScaleFactor: 1 };

mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars'],
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => logs.push(`[404?] ${r.url()}`));
await page.setViewport(vp);
if (process.env.REDUCED) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2500));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
for (const pt of points.length ? points : ['i0']) {
  if (pt === 'full') {
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
    // Recorre la página para disparar las apariciones y luego captura completa
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await wait(120); }
    await page.evaluate(() => window.scrollTo(0, 0)); await wait(800);
    await page.screenshot({ path: join(outDir, `${mode}-full.png`), fullPage: true });
    continue;
  }
  await page.evaluate((p) => {
    document.documentElement.style.scrollBehavior = 'auto';
    let y = 0;
    if (p.startsWith('i')) {
      y = innerHeight * parseFloat(p.slice(1));
    } else if (p.startsWith('p')) {
      y = document.getElementById('productos').offsetTop + innerHeight * parseFloat(p.slice(1));
    } else if (p === 'end') {
      y = document.documentElement.scrollHeight;
    } else if (p.startsWith('#')) {
      const el = document.querySelector(p);
      y = el.getBoundingClientRect().top + scrollY - 70;
    }
    window.scrollTo(0, y);
  }, pt);
  await wait(pt.startsWith('i') ? 2600 : 3000);
  await page.screenshot({ path: join(outDir, `${mode}-${pt.replace(/[#.]/g, '_')}.png`) });
}
console.log(logs.length ? logs.join('\n') : 'consola limpia');
await browser.close();
