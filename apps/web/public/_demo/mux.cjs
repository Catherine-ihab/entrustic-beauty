/* Builds the final audio track and muxes it onto the recorded video.
 *
 *   narration (per scene, padded to the exact scene length)
 *      + music bed (audio/bed.wav, from music.py)
 *      + side-chain ducking so the bed dips whenever Salma speaks
 *      -> loudnorm to -16 LUFS
 *      -> muxed onto video/_raw.mp4
 *
 * Inputs : voice/narr-XX.mp3 (optional with --music-only), timing.json, audio/bed.wav, video/_raw.mp4
 * Output : video/entrustic-beauty-demo.mp4
 *
 * Usage  : node mux.cjs
 *          node mux.cjs --music-only   (no voiceover, music + transitions only)
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HERE = __dirname;
const VOICE = path.join(HERE, 'voice');
const BED = path.join(HERE, 'audio', 'bed.wav');
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
const run = (args) => execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });

function main() {
  if (!fs.existsSync(RAW)) throw new Error('missing ' + RAW + ' -- run record.cjs first');

  const musicOnly = process.argv.includes('--music-only') || process.argv.includes('--no-voice');
  const timing = JSON.parse(fs.readFileSync(path.join(HERE, 'timing.json'), 'utf8'));
  const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'voiceover.json'), 'utf8'));
  const leadMs = Math.round((cfg.leadIn || 0.4) * 1000);
  const total = timing.reduce((a, t) => a + t.dur, 0);

  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });

  const hasBed = fs.existsSync(BED);
  let mixed = path.join(WORK, 'mix.wav');

  if (musicOnly) {
    if (!hasBed) throw new Error('missing ' + BED + ' -- run: python music.py');
    console.log('mode: music-only (no voiceover), total', total.toFixed(2) + 's');
    run([
      '-i', BED,
      '-af', `atrim=0:${total.toFixed(2)},asetpts=N/SR/TB,loudnorm=I=-16:TP=-1.5:LRA=11`,
      '-ar', '48000', '-ac', '2', mixed,
    ]);
  } else {
    // ---- 1. narration, each line padded to its exact scene slot ----
    const parts = [];
    for (const t of timing) {
      const narr = path.join(VOICE, `narr-${t.id}.mp3`);
      if (!fs.existsSync(narr)) throw new Error('missing narration for scene ' + t.id);
      const seg = path.join(WORK, `a-${t.id}.wav`);
      run([
        '-i', narr,
        '-af', `adelay=${leadMs}|${leadMs},apad=whole_dur=${t.dur}`,
        '-t', String(t.dur), '-ar', '48000', '-ac', '2', seg,
      ]);
      parts.push(seg);
      console.log(`  scene ${t.id}: ${t.speech}s speech in ${t.dur}s slot`);
    }

    const listFile = path.join(WORK, 'list.txt');
    fs.writeFileSync(listFile, parts.map((p) => "file '" + p.replace(/\\/g, '/') + "'").join('\n'), 'utf8');
    const narration = path.join(WORK, 'narration.wav');
    run(['-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', narration]);

    // ---- 2. mix with the bed, ducking it under the voice ----
    if (hasBed) {
      run([
        '-i', narration,
        '-i', BED,
        '-filter_complex',
        [
          '[1:a]volume=0.85,atrim=0:' + total.toFixed(2) + ',asetpts=N/SR/TB[bed]',
          '[bed][0:a]sidechaincompress=threshold=0.035:ratio=7:attack=6:release=380[duck]',
          '[0:a][duck]amix=inputs=2:duration=first:normalize=0[mix]',
          '[mix]loudnorm=I=-16:TP=-1.5:LRA=11[a]',
        ].join(';'),
        '-map', '[a]', '-ar', '48000', '-ac', '2', mixed,
      ]);
    } else {
      console.warn('! audio/bed.wav not found -> narration only (run: python music.py)');
      run(['-i', narration, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', '-ac', '2', mixed]);
    }
  }

  // ---- 3. mux ----
  run([
    '-i', RAW, '-i', mixed,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-map', '0:v:0', '-map', '1:a:0',
    '-shortest', '-movflags', '+faststart', OUT,
  ]);

  const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log('\nDONE ->', OUT, `(${mb} MB, ${total.toFixed(2)}s${hasBed ? ', with music' : ''}${musicOnly ? ', no voiceover' : ''})`);
}

main();
