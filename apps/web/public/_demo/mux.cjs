/* Builds the narration track and muxes it onto the recorded demo video.
 *
 * Each scene's voice clip is padded to exactly the scene length (lead-in
 * silence + speech + tail silence), so scene N's narration starts on the first
 * frame of scene N and the total audio length matches the video length.
 *
 * Inputs : voice/narr-XX.mp3, timing.json, video/_raw.mp4
 * Output : video/entrustic-beauty-demo.mp4
 *
 * Usage  : node mux.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const VOICE = path.join(HERE, 'voice');
const VIDEO_DIR = path.join(HERE, 'video');
const RAW = path.join(VIDEO_DIR, '_raw.mp4');
const OUT = path.join(VIDEO_DIR, 'entrustic-beauty-demo.mp4');
const WORK = path.join(os.tmpdir(), 'entrustic-beauty-audio');

function findTool(name) {
  const root = path.join(os.tmpdir(), 'opencode', 'ffmpeg');
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === name + '.exe') return p;
    }
  }
  return name;
}

const ffmpeg = findTool('ffmpeg');

function main() {
  if (!fs.existsSync(RAW)) throw new Error('missing ' + RAW + ' -- run record.cjs first');

  const timing = JSON.parse(fs.readFileSync(path.join(HERE, 'timing.json'), 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'voiceover.json'), 'utf8'));
  const leadMs = Math.round((cfg.leadIn || 0.5) * 1000);

  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });

  const parts = [];
  for (const t of timing) {
    const narr = path.join(VOICE, `narr-${t.id}.mp3`);
    if (!fs.existsSync(narr)) throw new Error('missing narration for scene ' + t.id);
    const seg = path.join(WORK, `a-${t.id}.wav`);

    // delay the speech by the lead-in, then pad the whole thing up to scene length
    execFileSync(ffmpeg, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', narr,
      '-af', `adelay=${leadMs}|${leadMs},apad=whole_dur=${t.dur}`,
      '-t', String(t.dur),
      '-ar', '48000', '-ac', '2',
      seg,
    ], { stdio: 'inherit' });

    parts.push(seg);
    console.log(`scene ${t.id}: ${t.speech}s speech in ${t.dur}s slot`);
  }

  const listFile = path.join(WORK, 'list.txt');
  fs.writeFileSync(listFile, parts.map((p) => "file '" + p.replace(/\\/g, '/') + "'").join('\n'), 'utf8');

  const fullAudio = path.join(WORK, 'narration.wav');
  execFileSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', listFile,
    '-c', 'copy', fullAudio,
  ], { stdio: 'inherit' });

  execFileSync(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', RAW,
    '-i', fullAudio,
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-map', '0:v:0', '-map', '1:a:0',
    '-shortest', '-movflags', '+faststart',
    OUT,
  ], { stdio: 'inherit' });

  const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log('\nDONE ->', OUT);
  console.log('size:', mb, 'MB');
}

main();
