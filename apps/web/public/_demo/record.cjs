/* Renders the demo scenes to an MP4 — deterministically.
 *
 * The old recorder screenshotted in real time and hoped for the best. This one
 * asks the page to freeze itself at an exact timestamp for every single frame
 * (window.__frame(t), see gen.cjs), so:
 *   - CSS animations land on the exact same frame every run
 *   - embedded screen recordings are seeked frame-accurately
 *   - nothing drifts if the machine hiccups
 *
 * Usage:  node record.cjs
 * Env:    FPS (default 30), QUALITY (crf, default 17), ONLY=04,05 (subset)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const MANIFEST = path.join(HERE, 'manifest.json');
const OUT = path.join(HERE, 'video');
const WORK = path.join(os.tmpdir(), 'entrustic-beauty-record');

const FPS = Number(process.env.FPS || 30);
const CRF = String(process.env.QUALITY || 17);
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);

const MODULES = [
  path.join('C:', 'Users', 'msi', 'AppData', 'Local', 'Temp', 'opencode', 'rec', 'node_modules'),
  path.join(HERE, '..', '..', '..', '..', 'node_modules'),
];
function loadPuppeteer() {
  for (const base of MODULES) {
    try {
      return require(require.resolve('puppeteer-core', { paths: [base] }));
    } catch (_) {}
  }
  throw new Error('puppeteer-core not found. install it in ' + MODULES[0]);
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const root = path.join(os.tmpdir(), 'opencode', 'ffmpeg');
  if (fs.existsSync(root)) {
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(p);
        else if (e.name === 'ffmpeg.exe') return p;
      }
    }
  }
  return 'ffmpeg';
}

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
function findChrome() {
  for (const c of CHROME_CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error('Chrome/Edge not found');
}

async function main() {
  const ffmpeg = findFfmpeg();
  const puppeteer = loadPuppeteer();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).filter(
    (s) => !ONLY.length || ONLY.includes(s.id),
  );

  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log('ffmpeg:', ffmpeg);
  console.log('chrome:', findChrome());
  console.log('frames:', manifest.reduce((a, s) => a + Math.round(s.dur * FPS), 0), '@', FPS, 'fps');

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: [
      '--force-device-scale-factor=1',
      '--hide-scrollbars',
      '--font-render-hinting=none',
      '--autoplay-policy=no-user-gesture-required',
      '--allow-file-access-from-files',
    ],
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  const segments = [];
  const t0 = Date.now();

  for (const s of manifest) {
    const url = 'file:///' + path.join(HERE, 'scenes', s.file).replace(/\\/g, '/');
    const frames = Math.round(s.dur * FPS);
    const dir = path.join(WORK, 'f' + s.id);
    fs.mkdirSync(dir, { recursive: true });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => window.__ready());
    await new Promise((r) => setTimeout(r, 250));

    for (let i = 0; i < frames; i++) {
      await page.evaluate((t) => window.__frame(t), i / FPS);
      // JPEG, not PNG: Chrome's PNG encoder costs ~450ms/frame at 1080p while
      // JPEG q95 is ~78ms, and the frames are re-encoded to H.264 anyway.
      await page.screenshot({
        path: path.join(dir, String(i).padStart(4, '0') + '.jpg'),
        type: 'jpeg',
        quality: 96,
      });
      if (i % 30 === 0) {
        const el = (Date.now() - t0) / 1000;
        process.stdout.write(`\r  scene ${s.id}: ${i}/${frames} frames  (${el.toFixed(0)}s elapsed)   `);
      }
    }
    await page.close();

    const seg = path.join(WORK, 'seg-' + s.id + '.mp4');
    execFileSync(
      ffmpeg,
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', String(FPS),
        '-i', path.join(dir, '%04d.jpg'),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF,
        '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2),
        seg,
      ],
      { stdio: 'inherit' },
    );
    segments.push(seg);
    // Keep a copy per scene: re-rendering one scene later (ONLY=04) then only
    // needs to re-concat, instead of re-rendering the whole video.
    const keepDir = path.join(OUT, 'segments');
    fs.mkdirSync(keepDir, { recursive: true });
    fs.copyFileSync(seg, path.join(keepDir, `seg-${s.id}.mp4`));
    console.log(`\n  scene ${s.id} -> ${frames} frames, ${s.dur}s  [${s.media || 'no media'}]`);
  }

  const listFile = path.join(WORK, 'list.txt');
  // concat every scene that has a segment, in manifest order -- so a partial
  // re-render (ONLY=...) still produces the full video
  const all = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const keepDir = path.join(OUT, 'segments');
  const ordered = all
    .map((s) => path.join(keepDir, `seg-${s.id}.mp4`))
    .filter((p) => fs.existsSync(p));
  if (ordered.length !== all.length) {
    console.warn(`! only ${ordered.length}/${all.length} scene segments exist; run without ONLY to render the rest`);
  }
  fs.writeFileSync(listFile, ordered.map((p) => "file '" + p.replace(/\\/g, '/') + "'").join('\n'), 'utf8');

  const finalOut = path.join(OUT, '_raw.mp4');
  execFileSync(
    ffmpeg,
    ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile,
     '-c', 'copy', '-movflags', '+faststart', finalOut],
    { stdio: 'inherit' },
  );
  await browser.close();

  const mb = (fs.statSync(finalOut).size / 1024 / 1024).toFixed(1);
  console.log(`\nDONE -> ${finalOut}  (${mb} MB, ${((Date.now() - t0) / 60000).toFixed(1)} min)`);
  console.log('next: node mux.cjs');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
