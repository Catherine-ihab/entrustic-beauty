/* Captures the demo screenshots from the deployed app and reports layout
 * problems that make a screen "unclear" (clipped text, overlaps, overflow).
 *
 * Usage:
 *   node capture.cjs            # screenshot every screen + report
 *   node capture.cjs packages   # only this screen
 *
 * Env:
 *   DEMO_URL   default https://entrustic-beauty.vercel.app
 *   DEMO_EMAIL / DEMO_PASS
 *   CHROME     path to chrome.exe
 *   PUPPETEER  path to a puppeteer-core install
 */
const fs = require('fs');
const path = require('path');

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PUPPETEER =
  process.env.PUPPETEER || 'C:/Users/msi/AppData/Local/Temp/opencode/rec/node_modules/puppeteer-core';
const puppeteer = require(PUPPETEER);

const URL_BASE = process.env.DEMO_URL || 'https://entrustic-beauty.vercel.app';
const EMAIL = process.env.DEMO_EMAIL || 'owner@demo.entrusticbeauty.app';
const PASS = process.env.DEMO_PASS || 'Demo#Owner2026!';
const VW = Number(process.env.DEMO_W || 1920);
const VH = Number(process.env.DEMO_H || 1080);

const REPO = path.join(__dirname, '..');
const OUT = process.env.CAPTURE_OUT || path.join(REPO, 'capture-out');
const SHOTS = path.join(OUT, 'shots');
const REPORT = path.join(OUT, 'layout-report.txt');

/** menu key -> output file */
const SCREENS = [
  ['dashboard', 'dashboard.png'],
  ['patients', 'patients.png'],
  ['laser', 'laser.png'],
  ['injectables', 'injectables.png'],
  ['skincare', 'skincare.png'],
  ['packages', 'packages.png'],
  ['appointments', 'appointments.png'],
  ['invoices', 'invoices.png'],
  ['inventory', 'inventory.png'],
  ['reports', 'reports.png'],
  ['devices', 'devices.png'],
  ['audit', 'audit.png'],
  ['settings', 'settings.png'],
];

const only = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForSettled(page, extra = 900) {
  // wait for skeletons/spinners to disappear, then a short settle
  for (let i = 0; i < 40; i++) {
    const busy = await page
      .evaluate(() => document.querySelectorAll('.ant-skeleton,.ant-spin-spinning').length)
      .catch(() => 0);
    if (!busy) break;
    await sleep(150);
  }
  await sleep(extra);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
    });
  });
}

/** In-page audit: clipped text, overflow past the card, text/button collisions. */
const AUDIT = () => {
  const out = { clipped: [], overflow: [], overlaps: [], colours: [] };
  const label = (el) => {
    const cls = (el.className && typeof el.className === 'string' ? el.className : '')
      .split(/\s+/)
      .filter((c) => c && !c.startsWith('css-'))
      .slice(0, 3)
      .join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const describe = (el) => {
    const r = el.getBoundingClientRect();
    return {
      el: label(el),
      text: (el.textContent || '').trim().slice(0, 70),
      box: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
    };
  };

  const root = document.querySelector('.ant-layout-content') || document.body;

  // 1. text that is visually cut off
  for (const el of root.querySelectorAll('*')) {
    if (!el.childElementCount && el.textContent && el.textContent.trim().length > 4) {
      const cs = getComputedStyle(el);
      const cut =
        (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') &&
        el.scrollWidth - el.clientWidth > 2;
      if (cut) {
        out.clipped.push({ ...describe(el), scrollW: el.scrollWidth, clientW: el.clientWidth, style: cs.overflow });
      }
    }
  }

  // 2. elements sticking out of their block parent
  for (const el of root.querySelectorAll('div,h1,h2,h3,h4,h5,span,button')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const p = el.parentElement;
    if (!p) continue;
    const pr = p.getBoundingClientRect();
    if (pr.width === 0) continue;
    const overRight = Math.round(r.right - pr.right);
    const overLeft = Math.round(pr.left - r.left);
    if (overRight > 4 || overLeft > 4) {
      out.overflow.push({ ...describe(el), parent: label(p), overRight, overLeft });
    }
  }

  // 3. buttons overlapping text blocks
  const buttons = [...root.querySelectorAll('button')].map((b) => ({ b, r: b.getBoundingClientRect() }));
  const texts = [...root.querySelectorAll('h1,h2,h3,h4,h5,.ant-typography')]
    .map((t) => ({ t, r: t.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && x.r.height > 0);
  for (const { b, r: br } of buttons) {
    for (const { t, r: tr } of texts) {
      const ox = Math.min(br.right, tr.right) - Math.max(br.left, tr.left);
      const oy = Math.min(br.bottom, tr.bottom) - Math.max(br.top, tr.top);
      if (ox > 6 && oy > 6) {
        out.overlaps.push({ button: (b.textContent || '').trim().slice(0, 40), text: (t.textContent || '').trim().slice(0, 50), ox: Math.round(ox), oy: Math.round(oy) });
      }
    }
  }

  // 4. contrast of every visible text run
  const lum = (r, g, b) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 };
  };
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && cs.backgroundImage.includes('gradient')) {
        const cols = [...cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)].map((m) =>
          m[1].split(',').map(parseFloat),
        );
        if (cols.length) {
          const avg = [0, 1, 2].map((i) => cols.reduce((s, c) => s + c[i], 0) / cols.length);
          return avg;
        }
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return c.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };
  for (const el of root.querySelectorAll('h1,h2,h3,h4,h5,p,span,a,td,th,label,button,.ant-typography')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 3);
    if (!own.length) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    const L1 = lum(...fg.rgb);
    const L2 = lum(...bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio < 4.5) {
      out.colours.push({
        el: label(el),
        text: el.textContent.trim().slice(0, 60),
        fg: cs.color,
        bg: 'rgb(' + bg.map(Math.round).join(', ') + ')',
        ratio: Math.round(ratio * 100) / 100,
        size: cs.fontSize,
      });
    }
  }
  return out;
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none'],
    defaultViewport: { width: VW, height: VH, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });

  console.log('opening', URL_BASE);
  await page.goto(URL_BASE, { waitUntil: 'networkidle2', timeout: 90000 });

  // login
  await page.waitForSelector('#email', { timeout: 30000 });
  await page.type('#email', EMAIL, { delay: 12 });
  await page.type('#password', PASS, { delay: 12 });
  await Promise.all([
    page.waitForSelector('.ant-menu', { timeout: 40000 }),
    page.click('button[type="submit"]'),
  ]);
  await sleep(2500);
  console.log('logged in');

  fs.mkdirSync(SHOTS, { recursive: true });
  const reportLines = [];
  const dims = [];

  for (const [key, file] of SCREENS) {
    if (only && only !== key) continue;
    const sel = `li[data-menu-id$="-${key}"]`;
    const found = await page.$(sel);
    if (!found) {
      console.log('!! menu item missing:', key);
      continue;
    }
    await found.click();
    await waitForSettled(page);
    const out = path.join(SHOTS, file);
    let saved = false;
    for (let attempt = 1; attempt <= 4 && !saved; attempt += 1) {
      try {
        await page.screenshot({ path: out });
        saved = true;
      } catch (err) {
        const code = (err && err.code) || '';
        console.log(`   retry ${attempt} for ${file} (${code})`);
        await sleep(700);
        try {
          if (fs.existsSync(out)) fs.unlinkSync(out);
        } catch (_) {}
      }
    }
    if (!saved) throw new Error('could not write ' + out);

    const audit = await page.evaluate(AUDIT);
    if (key === 'packages') {
      const rows = await page.evaluate(() =>
        [...document.querySelectorAll('.ant-table-tbody tr.ant-table-row')]
          .slice(0, 10)
          .map((tr) => (tr.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90)),
      );
      reportLines.push('packages table rows:');
      rows.forEach((r) => reportLines.push('   ' + r));
    }
    reportLines.push('===== ' + key + ' =====');
    reportLines.push('clipped(' + audit.clipped.length + '):');
    for (const c of audit.clipped.slice(0, 8)) {
      reportLines.push(`   ${c.el} box=${c.box} scrollW=${c.scrollW} clientW=${c.clientW} "${c.text}"`);
    }
    reportLines.push('overflow(' + audit.overflow.length + '):');
    for (const c of audit.overflow.slice(0, 8)) {
      reportLines.push(`   ${c.el} in ${c.parent} right+${c.overRight} left+${c.overLeft} "${c.text}"`);
    }
    reportLines.push('text/button overlap(' + audit.overlaps.length + '):');
    for (const c of audit.overlaps.slice(0, 6)) {
      reportLines.push(`   button "${c.button}" x text "${c.text}" (${c.ox}x${c.oy})`);
    }
    reportLines.push('low contrast(' + audit.colours.length + '):');
    for (const c of audit.colours.slice(0, 12)) {
      reportLines.push(`   ${c.el} ${c.size} ${c.fg} on ${c.bg} = ${c.ratio}:1 "${c.text}"`);
    }
    reportLines.push('');

    const meta = fs.statSync(out);
    console.log(`${key.padEnd(12)} -> ${file}  ${(meta.size / 1024).toFixed(0)} KB  ` +
      `(clipped ${audit.clipped.length}, overflow ${audit.overflow.length}, overlap ${audit.overlaps.length}, lowContrast ${audit.colours.length})`);
    dims.push(`${file}: ${VW}x${VH}`);
  }

  fs.writeFileSync(REPORT, reportLines.join('\n'), 'utf8');
  console.log('\nreport ->', REPORT);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
