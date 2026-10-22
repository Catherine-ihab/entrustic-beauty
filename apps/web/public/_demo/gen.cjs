/* Generates Entrustic Beauty demo video scene pages (1920x1080) served by Vite from /public/_demo/
 *
 * Unlike the dental generator, every scene here is ANIMATED:
 *   - a slide-up reveal sequence (tag -> title -> sub -> bullets -> shot)
 *   - the browser shot card drifts + scales slowly (ken-burns)
 *   - an ambient orb float in the background
 *   - a progress bar at the very bottom
 * The animation is driven by CSS only, so the same page can be screen-recorded
 * (or captured frame-by-frame by record.cjs) and always looks alive.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'scenes');
fs.mkdirSync(OUT, { recursive: true });

/* Total on-screen duration per scene, in seconds. Bump these to slow a scene down. */
const scenes = [
  {
    id: '01', kind: 'hero', dur: 6.0,
    title1: 'Entrustic Beauty Web App', title2: 'معمول مخصوص لعيادتك',
    hook: 'بتدوري على سيستم يدير عيادة التجميل من الاستقبال للفاتورة — بهويتك، وبدون اشتراكات شهرية؟',
    sub: 'نظام واحد يدير جلسات الليزر والحقن والعناية بالبشرة والجسم، مع المخزون والفواتير والتقارير.',
    pills: ['جلسات ليزر', 'بوتوكس وفيلر', 'عناية بالبشرة', 'سبا ومساج', 'باقات وعروض', 'مخزون وأجهزة', 'فواتير وتقارير'],
  },
  {
    id: '02', kind: 'two', tag: 'نظرة عامة', img: 'dashboard.png', dur: 5.4,
    title: 'لوحة تحكم حيّة لكل عيادة',
    sub: 'كل أرقام اليوم في شاشة واحدة — إيرادات، مواعيد، تنبيهات المخزون وحالة الأجهزة.',
    bullets: ['متابعة الإيرادات والمحصّل لحظياً', 'مواعيد اليوم وحالة كل حالة', 'تنبيه المخزون المنخفض والأجهزة'],
  },
  {
    id: '03', kind: 'two', tag: 'سجل الحالات', img: 'patients.png', dur: 5.2,
    title: 'ملف كامل لكل عميلة',
    sub: 'سجل الحالات بيجمع التاريخ الطبي والجلسات والفواتير وحساسية البشرة في مكان واحد.',
    bullets: ['بحث فوري بالاسم أو رقم الملف', 'الحساسيات والحالات المزمنة ظاهرة', 'ربط الجلسات والفواتير بالملف'],
  },
  {
    id: '04', kind: 'two', tag: 'جلسات الليزر', img: 'laser.png', dur: 5.2,
    title: 'منظومة جلسات الليزر وإزالة الشعر',
    sub: 'خطة جلسات كاملة لكل منطقة جسم، بمتابعة التقدم وعدد الجلسات المتبقية.',
    bullets: ['متابعة المناطق ونسبة التقدّم', 'خطة جلسات ومواعيد تلقائية', 'ربط الجهاز والمستلزمات بكل جلسة'],
  },
  {
    id: '05', kind: 'two', tag: 'الحقن التجميلية', img: 'injectables.png', dur: 5.2,
    title: 'البوتوكس وحقن الفيلر',
    sub: 'تسجيل الوحدات والمناطق المعالجة لكل جلسة، مع متابعة النتيجة على الخط الزمني.',
    bullets: ['مناطق الوجه والوحدات المستخدمة', 'ربط المنتج بالمخزون تلقائياً', 'متابعة النتيجة بالمقارنة قبل وبعد'],
  },
  {
    id: '06', kind: 'two', tag: 'العناية بالبشرة', img: 'skincare.png', dur: 5.0,
    title: 'العناية ببشرة الوجه والماسكات',
    sub: 'خطة عناية مسعّرة بماسكات وأنواع علاجية، تُرحّل تلقائياً إلى فاتورة العميلة.',
    bullets: ['أنواع ماسكات وعلاجات مسعّرة', 'تخصيص الخطة حسب نوع البشرة', 'طباعة/إرسال الخطة للعميلة'],
  },
  {
    id: '07', kind: 'two', tag: 'الباقات والعروض', img: 'packages.png', dur: 5.0,
    title: 'باقات وعروض الجلسات',
    sub: 'بيع باقات جلسات بأسعار مخفّضة وخصم من رصيد الجلسات مع كل زيارة.',
    bullets: ['باقات مخصّصة بعدد جلسات', 'خصم تلقائي من الرصيد عند الزيارة', 'متابعة الجلسات المتبقية لكل عميلة'],
  },
  {
    id: '08', kind: 'two', tag: 'طابور العمل', img: 'appointments.png', dur: 5.0,
    title: 'طابور الحالات والمواعيد',
    sub: 'مواعيد ومهام كل طبيبة في عرض واحد، مع تغيير الحالة بنقرة واحدة.',
    bullets: ['طابور لكل طبيبة بالوردية', 'تغيير الحالة بنقرة (وصول ← كشف ← تم)', 'رسالة واتساب جاهزة باسم العميلة'],
  },
  {
    id: '09', kind: 'two', tag: 'الماليات', img: 'invoices.png', dur: 5.0,
    title: 'الفواتير والمالية والخزينة',
    sub: 'فاتورة بخصم وضريبة، مع تحصيل ومتبقٍ لكل فاتورة وحركة خزينة يومية.',
    bullets: ['فاتورة ضريبية بخصم وضريبة', 'محصّل ومتبقٍ لكل فاتورة', 'حركة الخزينة والإيراد اليومي'],
  },
  {
    id: '10', kind: 'two', tag: 'المخزون والأجهزة', img: 'inventory.png', dur: 5.0,
    title: 'المخزون والمستلزمات والأجهزة',
    sub: 'رصيد المستلزمات وحركات الصرف، ومتابعة أجهزة العيادة والمعايرة الدورية.',
    bullets: ['رصيد المستلزمات وتنبيه الحد الأدنى', 'حركات صرف وربطها بالجلسات', 'سجل الأجهزة ومواعيد المعايرة'],
  },
  {
    id: '11', kind: 'wide', tag: 'التقارير والإدارة', dur: 5.4,
    title: 'التقارير والأمان وإعدادات العيادة',
    sub: 'مؤشرات يومية وإيرادات، سجل رقابة كامل بكل حركة، وهوية عيادتك في كل شاشة.',
    bullets: ['تقرير يومي ومؤشرات الإيراد', 'سجل رقابة لكل عملية', 'هوية وألوان وصلاحيات فريقك'],
    images: [{ file: 'reports.png', w: 903 }, { file: 'audit.png', w: 673 }],
  },
  {
    id: '12', kind: 'outro', dur: 5.0,
    title1: 'Entrustic', title2: 'Beauty Web App',
    hook: 'جاهزين نجهّز نسخة عيادتك — باسمك ولوجو عيادتك؟',
    sub: 'تواصل معنا واحصل على عرض مخصّص لعيادتك.',
  },
];

const css = `
:root{--navy:#12124F;--indigo:#3838DA;--cyan:#12B4C8;--muted:#B7C4F2;--light:#E7EDFF}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#080826}
body{width:1920px;height:1080px;overflow:hidden}
#scene{position:relative;width:1920px;height:1080px;overflow:hidden;color:#fff;
font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;
background:radial-gradient(1100px 700px at 90% -14%,rgba(56,56,218,.62),transparent 60%),radial-gradient(1000px 700px at 2% 114%,rgba(18,180,200,.46),transparent 62%),linear-gradient(135deg,#0A0A2E 0%,#15155C 54%,#082850 100%)}

/* ---------- ambient motion (background orbs) ---------- */
.orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.5;pointer-events:none;z-index:0}
.orb.a{width:620px;height:620px;left:-160px;top:-180px;background:radial-gradient(circle,rgba(56,56,218,.85),transparent 68%);animation:float1 11s ease-in-out infinite}
.orb.b{width:700px;height:700px;right:-200px;bottom:-240px;background:radial-gradient(circle,rgba(18,180,200,.75),transparent 68%);animation:float2 13s ease-in-out infinite}
@keyframes float1{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(70px,60px,0)}}
@keyframes float2{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(-80px,-50px,0)}}

/* ---------- shared chrome ---------- */
.topbar{position:absolute;top:38px;left:64px;height:54px;display:flex;align-items:center;z-index:6;animation:revealDown .7s .05s both}
.chip{background:#fff;border-radius:14px;padding:8px 18px;display:flex;align-items:center;box-shadow:0 20px 44px -20px rgba(0,0,0,.85)}
.topbar .chip img{height:38px;display:block}
.brandline{position:absolute;top:48px;right:64px;z-index:6;display:flex;align-items:center;gap:12px;animation:revealDown .7s .1s both}
.brandline .bname{font-size:24px;font-weight:900;letter-spacing:.2px;color:#EAF2FF}
.brandline .bsub{font-size:15px;font-weight:700;color:#9FB0E8}
.tag{display:inline-flex;align-items:center;font-weight:800;font-size:22px;color:#DCE6FF;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.24);padding:8px 18px;border-radius:999px}
.title{font-weight:900;line-height:1.18;letter-spacing:-.5px;color:#fff}
.sub{color:var(--muted);font-weight:600;line-height:1.72}
.bullets{display:flex;flex-direction:column;gap:14px;margin-top:26px}
.bullet{display:flex;align-items:center;gap:12px;font-weight:700;font-size:23px;color:var(--light)}
.bullet .ic{flex:0 0 30px;height:30px;border-radius:9px;background:linear-gradient(135deg,var(--indigo),var(--cyan));color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;box-shadow:0 8px 18px -8px rgba(56,56,218,.9)}
.shot{border-radius:18px;overflow:hidden;background:#fff;border:1px solid rgba(255,255,255,.55);
box-shadow:0 0 0 10px rgba(255,255,255,.055),0 54px 120px -42px rgba(0,0,0,.9),0 18px 46px -20px rgba(0,0,0,.6)}
.bar{height:46px;display:flex;align-items:center;gap:9px;padding:0 16px;background:linear-gradient(180deg,#1C1C66,#10104A)}
.dot{width:11px;height:11px;border-radius:50%}
.url{flex:1;height:26px;border-radius:13px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:13px;color:#CBD6FF;direction:ltr}
.shot img{display:block;width:100%;height:auto}
.footer{position:absolute;left:64px;right:64px;bottom:30px;display:flex;align-items:center;justify-content:space-between;color:#8B97CE;font-size:18px;font-weight:700;z-index:6}
.footer .fl{display:flex;align-items:center;gap:12px}
.footer .fchip{background:#fff;border-radius:10px;padding:5px 12px;display:flex;align-items:center}
.footer .fchip img{height:22px;display:block}

/* ---------- reveal animations ---------- */
@keyframes revealUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes revealDown{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:translateY(0)}}
@keyframes revealRight{from{opacity:0;transform:translateX(-38px)}to{opacity:1;transform:translateX(0)}}
@keyframes shotIn{from{opacity:0;transform:translateY(34px) scale(.965)}to{opacity:1;transform:translateY(0) scale(1)}}
/* slow ken-burns drift on the screenshot itself */
@keyframes kenburns{0%{transform:scale(1) translate(0,0)}50%{transform:scale(1.045) translate(-8px,-10px)}100%{transform:scale(1.02) translate(4px,6px)}}
/* bottom progress bar */
@keyframes progress{from{width:0%}to{width:100%}}

.a-tag{animation:revealUp .6s .15s both}
.a-title{animation:revealUp .65s .32s both}
.a-sub{animation:revealUp .65s .5s both}
.a-b1{animation:revealRight .6s .72s both}
.a-b2{animation:revealRight .6s .86s both}
.a-b3{animation:revealRight .6s 1s both}
.a-shot{animation:shotIn .85s .3s both}
.a-shot2{animation:shotIn .85s .5s both}
.kenburns img{animation:kenburns SCENE_DURATION ease-in-out both}

/* ---------- layout: two ---------- */
.two{position:absolute;inset:0;display:flex;align-items:center;gap:48px;padding:0 56px;z-index:3}
.two .text{flex:0 0 448px;width:448px;padding-top:8px}
.two .card{flex:1;display:flex;justify-content:center}
.two .shot{width:1312px}
.two .title{font-size:54px;margin-top:18px}
.two .sub{font-size:23px;margin-top:16px}

/* ---------- layout: wide ---------- */
.wide{position:absolute;inset:0;display:flex;flex-direction:column;padding:112px 72px 0;z-index:3}
.wide .head{display:block}
.wide .t{max-width:1400px;width:1400px}
.wide .title{font-size:52px;margin-top:16px}
.wide .sub{font-size:23px;margin-top:10px}
.wide .cards{display:flex;gap:26px;justify-content:center;align-items:flex-start;margin-top:26px}
.wide .shot{width:860px}
.wide .bullets{flex-direction:row;gap:30px;justify-content:center;margin-top:22px}
.wide .bullet{font-size:22px}

/* ---------- layout: hero / outro ---------- */
.hero{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;padding:0 90px;z-index:3}
.hero .lcard{background:#fff;border-radius:22px;padding:22px 36px;box-shadow:0 34px 80px -34px rgba(0,0,0,.65);animation:revealUp .8s .1s both}
.hero .lcard img{height:76px;display:block}
.hero h1{font-size:66px;font-weight:900;margin:40px 0 0;line-height:1.16;animation:revealUp .8s .35s both}
.hero .hook{margin-top:26px;font-size:33px;font-weight:800;max-width:1460px;line-height:1.55;color:#EAF2FF;animation:revealUp .8s .6s both}
.hero .sub2{margin-top:22px;font-size:24px;color:#BCC9F4;font-weight:600;max-width:1240px;line-height:1.7;animation:revealUp .8s .85s both}
.hero .kicker{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;max-width:1640px}
.hero .pill{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.24);color:#EAF2FF;padding:10px 22px;border-radius:999px;font-size:21px;font-weight:700;animation:revealUp .5s both}

/* ---------- progress bar ---------- */
.progress{position:absolute;left:0;bottom:0;height:6px;z-index:9;background:linear-gradient(90deg,var(--indigo),var(--cyan));animation:progress SCENE_DURATION linear both}
`;

const barHtml = () =>
  `<div class="bar"><span class="dot" style="background:#FF6058"></span><span class="dot" style="background:#FFBD2E"></span><span class="dot" style="background:#28CA42"></span><div class="url">app.entrustic.com</div></div>`;
const shotCard = (img, w, cls) =>
  `<div class="shot ${cls}"${w ? ` style="width:${w}px"` : ''}>${barHtml()}<div class="kenburns"><img src="../shots/${img}" alt=""></div></div>`;
const logoChip = () => `<div class="chip"><img src="../brand/entrustic-logo.png" alt="Entrustic"></div>`;
const topbar = () => `<div class="topbar">${logoChip()}</div>`;
const brandline = () =>
  `<div class="brandline"><div class="bname">Entrustic Beauty</div><div class="bsub">Clinic Management</div></div>`;
const footer = (n) =>
  `<div class="footer"><div class="fl"><div class="fchip"><img src="../brand/entrustic-logo.png" alt="Entrustic"></div><span>Entrustic Beauty</span></div><span>${n}</span></div>`;
const bullets = (arr) => {
  const cls = ['a-b1', 'a-b2', 'a-b3', 'a-b1'];
  return `<div class="bullets">${arr
    .map((b, i) => `<div class="bullet ${cls[i % 4]}"><span class="ic">\u2713</span><span>${b}</span></div>`)
    .join('')}</div>`;
};
const orbs = () => `<div class="orb a"></div><div class="orb b"></div>`;

const shell = (s, body) => `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Entrustic Beauty ${s.id}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>${css.replace(/SCENE_DURATION/g, s.dur + 's')}</style></head>
<body><div id="scene" role="img" aria-label="scene-${s.id}">${orbs()}${brandline()}${body}<div class="progress"></div></div></body></html>`;

function renderHero(s) {
  const pills = s.pills
    .map((p, i) => `<span class="pill" style="animation-delay:${1.05 + i * 0.11}s">${p}</span>`)
    .join('');
  return shell(s, `<div class="hero">
    <div class="lcard"><img src="../brand/entrustic-logo.png" alt="Entrustic"></div>
    <h1>${s.title1}<br>${s.title2}</h1>
    <div class="hook">${s.hook}</div>
    <div class="sub2">${s.sub}</div>
    <div class="kicker">${pills}</div>
  </div>`);
}
function renderOutro(s) {
  return shell(s, `<div class="hero">
    <div class="lcard"><img src="../brand/entrustic-logo.png" alt="Entrustic"></div>
    <h1>${s.title1}<br>${s.title2}</h1>
    <div class="hook">${s.hook}</div>
    <div class="sub2">${s.sub}</div>
  </div>`);
}
function renderTwo(s, n) {
  return shell(s, `${topbar()}
  <div class="two">
    <div class="text">
      <span class="tag a-tag">${s.tag}</span>
      <div class="title a-title">${s.title}</div>
      <div class="sub a-sub">${s.sub}</div>
      ${bullets(s.bullets)}
    </div>
    <div class="card">${shotCard(s.img, null, 'a-shot')}</div>
  </div>${footer(n)}`);
}
function renderWide(s, n) {
  const cards = s.images
    .map((im, i) => shotCard(im.file, im.w, i === 0 ? 'a-shot' : 'a-shot2'))
    .join('');
  return shell(s, `${topbar()}
  <div class="wide">
    <div class="head"><div class="t"><span class="tag a-tag">${s.tag}</span><div class="title a-title">${s.title}</div><div class="sub a-sub">${s.sub}</div></div></div>
    <div class="cards">${cards}</div>
    ${bullets(s.bullets)}
  </div>${footer(n)}`);
}

const manifest = [];
let total = 0;
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  const n = String(i + 1).padStart(2, '0') + ' / ' + scenes.length;
  let html;
  if (s.kind === 'hero') html = renderHero(s);
  else if (s.kind === 'outro') html = renderOutro(s);
  else if (s.kind === 'wide') html = renderWide(s, n);
  else html = renderTwo(s, n);
  const file = `scene-${s.id}.html`;
  fs.writeFileSync(path.join(OUT, file), html, 'utf8');
  manifest.push({
    id: s.id,
    file,
    dur: s.dur,
    kind: s.kind,
    media: s.images ? s.images.map((x) => x.file).join('+') : s.img || null,
  });
  total += s.dur;
}
fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('scenes:', manifest.length, 'total seconds:', total);
console.log(manifest.map((m) => m.file + ' @ ' + m.dur + 's  [' + m.media + ']').join('\n'));
