// Render carousel Instagram: ig/<id>/post.json -> ig/<id>/1.jpg ... N.jpg + index.html (preview, noindex).
// Dijalankan oleh .github/workflows/ig-render.yml. Lokal: node .github/ig/render.js [ig/<id> ...] (butuh CHROME_PATH).
const fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');
const ROOT = path.join(__dirname, '..', '..');
const IMG = 'file://' + path.join(ROOT, 'img').replace(/\\/g, '/') + '/';
const FOTO = ['bright-gold', 'copper-gold', 'yellow', 'green', 'blue', 'pink', 'broom-bristles', 'brush-bristles', 'brush-bundles', 'brush-hero', 'brush-hero2', 'custom-oem', 'custom-samples', 'factory-hall', 'home-hero-bg'];
const WA = 'WhatsApp +62 831-6591-3330';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// *teks* = warna emas
const gold = s => esc(s).replace(/\*([^*]+)\*/g, '<span class="gold">$1</span>').replace(/\*/g, '');
const foto = f => IMG + (FOTO.includes(f) ? f : 'factory-hall') + '.jpg';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800;900&family=Inter:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden;background:#0a0a0a}
body{font-family:Inter,sans-serif;color:#f4efe4}
.s{position:relative;width:1080px;height:1350px;overflow:hidden;background:#0a0a0a}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.55) 0%,rgba(10,10,10,.25) 35%,rgba(10,10,10,.92) 70%,#0a0a0a 100%)}
.dim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.6),rgba(10,10,10,.88) 45%,#0a0a0a)}
.logo{position:absolute;top:64px;left:72px;height:62px}
.page{position:absolute;top:78px;right:72px;font:600 26px Inter;color:#d9b45a;letter-spacing:.08em}
.gold{background:linear-gradient(90deg,#f7dc8b,#d4a542 45%,#a87a22);-webkit-background-clip:text;background-clip:text;color:transparent}
h1{font:900 88px/1.04 Montserrat;letter-spacing:-.02em}
h2{font:800 64px/1.08 Montserrat;letter-spacing:-.01em}
.lead{font:500 34px/1.4 Inter;color:#e9e2d2}
.kicker{font:700 26px Montserrat;letter-spacing:.22em;text-transform:uppercase;color:#d9b45a}
.line{width:120px;height:6px;border-radius:3px;background:linear-gradient(90deg,#f7dc8b,#a87a22)}
.foot{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font:500 24px Inter;color:#b9b0a0}
.card{background:rgba(255,255,255,.06);border:1.5px solid rgba(217,180,90,.35);border-radius:28px;padding:40px}
.top{position:absolute;left:72px;right:72px;top:210px}
`;

const tpl = {
  cover: s => `<div class="bg" style="background-image:url('${foto(s.bg)}')"></div><div class="shade"></div>
    <div style="position:absolute;left:72px;right:72px;bottom:170px">
      <div class="kicker">${esc(s.kicker)}</div><div style="height:28px"></div>
      <h1>${gold(s.title)}</h1>
      <div style="height:36px"></div><div class="line"></div><div style="height:36px"></div>
      <p class="lead">${esc(s.lead)}</p></div>`,
  points: s => `${s.bg ? `<div class="bg" style="background-image:url('${foto(s.bg)}');opacity:.2"></div>` : ''}
    <div class="top"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:48px"></div>
      ${(s.items || []).slice(0, 5).map((it, i) => `<div style="display:flex;gap:28px;align-items:flex-start;margin-bottom:30px">
        <div style="flex:0 0 72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#f7dc8b,#a87a22);color:#0a0a0a;font:900 34px/72px Montserrat;text-align:center">${i + 1}</div>
        <div><div style="font:800 36px/1.2 Montserrat">${esc(it.t)}</div><div style="height:6px"></div><p class="lead" style="font-size:28px;color:#cfc6b4">${esc(it.d)}</p></div></div>`).join('')}
    </div>`,
  stats: s => `<div class="bg" style="background-image:url('${foto(s.bg || 'factory-hall')}')"></div><div class="dim"></div>
    <div class="top" style="top:250px"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:52px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
        ${(s.stats || []).slice(0, 4).map(x => `<div class="card" style="padding:36px"><div class="gold" style="font:900 56px/1.05 Montserrat">${esc(x.big)}</div><div style="height:14px"></div><p class="lead" style="font-size:27px">${esc(x.small)}</p></div>`).join('')}
      </div>
      ${s.note ? `<div style="height:36px"></div><div class="card" style="padding:30px 36px"><p class="lead" style="font-size:28px">${esc(s.note)}</p></div>` : ''}
    </div>`,
  photo: s => `<div class="top"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:44px"></div>
      <div style="height:680px;border-radius:28px;background:url('${foto(s.photo)}') center/cover"></div>
      <div style="height:40px"></div><p class="lead">${esc(s.lead)}</p></div>`,
  cta: s => `<div class="top"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        ${['yellow', 'green', 'blue', 'pink', 'bright-gold', 'copper-gold'].map(c => `<div style="height:220px;border-radius:22px;background:url('${IMG}${c}.jpg') center/cover"></div>`).join('')}
      </div><div style="height:56px"></div>
      <h2>${gold(s.title)}</h2><div style="height:24px"></div>
      <p class="lead">${esc(s.lead)}</p><div style="height:48px"></div>
      <div style="display:inline-flex;align-items:center;background:linear-gradient(90deg,#f7dc8b,#c9963a);color:#0a0a0a;border-radius:999px;padding:28px 48px;font:800 38px Montserrat">${WA}</div></div>`
};

const page = (s, n, total) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="s">
${(tpl[s.type] || tpl.points)(s)}
<img class="logo" src="${IMG}logo-gold.jpg"><div class="page">${n}/${total}</div>
<div class="foot"><span>indofilamentglobalplastic.com</span><span>${n < total ? 'Geser &rarr;' : 'Sampel tersedia'}</span></div></div></body></html>`;

const preview = (p, n) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Preview Instagram ${esc(p.id)}</title><style>body{margin:0;background:#111;color:#eee;font:16px/1.5 system-ui,sans-serif}main{max-width:560px;margin:0 auto;padding:16px}img{width:100%;display:block;margin:0 0 12px;border-radius:8px}pre{white-space:pre-wrap;background:#1b1b1b;padding:16px;border-radius:8px;font:15px/1.5 system-ui,sans-serif}</style></head>
<body><main><h1 style="font-size:20px">${esc(p.topic || 'Postingan Instagram')}</h1>
${Array.from({ length: n }, (_, i) => `<img src="${i + 1}.jpg" alt="Slide ${i + 1}">`).join('\n')}
<pre>${esc(p.caption)}</pre></main></body></html>`;

(async () => {
  const igDir = path.join(ROOT, 'ig');
  const dirs = process.argv.slice(2).length ? process.argv.slice(2).map(d => path.resolve(d))
    : (fs.existsSync(igDir) ? fs.readdirSync(igDir).map(d => path.join(igDir, d)) : [])
        .filter(d => fs.existsSync(path.join(d, 'post.json')) && !fs.existsSync(path.join(d, '1.jpg')));
  if (!dirs.length) { console.log('Tidak ada post baru.'); return; }
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    for (const d of dirs) {
      const p = JSON.parse(fs.readFileSync(path.join(d, 'post.json'), 'utf8'));
      const slides = (p.slides || []).slice(0, 10);
      if (!slides.length) throw new Error(d + ': slides kosong');
      for (let i = 0; i < slides.length; i++) {
        const tab = await browser.newPage();
        await tab.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
        const f = path.join(d, '_slide.html');
        fs.writeFileSync(f, page(slides[i], i + 1, slides.length));
        await tab.goto('file://' + f.replace(/\\/g, '/'), { waitUntil: 'networkidle0', timeout: 60000 });
        await tab.evaluate(() => document.fonts.ready);
        await tab.screenshot({ path: path.join(d, (i + 1) + '.jpg'), type: 'jpeg', quality: 90 });
        await tab.close(); fs.unlinkSync(f);
      }
      fs.writeFileSync(path.join(d, 'index.html'), preview(p, slides.length));
      console.log('OK', path.relative(ROOT, d), slides.length, 'slide');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
