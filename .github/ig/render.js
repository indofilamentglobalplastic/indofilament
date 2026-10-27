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
// foto versi Instagram (mis. logo kaos di-blur) di .github/ig/foto/ dipakai kalau ada; selain itu foto website
const FOTO_IG = path.join(__dirname, 'foto');
const foto = f => { const n = (FOTO.includes(f) ? f : 'factory-hall') + '.jpg'; return fs.existsSync(path.join(FOTO_IG, n)) ? 'file://' + path.join(FOTO_IG, n).replace(/\/g, '/') : IMG + n; };
let EN = false; // postingan berbahasa Inggris (topik memuat kata ENGLISH atau post.lang = 'en')

// Tema mengikuti website: hijau tua + mint + krem, judul Playfair Display, isi DM Sans. Slide "points" berlatar krem.
const css = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden;background:#022620}
body{font-family:'DM Sans',sans-serif;color:#F4F2EC}
.s{position:relative;width:1080px;height:1350px;overflow:hidden;background:radial-gradient(120% 80% at 85% 0%,#0F6E56 0%,#04342C 45%,#022620 100%)}
.s::after{content:'';position:absolute;right:-180px;bottom:-180px;width:520px;height:520px;border-radius:50%;border:60px solid rgba(93,202,165,.08)}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(2,38,32,.45) 0%,rgba(2,38,32,.15) 35%,rgba(4,52,44,.9) 68%,#022620 100%)}
.dim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,52,44,.72),rgba(2,38,32,.9) 45%,#022620)}
.logo{position:absolute;top:60px;left:72px;height:64px;border-radius:12px;box-shadow:0 0 0 2px rgba(93,202,165,.35)}
.page{position:absolute;top:78px;right:72px;font:700 26px 'DM Sans';color:#5DCAA5;letter-spacing:.08em}
.gold{color:#5DCAA5}
h1{font:800 92px/1.04 'Playfair Display',serif;letter-spacing:-.01em}
h2{font:800 66px/1.1 'Playfair Display',serif}
.lead{font:500 34px/1.45 'DM Sans';color:#DDEFE7}
.kicker{display:inline-block;font:700 24px 'DM Sans';letter-spacing:.2em;text-transform:uppercase;color:#022620;background:#5DCAA5;padding:10px 22px;border-radius:999px}
.line{width:120px;height:6px;border-radius:3px;background:linear-gradient(90deg,#5DCAA5,#E8C84A)}
.foot{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font:500 24px 'DM Sans';color:#9CC9B8;z-index:2}
.card{background:rgba(255,255,255,.07);border:1.5px solid rgba(93,202,165,.4);border-radius:28px;padding:40px}
.top{position:absolute;left:72px;right:72px;top:210px;z-index:1}
.num{flex:0 0 72px;height:72px;border-radius:50%;background:#0F6E56;color:#F4F2EC;font:700 34px/72px 'DM Sans';text-align:center}
.light{background:#F4F2EC;color:#2C2C2A}
.light::after{border-color:rgba(15,110,86,.08)}
.light .lead{color:#5F5E5A}.light .gold{color:#0F6E56}.light .kicker{background:#0F6E56;color:#F4F2EC}.light .page{color:#0F6E56}.light .foot{color:#5F5E5A}
.wa{display:inline-flex;align-items:center;background:#25D366;color:#fff;border-radius:999px;padding:28px 48px;font:700 38px 'DM Sans';box-shadow:0 10px 30px rgba(37,211,102,.25)}
`;

const tpl = {
  cover: s => `<div class="bg" style="background-image:url('${foto(s.bg)}')"></div><div class="shade"></div>
    <div style="position:absolute;left:72px;right:72px;bottom:170px">
      <div class="kicker">${esc(s.kicker)}</div><div style="height:28px"></div>
      <h1>${gold(s.title)}</h1>
      <div style="height:36px"></div><div class="line"></div><div style="height:36px"></div>
      <p class="lead">${esc(s.lead)}</p></div>`,
  points: s => `
    <div class="top"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:48px"></div>
      ${(s.items || []).slice(0, 5).map((it, i) => `<div style="display:flex;gap:28px;align-items:flex-start;margin-bottom:30px">
        <div class="num">${i + 1}</div>
        <div><div style="font:700 36px/1.2 'DM Sans'">${esc(it.t)}</div><div style="height:6px"></div><p class="lead" style="font-size:28px">${esc(it.d)}</p></div></div>`).join('')}
    </div>`,
  stats: s => `<div class="bg" style="background-image:url('${foto(s.bg || 'factory-hall')}')"></div><div class="dim"></div>
    <div class="top" style="top:250px"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:52px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px">
        ${(s.stats || []).slice(0, 4).map(x => `<div class="card" style="padding:36px"><div class="gold" style="font:800 56px/1.05 'Playfair Display',serif">${esc(x.big)}</div><div style="height:14px"></div><p class="lead" style="font-size:27px">${esc(x.small)}</p></div>`).join('')}
      </div>
      ${s.note ? `<div style="height:36px"></div><div class="card" style="padding:30px 36px"><p class="lead" style="font-size:28px">${esc(s.note)}</p></div>` : ''}
    </div>`,
  photo: s => `<div class="top"><div class="kicker">${esc(s.kicker)}</div><div style="height:24px"></div>
      <h2>${gold(s.title)}</h2><div style="height:44px"></div>
      <div style="height:680px;border-radius:28px;background:url('${foto(s.photo)}') center/cover"></div>
      <div style="height:40px"></div><p class="lead">${esc(s.lead)}</p></div>`,
  cta: s => `<div class="top"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        ${['yellow', 'green', 'blue', 'pink', 'bright-gold', 'copper-gold'].map(c => `<div style="height:220px;border-radius:22px;background:url('${foto(c)}') center/cover"></div>`).join('')}
      </div><div style="height:56px"></div>
      <h2>${gold(s.title)}</h2><div style="height:24px"></div>
      <p class="lead">${esc(s.lead)}</p><div style="height:48px"></div>
      <div class="wa">${WA}</div></div>`
};

const page = (s, n, total) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="s${s.type === 'points' ? ' light' : ''}">
${(tpl[s.type] || tpl.points)(s)}
<img class="logo" src="${IMG}logo-gold.jpg"><div class="page">${n}/${total}</div>
<div class="foot"><span>indofilamentglobalplastic.com</span><span>${n < total ? (EN ? 'Swipe &rarr;' : 'Geser &rarr;') : (EN ? 'Samples available' : 'Sampel tersedia')}</span></div></div></body></html>`;

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
      EN = p.lang === 'en' || /ENGLISH/i.test(p.topic || '');
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
