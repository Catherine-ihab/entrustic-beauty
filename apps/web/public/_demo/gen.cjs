/* Entrustic Beauty — demo video scene generator (v2, "beauty" edition)
 *
 * Writes one self-contained HTML page per scene into ./scenes/.
 *
 * Two things make this different from a slideshow:
 *   1. Pages that were screen-recorded play the REAL recording inside the
 *      device card (see `media.type === 'video'`) — the picture is genuinely
 *      moving, not a still with a fake pan.
 *   2. Every animation is *time-addressable*: record.cjs calls
 *      window.__frame(t) for each output frame, which pauses all CSS
 *      animations and seeks them to exactly t. No wall-clock drift, no
 *      dropped frames, and video seeks are frame-accurate.
 *
 * Scene lengths come from timing.json (written by voiceover.py) so the
 * narration and the picture can never drift apart.
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const OUT = path.join(HERE, 'scenes');
fs.mkdirSync(OUT, { recursive: true });

const TIMING = path.join(HERE, 'timing.json');
const timings = fs.existsSync(TIMING)
  ? Object.fromEntries(JSON.parse(fs.readFileSync(TIMING, 'utf8')).map((t) => [t.id, t.dur]))
  : {};

/* Palette — built around the clinic's real brand (rose) instead of the
 * generic tech-navy the first cut used. Everything is high contrast on ink. */
const PALETTE = {
  ink: '#0B0710',
  rose: '#EC4899',
  roseSoft: '#F9A8D4',
  gold: '#E8C07D',
  cream: '#FFF7F2',
};

/* media.start / media.rate let a 7s recording cover a 6s scene smoothly:
 * video time = start + t * rate. rate < 1 plays it a touch slower, which
 * reads as "cinematic" rather than "rushed screen capture". */
const scenes = [
  {
    id: '01',
    kind: 'hero',
    tag: 'Entrustic Beauty',
    title: 'نظام واحد\nلعيادتك',
    hook: 'من أول مكالمة لحد آخر فاتورة.',
    sub: 'ليزر، وحقن، وعناية بالبشرة، وباقات، ومخزون وفواتير — نظام إدارة عيادة أو مركز تجميل.',
    pills: ['ليزر', 'حقن تجميلي', 'عناية بالبشرة', 'باقات', 'مواعيد', 'مخزون وأجهزة', 'فواتير', 'تقارير'],
    sideMedia: ['dashboard.png', 'invoices.png'],
  },
  {
    id: '02',
    kind: 'split',
    tag: 'النهاردة',
    title: 'كل أرقام النهاردة\nفي شاشة واحدة',
    sub: 'الدخل، والحالات، ونواقص المخزن — من غير ما تسألي حد.',
    bullets: ['دخل اليوم واللي اتقبض', 'عدد الحالات وحالتها', 'تنبيه قبل ما المخزون يخلص'],
    media: { type: 'image', src: 'dashboard.png' },
  },
  {
    id: '03',
    kind: 'split',
    tag: 'سجل الحالات',
    title: 'ملف واحد\nلكل عميلة',
    sub: 'تاريخها الطبي، وحساسية بشرتها، وكل جلساتها وفواتيرها.',
    bullets: ['بحث فوري بالاسم أو الرقم', 'الحساسية ظاهرة قبل الجلسة', 'الجلسات والفواتير متربطة بالملف'],
    media: { type: 'image', src: 'patients.png' },
  },
  {
    id: '04',
    kind: 'split',
    tag: 'الليزر',
    title: 'خطة جلسات\nلكل منطقة',
    sub: 'تعرفي فاضل كام جلسة، ووصلت لفين في كل منطقة.',
    bullets: ['مناطق الجسم ووصلت لفين', 'الجلسات المتبقية', 'ربط الجهاز والمستلزمات'],
    media: { type: 'video', src: 'laser.mp4', start: 0.8, rate: 0.85 },
  },
  {
    id: '05',
    kind: 'split',
    tag: 'الحقن التجميلي',
    title: 'بوتوكس وفيلر\nبالمخزون',
    sub: 'تسجّلي الوحدات والمناطق، والمخزون يتخصم لوحده.',
    bullets: ['الوحدات والمناطق المعالجة', 'خصم تلقائي من المخزون', 'متابعة النتيجة قبل وبعد'],
    media: { type: 'video', src: 'injectables.mp4', start: 1.8, rate: 0.85 },
  },
  {
    id: '06',
    kind: 'split',
    tag: 'العناية بالبشرة',
    title: 'خطة على حسب\nنوع البشرة',
    sub: 'ماسكات وعلاجات مسعّرة، بتتحوّل لفاتورة على طول.',
    bullets: ['خطة مخصّصة لكل بشرة', 'أسعار واضحة', 'تتحوّل لفاتورة بضغطة'],
    media: { type: 'video', src: 'skincare.mp4', start: 0.2, rate: 0.9 },
  },
  {
    id: '07',
    kind: 'split',
    tag: 'الباقات والعروض',
    title: 'رصيد الجلسات\nمظبوط لوحده',
    sub: 'تبيعي الباقة مرة، والرصيد يتخصم مع كل زيارة.',
    bullets: ['باقات بأي عدد جلسات', 'خصم تلقائي من الرصيد', 'فاضل كام جلسة لكل عميلة'],
    media: { type: 'image', src: 'packages.png' },
  },
  {
    id: '08',
    kind: 'split',
    tag: 'المواعيد',
    title: 'طابور لكل دكتورة\nبنقرة',
    sub: 'المواعيد والانتظار في شاشة واحدة، والحالة بتتغيّر بنقرة.',
    bullets: ['طابور بالوردية', 'وصول ← كشف ← تم', 'رسالة واتساب جاهزة'],
    media: { type: 'video', src: 'appointments.mp4', start: 0.0, rate: 0.95 },
  },
  {
    id: '09',
    kind: 'split',
    tag: 'الفواتير',
    title: 'اتقبض كام\nوفاضل كام',
    sub: 'فاتورة بضريبة وخصم، وحركة خزينة يومية.',
    bullets: ['ضريبة وخصم تلقائي', 'اتقبض / لسه', 'حركة الخزينة'],
    media: { type: 'video', src: 'invoices.mp4', start: 3.2, rate: 0.9 },
  },
  {
    id: '10',
    kind: 'split',
    tag: 'المخزون والأجهزة',
    title: 'قبل ما تخلص\nبيقولك',
    sub: 'حد أدنى للمستلزمات، وحركات صرف، وصيانة الأجهزة.',
    bullets: ['بينبّهك قبل ما تخلص', 'حركات الصرف', 'صيانة الأجهزة'],
    media: { type: 'image', src: 'inventory.png' },
  },
  {
    id: '11',
    kind: 'duo',
    tag: 'التقارير والأمان',
    title: 'الشهر ماشي إزاي\nومين عمل إيه',
    sub: 'تقارير تفصيلية، وسجل بكل حركة اتعملت في النظام.',
    bullets: ['تقرير الشهر', 'سجل كامل', 'صلاحيات الفريق'],
    media: [
      { type: 'video', src: 'reports.mp4', start: 0.0, rate: 0.95 },
      { type: 'image', src: 'audit.png' },
    ],
  },
  {
    id: '12',
    kind: 'outro',
    title: 'جاهزة\nتبدأي؟',
    sub: 'نظام واحد لعيادتك — باسمك، وبألوانك، وباللوجو بتاعك.',
    pills: ['باسم عيادتك', 'بياناتك ليك', 'دعم بالعربي'],
  },
];

/* ---------- CSS ---------- */
const css = `
:root{
  --ink:${PALETTE.ink}; --rose:${PALETTE.rose}; --rose-soft:${PALETTE.roseSoft};
  --gold:${PALETTE.gold}; --cream:${PALETTE.cream}; --muted:#DCC9DF;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--ink)}
body{width:1920px;height:1080px;overflow:hidden;
  font-family:'Almarai','Cairo','Segoe UI',Tahoma,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}

#scene{position:relative;width:1920px;height:1080px;overflow:hidden;color:var(--cream);
  direction:rtl;
  background:
    radial-gradient(1000px 720px at 84% -12%,rgba(236,72,153,.40),transparent 62%),
    radial-gradient(820px 620px at 2% 110%,rgba(232,192,125,.20),transparent 60%),
    radial-gradient(1400px 900px at 50% 50%,rgba(96,28,96,.34),transparent 72%),
    linear-gradient(158deg,#170B1D 0%,#0B0710 52%,#140820 100%)}
/* vignette for depth */
#scene:after{content:'';position:absolute;inset:0;pointer-events:none;z-index:2;
  background:radial-gradient(ellipse at 50% 44%,transparent 38%,rgba(0,0,0,.58) 100%)}

/* ---------- ambient light blobs ---------- */
.orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0;filter:blur(70px)}
.orb.a{width:660px;height:660px;right:-190px;top:-220px;
  background:radial-gradient(circle,rgba(236,72,153,.55),transparent 68%);
  animation:drift1 14s ease-in-out infinite}
.orb.b{width:720px;height:720px;left:-230px;bottom:-280px;
  background:radial-gradient(circle,rgba(232,192,125,.36),transparent 70%);
  animation:drift2 17s ease-in-out infinite}
@keyframes drift1{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-60px,70px,0) scale(1.08)}}
@keyframes drift2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(70px,-50px,0) scale(1.06)}}

/* ---------- entry transitions ---------- */
@keyframes rise{from{opacity:0;transform:translateY(30px) scale(.985);filter:blur(7px)}
                to{opacity:1;transform:none;filter:blur(0)}}
@keyframes riseSmall{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes cardIn{from{opacity:0;transform:translate3d(-70px,46px,0) rotateY(13deg) rotateX(4deg) scale(.93)}
                  to{opacity:1;transform:none}}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes sheen{0%{transform:translateX(-140%) rotate(18deg);opacity:0}
                 12%{opacity:.55}30%{opacity:0}100%{transform:translateX(240%) rotate(18deg);opacity:0}}
@keyframes kb{from{transform:scale(1.02) translate3d(0,0,0)}to{transform:scale(1.10) translate3d(-14px,-10px,0)}}
@keyframes wipe{from{transform:translateX(0)}to{transform:translateX(-104%)}}
@keyframes underline{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes popIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes prog{from{width:var(--p0)}to{width:var(--p1)}}

/* ---------- top bar ---------- */
.topbar{position:absolute;top:36px;right:0;left:0;height:64px;z-index:6;
  display:flex;align-items:center;justify-content:space-between;padding:0 54px;
  animation:riseSmall .6s .05s both}
.logochip{background:var(--cream);border-radius:16px;padding:9px 20px;display:flex;align-items:center;
  box-shadow:0 18px 40px -18px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.5) inset}
.logochip img{height:34px;display:block}
.step{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;color:#C9B7CD;
  letter-spacing:.5px;direction:ltr}
.step b{color:var(--cream);font-size:20px}
.step .sep{opacity:.45}

/* ---------- split layout ---------- */
.split{position:absolute;inset:0;display:flex;align-items:center;gap:26px;
  padding:0 54px 40px;z-index:3}
.split .text{flex:0 0 486px;padding-bottom:10px}
.split .stage{flex:1;min-width:0}

.tag{display:inline-flex;align-items:center;gap:9px;font-size:20px;font-weight:800;
  color:#FFD9EC;background:rgba(236,72,153,.18);border:1px solid rgba(236,72,153,.45);
  padding:8px 18px;border-radius:999px;animation:riseSmall .6s .18s both}
.tag .dot{width:8px;height:8px;border-radius:50%;background:var(--rose);
  box-shadow:0 0 14px 2px rgba(236,72,153,.9)}
.title{font-size:56px;font-weight:800;line-height:1.18;letter-spacing:-.8px;margin-top:22px;color:#fff}
.title .ln{display:block;animation:rise .8s both}
.rule{height:3px;width:96px;border-radius:3px;margin-top:20px;transform-origin:right center;
  background:linear-gradient(90deg,var(--rose),var(--gold));animation:underline .7s .5s both}
.sub{font-size:24px;font-weight:400;line-height:1.65;color:var(--muted);margin-top:18px;
  animation:riseSmall .7s .55s both}
.bullets{display:flex;flex-direction:column;gap:15px;margin-top:30px}
.bullet{display:flex;align-items:center;gap:13px;font-size:23px;font-weight:700;color:#F3E9F5;
  animation:riseSmall .55s both}
.bullet .ic{flex:0 0 26px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;
  background:rgba(236,72,153,.22);border:1px solid rgba(236,72,153,.55);color:var(--rose-soft);
  font-size:14px;font-weight:900}
.bullet:nth-child(1){animation-delay:1.15s}
.bullet:nth-child(2){animation-delay:1.34s}
.bullet:nth-child(3){animation-delay:1.53s}

/* ---------- screen card ---------- */
.stage{position:relative;perspective:1700px;animation:cardIn 1s cubic-bezier(.16,.84,.28,1) .1s both}
.stage .glow{position:absolute;inset:6% 4% 2%;border-radius:40px;filter:blur(58px);z-index:0;
  background:radial-gradient(ellipse at 50% 60%,rgba(236,72,153,.55),rgba(232,192,125,.16) 55%,transparent 72%)}
.card{position:relative;z-index:2;width:100%;aspect-ratio:16/9;border-radius:22px;overflow:hidden;
  background:#0E0A14;border:1px solid rgba(255,255,255,.16);
  box-shadow:0 60px 110px -40px rgba(0,0,0,.95),0 0 0 7px rgba(255,255,255,.045),
             0 30px 60px -30px rgba(236,72,153,.45)}
.card .inner{position:absolute;inset:0;overflow:hidden;border-radius:22px}
.card .inner img,.card .inner video{width:100%;height:100%;object-fit:cover;display:block}
.card .inner img.kb{animation:kb 15s linear both}
.card .inner video{transform:scale(1.045)}
/* diagonal light sweep across the card */
.card .sheen{position:absolute;top:-30%;bottom:-30%;width:34%;left:0;z-index:3;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent);
  animation:sheen 4.2s 1.6s ease-in-out both}
.card .edge{position:absolute;inset:0;border-radius:22px;z-index:4;pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.10),
             inset 0 -90px 90px -60px rgba(0,0,0,.55)}

/* ---------- duo layout ---------- */
.duo{position:absolute;inset:0;z-index:3;padding:118px 54px 52px;display:flex;flex-direction:column}
.duo .head{flex:0 0 auto;max-width:1180px}
.duo .title{font-size:46px;margin-top:16px}
.duo .sub{font-size:22px;margin-top:12px}
.duo .cards{flex:1 1 auto;display:flex;align-items:center;gap:24px;justify-content:center;min-height:0}
.duo .stage{animation:cardIn 1s cubic-bezier(.16,.84,.28,1) both}
.duo .stage.big{flex:0 0 940px;width:940px}
.duo .stage.small{flex:0 0 592px;width:592px;animation-delay:.16s}
.duo .stage .card{aspect-ratio:16/9}
.duo .bullets{flex:0 0 auto;flex-direction:row;gap:34px;justify-content:center;margin-top:18px}
.duo .bullet{font-size:21px}
.duo .bullet:nth-child(n){animation-delay:1.5s}

/* ---------- hero / outro ---------- */
.hero{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:0 120px;
  animation:heroPush SCENE_DURATION linear both}
/* a very slow push-in: the frame is never truly still, even when the text has
   finished appearing (this is what separates a "slide" from a video) */
@keyframes heroPush{from{transform:scale(1)}to{transform:scale(1.05)}}
.hero .logowrap{background:var(--cream);border-radius:24px;padding:20px 34px;
  box-shadow:0 40px 90px -34px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.6) inset;
  animation:popIn .8s cubic-bezier(.2,.9,.3,1.2) .15s both}
.hero .logowrap img{height:78px;display:block}
.hero h1{font-size:92px;font-weight:800;line-height:1.1;letter-spacing:-2px;margin:40px 0 0;color:#fff}
.hero h1 .ln{display:block;animation:rise .9s both}
.hero h1 .ln:nth-child(1){animation-delay:.35s}
.hero h1 .ln:nth-child(2){animation-delay:.5s}
.hero .hook{margin-top:22px;font-size:34px;font-weight:800;color:#FFE3F0;line-height:1.45;
  max-width:1360px;animation:riseSmall .8s .7s both}
.hero .sub2{margin-top:16px;font-size:25px;color:var(--muted);font-weight:400;max-width:1180px;
  line-height:1.6;animation:riseSmall .8s .9s both}
.hero .pills{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:1500px}
.hero .pill{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.20);
  color:#F6ECF8;padding:9px 20px;border-radius:999px;font-size:20px;font-weight:700;
  backdrop-filter:blur(6px);animation:popIn .45s both}
.hero .cta{margin-top:34px;display:inline-flex;align-items:center;gap:12px;
  background:linear-gradient(100deg,var(--rose),#F472B6);color:#fff;font-weight:800;font-size:24px;
  padding:15px 34px;border-radius:999px;box-shadow:0 22px 50px -18px rgba(236,72,153,.9);
  animation:popIn .7s 1.5s both}

/* hero side screens (depth, slightly out of focus) */
.sidescreen{position:absolute;z-index:1;border-radius:18px;overflow:hidden;
  border:1px solid rgba(255,255,255,.14);box-shadow:0 50px 90px -40px #000}
.sidescreen img{width:100%;height:100%;object-fit:cover;display:block}
.sidescreen.l{width:560px;height:315px;left:-190px;top:120px;opacity:.5;filter:blur(2px) saturate(.9);
  animation:ssL SCENE_DURATION ease-in-out both}
.sidescreen.r{width:620px;height:349px;right:-220px;bottom:70px;opacity:.55;filter:blur(2px) saturate(.9);
  animation:ssR SCENE_DURATION ease-in-out both}
@keyframes ssL{from{transform:rotate(-7deg) translate3d(0,0,0)}to{transform:rotate(-5deg) translate3d(34px,-26px,0)}}
@keyframes ssR{from{transform:rotate(6deg) translate3d(0,0,0)}to{transform:rotate(4deg) translate3d(-30px,20px,0)}}

/* ---------- footer / progress ---------- */
.footer{position:absolute;left:0;right:0;bottom:0;height:64px;z-index:7;
  display:flex;align-items:center;justify-content:space-between;padding:0 54px 10px}
.fbrand{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;color:#B9A6BF}
.fbrand .d{width:7px;height:7px;border-radius:50%;background:var(--rose)}
.dots{display:flex;gap:7px;align-items:center;direction:ltr}
.dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.22)}
.dots i.on{background:var(--rose);width:20px;border-radius:4px}
.track{position:absolute;left:0;right:0;bottom:0;height:4px;z-index:8;background:rgba(255,255,255,.10)}
.track i{display:block;height:100%;width:var(--p0);
  background:linear-gradient(90deg,var(--rose),#FFB4D8,var(--gold));
  box-shadow:0 0 18px rgba(236,72,153,.9);animation:prog SCENE_DURATION linear both}

/* ---------- hard cut wipe between scenes ---------- */
.wipe{position:absolute;inset:0;z-index:20;pointer-events:none;
  background:linear-gradient(100deg,#1A0A22 0%,#2B0D33 45%,#1A0A22 100%);
  animation:wipe .42s cubic-bezier(.65,0,.35,1) both}
`;

/* ---------- builders ---------- */
const orbs = () => `<div class="orb a"></div><div class="orb b"></div>`;

const mediaEl = (m) => {
  if (!m) return '';
  if (m.type === 'video') {
    return `<video src="../shots/${m.src}" muted playsinline preload="auto"
      data-start="${m.start || 0}" data-rate="${m.rate || 1}"></video>`;
  }
  return `<img class="kb" src="../shots/${m.src}" alt="">`;
};

const cardEl = (m) => `<div class="stage">
    <div class="glow"></div>
    <div class="card">
      <div class="inner">${mediaEl(m)}</div>
      <div class="sheen"></div>
      <div class="edge"></div>
    </div>
  </div>`;

const logoChip = () => `<div class="logochip"><img src="../logo.png" alt="Entrustic"></div>`;

const topbar = (i, n) => `<div class="topbar">${logoChip()}
  <div class="step"><b>${String(i).padStart(2, '0')}</b><span class="sep">/</span><span>${String(n).padStart(2, '0')}</span></div>
</div>`;

const dots = (i, n) =>
  `<div class="dots">${Array.from({ length: n }, (_, k) => `<i class="${k + 1 === i ? 'on' : ''}"></i>`).join('')}</div>`;

const bulletsEl = (arr) =>
  `<div class="bullets">${arr
    .map((b) => `<div class="bullet"><span class="ic">\u2713</span><span>${b}</span></div>`)
    .join('')}</div>`;

const titleEl = (title, delay = 0.3) =>
  title
    .split('\n')
    .map((ln, k) => `<span class="ln" style="animation-delay:${(delay + k * 0.13).toFixed(2)}s">${ln}</span>`)
    .join('');

const footerEl = (i, n) =>
  `<div class="footer"><div class="fbrand"><span class="d"></span>Entrustic Beauty</div>${dots(i, n)}</div>`;

const shell = (s, i, n, body, p0, p1) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Entrustic ${s.id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&display=swap" rel="stylesheet">
<style>${css.replace(/SCENE_DURATION/g, s.dur + 's')}
.track i{--p0:${p0}%;--p1:${p1}%}</style></head>
<body><div id="scene">${orbs()}${body}
  <div class="track"><i></i></div>
  <div class="wipe"></div>
</div>
<script>
/* ---- frame driver (used by record.cjs) -------------------------------- */
window.__ready = async () => {
  await (document.fonts ? document.fonts.ready : Promise.resolve());
  await Promise.all([...document.images].map((im) => (im.decode ? im.decode().catch(() => {}) : null)));
  for (const v of document.querySelectorAll('video')) {
    v.pause();
    if (v.readyState < 2) await new Promise((r) => v.addEventListener('loadeddata', r, { once: true }));
  }
};
const vids = [...document.querySelectorAll('video')];
window.__frame = async (t) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
  await Promise.all(vids.map((v) => {
    const s = parseFloat(v.dataset.start || '0');
    const r = parseFloat(v.dataset.rate || '1');
    const dur = (v.duration || 10) - 0.06;
    const target = Math.min(s + t * r, dur);
    if (Math.abs(v.currentTime - target) < 0.004) return null;
    return new Promise((res) => {
      let done = false;
      const fin = () => { if (!done) { done = true; res(); } };
      v.addEventListener('seeked', fin, { once: true });
      v.currentTime = target;
      setTimeout(fin, 350);
    });
  }));
};
</script>
</body></html>`;

function renderHero(s, i, n, p0, p1) {
  const pills = s.pills
    .map((p, k) => `<span class="pill" style="animation-delay:${(1.2 + k * 0.07).toFixed(2)}s">${p}</span>`)
    .join('');
  return shell(
    s,
    i,
    n,
    `<div class="sidescreen l"><img src="../shots/${s.sideMedia[0]}" alt=""></div>
     <div class="sidescreen r"><img src="../shots/${s.sideMedia[1]}" alt=""></div>
     <div class="hero">
       <div class="logowrap"><img src="../logo.png" alt="Entrustic"></div>
       <h1>${titleEl(s.title, 0.35)}</h1>
       <div class="hook">${s.hook}</div>
       <div class="sub2">${s.sub}</div>
       <div class="pills">${pills}</div>
     </div>
     <div class="footer"><div class="fbrand"><span class="d"></span>Entrustic Beauty</div>${dots(i, n)}</div>`,
    p0,
    p1,
  );
}

function renderOutro(s, i, n, p0, p1) {
  const pills = s.pills
    .map((p, k) => `<span class="pill" style="animation-delay:${(1.35 + k * 0.1).toFixed(2)}s">${p}</span>`)
    .join('');
  return shell(
    s,
    i,
    n,
    `<div class="hero">
       <div class="logowrap"><img src="../logo.png" alt="Entrustic"></div>
       <h1>${titleEl(s.title, 0.4)}</h1>
       <div class="sub2" style="margin-top:26px">${s.sub}</div>
       <div class="pills">${pills}</div>
       <div class="cta">Entrustic Beauty \u2022 نظام عيادتك</div>
     </div>
     <div class="footer"><div class="fbrand"><span class="d"></span>Entrustic Beauty</div>${dots(i, n)}</div>`,
    p0,
    p1,
  );
}

function renderSplit(s, i, n, p0, p1) {
  return shell(
    s,
    i,
    n,
    `${topbar(i, n)}
     <div class="split">
       <div class="text">
         <span class="tag"><span class="dot"></span>${s.tag}</span>
         <div class="title">${titleEl(s.title, 0.3)}</div>
         <div class="rule"></div>
         <div class="sub">${s.sub}</div>
         ${bulletsEl(s.bullets)}
       </div>
       ${cardEl(s.media)}
     </div>
     ${footerEl(i, n)}`,
    p0,
    p1,
  );
}

function renderDuo(s, i, n, p0, p1) {
  const [a, b] = s.media;
  return shell(
    s,
    i,
    n,
    `${topbar(i, n)}
     <div class="duo">
       <div class="head">
         <span class="tag"><span class="dot"></span>${s.tag}</span>
         <div class="title">${titleEl(s.title, 0.3)}</div>
         <div class="rule"></div>
         <div class="sub">${s.sub}</div>
       </div>
       <div class="cards">
         <div class="stage big"><div class="glow"></div><div class="card"><div class="inner">${mediaEl(a)}</div><div class="sheen"></div><div class="edge"></div></div></div>
         <div class="stage small"><div class="glow"></div><div class="card"><div class="inner">${mediaEl(b)}</div><div class="edge"></div></div></div>
       </div>
       ${bulletsEl(s.bullets)}
     </div>
     ${footerEl(i, n)}`,
    p0,
    p1,
  );
}

/* ---------- write everything ---------- */
let total = 0;
for (const s of scenes) if (timings[s.id]) s.dur = timings[s.id];
const grand = scenes.reduce((a, s) => a + s.dur, 0);

const manifest = [];
for (let k = 0; k < scenes.length; k++) {
  const s = scenes[k];
  const i = k + 1;
  const n = scenes.length;
  const p0 = ((total / grand) * 100).toFixed(3);
  const p1 = (((total + s.dur) / grand) * 100).toFixed(3);
  total += s.dur;

  let html;
  if (s.kind === 'hero') html = renderHero(s, i, n, p0, p1);
  else if (s.kind === 'outro') html = renderOutro(s, i, n, p0, p1);
  else if (s.kind === 'duo') html = renderDuo(s, i, n, p0, p1);
  else html = renderSplit(s, i, n, p0, p1);

  const file = `scene-${s.id}.html`;
  fs.writeFileSync(path.join(OUT, file), html, 'utf8');
  manifest.push({
    id: s.id,
    file,
    dur: s.dur,
    kind: s.kind,
    media: s.media ? (Array.isArray(s.media) ? s.media.map((m) => m.src).join('+') : s.media.src) : null,
  });
}

fs.writeFileSync(path.join(HERE, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('scenes:', manifest.length, '| total:', grand.toFixed(2) + 's');
console.log(manifest.map((m) => `  ${m.file}  ${m.dur}s  [${m.media || '-'}]`).join('\n'));
