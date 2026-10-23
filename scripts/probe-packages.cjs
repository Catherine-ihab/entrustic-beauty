/* Measures the packages banner: where each button really lands, and whether an
 * ancestor clips it. Read-only — no screenshots, writes to stdout only.
 *
 *   node scripts/probe-packages.cjs [viewportWidth]
 */
const path = require('path');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PUPPETEER =
  process.env.PUPPETEER || 'C:/Users/msi/AppData/Local/Temp/opencode/rec/node_modules/puppeteer-core';
const puppeteer = require(PUPPETEER);

const URL_BASE = process.env.DEMO_URL || 'https://entrustic-beauty.vercel.app';
const EMAIL = process.env.DEMO_EMAIL || 'owner@demo.entrusticbeauty.app';
const PASS = process.env.DEMO_PASS || 'Demo#Owner2026!';
const VW = Number(process.argv[2] || process.env.DEMO_W || 1920);
const VH = Number(process.env.DEMO_H || 1080);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = () => {
  const out = [];
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) };
  };
  const label = (el) => {
    const cls = (typeof el.className === 'string' ? el.className : '')
      .split(/\s+/)
      .filter((c) => c && !c.startsWith('css-') && !c.startsWith('ant-'))
      .join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };

  // The dark banner card = the first card on the page.
  const content = document.querySelector('.ant-layout-content') || document.body;
  const card = [...content.querySelectorAll('.ant-card')].find((c) => {
    const bg = getComputedStyle(c).backgroundImage;
    return bg && bg.includes('gradient');
  });
  if (!card) return ['no banner card found'];

  out.push('card ' + label(card) + ' ' + JSON.stringify(rect(card)));
  out.push('content width=' + Math.round(content.getBoundingClientRect().width));

  const row = card.querySelector('.ant-row');
  if (row) out.push('row ' + JSON.stringify(rect(row)));

  for (const col of card.querySelectorAll('.ant-col')) {
    const r = rect(col);
    out.push('  col ' + (col.className.match(/ant-col-md-(\d+)/) || [])[1] + ' ' + JSON.stringify(r) +
      ' align=' + getComputedStyle(col).textAlign);
  }

  for (const btn of card.querySelectorAll('button')) {
    const r = rect(btn);
    out.push('  button "' + (btn.innerText || '').replace(/\s+/g, ' ').trim() + '" ' + JSON.stringify(r) +
      ' scrollW=' + btn.scrollWidth + ' clientW=' + btn.clientWidth);
    // who clips it?
    let p = btn.parentElement;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflow !== 'visible' || cs.overflowX !== 'visible') {
        const pr = p.getBoundingClientRect();
        if (btn.getBoundingClientRect().right > pr.right + 1 || btn.getBoundingClientRect().left < pr.left - 1) {
          out.push('     clipped by ' + label(p) + ' ' + JSON.stringify(rect(p)) + ' overflow=' + cs.overflow);
        }
      }
      p = p.parentElement;
    }
    // is it outside the card?
    const cr = card.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    if (br.right > cr.right + 1) out.push('     past card right edge by ' + Math.round(br.right - cr.right));
    if (br.left < cr.left - 1) out.push('     past card left edge by ' + Math.round(cr.left - br.left));
  }

  const space = card.querySelector('.ant-space');
  if (space) {
    const cs = getComputedStyle(space);
    out.push('  space ' + JSON.stringify(rect(space)) + ' wrap=' + cs.flexWrap + ' display=' + cs.display);
  }
  return out;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars'],
    defaultViewport: { width: VW, height: VH, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('#email', { timeout: 30000 });
  await page.type('#email', EMAIL, { delay: 10 });
  await page.type('#password', PASS, { delay: 10 });
  await Promise.all([page.waitForSelector('.ant-menu', { timeout: 40000 }), page.click('button[type="submit"]')]);
  await sleep(2000);
  await page.click('li[data-menu-id$="-packages"]');
  await sleep(2500);

  const lines = await page.evaluate(PROBE);
  lines.forEach((l) => console.log(l));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
