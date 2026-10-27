// Measures FPS and checks HUD layout at several window sizes against the built game.
import { chromium } from 'playwright-core';
const URL = process.env.URL ?? 'http://localhost:5299/';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 640]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /Start exploring/ }).click();
  await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(4000);
  await page.keyboard.up('ArrowRight');
  const info = await page.evaluate(() => {
    const g = window.__game;
    const s = g.scene.getScene('world');
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const a = r('.area-card');
    const m = r('.minimap');
    return { fps: Math.round(g.loop.actualFps), zoom: s.cameras.main.zoom, overlap: !!(a && m && a.right > m.left && a.top < m.bottom), scrollable: document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth };
  });
  await page.screenshot({ path: `test-artifacts/size-${w}x${h}.png` });
  console.log(`${w}x${h}: fps=${info.fps} zoom=${info.zoom} hudOverlap=${info.overlap} pageScroll=${info.scrollable} errors=${errors.length}`);
  await page.close();
}
await browser.close();
