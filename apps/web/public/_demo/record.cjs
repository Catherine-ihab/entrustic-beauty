/* Records the Entrustic Beauty demo scenes into a single MP4.
 *
 * Pipeline per scene:
 *   1. open the scene HTML in headless Chrome at 1920x1080
 *   2. take a screenshot every FRAME_MS milliseconds for the scene duration
 *   3. ffmpeg stitches the PNG sequence into an H.264 mp4 segment
 * Then all segments are concatenated into demo.mp4
 *
 * Needs: puppeteer-core (drives the installed Chrome) + ffmpeg on PATH or FFMPEG env var.
 * Usage:  node record.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const MANIFEST = path.join(HERE, 'manifest.json');
const OUT = path.join(HERE, 'video');
const WORK = path.join(os.tmpdir(), 'entrustic-beauty-record');

const FPS = 30;
const FRAME_MS = Math.round(1000 / FPS);

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const ffmpeg = findFfmpeg();
  const puppeteer = loadPuppeteer();
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  console.log('ffmpeg :', ffmpeg);
  console.log('chrome :', findChrome());

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const segments = [];
  for (const s of manifest) {
    const url = 'file:///' + path.join(HERE, 'scenes', s.file).replace(/\\/g, '/');
    const frames = Math.round(s.dur * FPS);
    const dir = path.join(WORK, 'f' + s.id);
    fs.mkdirSync(dir, { recursive: true });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    // let webfonts settle, then restart the CSS animations from 0
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const started = Date.now();
    for (let i = 0; i < frames; i++) {
      await page.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.png') });
      const target = started + (i + 1) * FRAME_MS;
      const wait = target - Date.now();
      if (wait > 0) await sleep(wait);
    }
    await page.close();

    const seg = path.join(WORK, 'seg-' + s.id + '.mp4');
    execFileSync(
      ffmpeg,
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', String(FPS),
        '-i', path.join(dir, '%04d.png'),
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
        '-pix_fmt', 'yuv420p', '-r', String(FPS),
        seg,
      ],
      { stdio: 'inherit' },
    );
    segments.push(seg);
    console.log('scene ' + s.id + ' -> ' + frames + ' frames, ' + s.dur + 's');
  }

  const listFile = path.join(WORK, 'list.txt');
  fs.writeFileSync(listFile, segments.map((p) => "file '" + p.replace(/\\/g, '/') + "'").join('\n'), 'utf8');

  const finalOut = path.join(OUT, '_raw.mp4');
  execFileSync(
    ffmpeg,
    ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', finalOut],
    { stdio: 'inherit' },
  );
  await browser.close();

  const size = fs.statSync(finalOut).size;
  console.log('\nDONE ->', finalOut);
  console.log('size:', (size / 1024 / 1024).toFixed(1), 'MB');
  console.log('next: node mux.cjs   (adds the narration track)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
