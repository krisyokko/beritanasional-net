/* Build arsip + halaman artikel statis dari data/berita.json
   Usage: node scripts/build.js
   Output: arsip.html, berita/<slug>.html, sitemap.xml (regenerated) */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = { "01": "Januari", "02": "Februari", "03": "Maret", "04": "April", "05": "Mei", "06": "Juni", "07": "Juli", "08": "Agustus", "09": "September", "10": "Oktober", "11": "November", "12": "Desember" };

const items = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "berita.json"), "utf8"))
  .sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));

const NAV = `<header class="nav"><a class="brand" href="/"><span class="brand-mark">BN</span><span>BeritaNasional<span class="tld">.net</span></span></a><nav class="nav-links"><a href="/#verifikasi">Verifikasi</a><a href="/#berita">Berita</a><a href="./arsip.html">Arsip</a><a href="/#metodologi">Metodologi</a><a href="/#redaksi">Redaksi</a></nav><a class="btn small" href="mailto:redaksi@beritanasional.net">Hubungi Redaksi</a></header>`;
const FOOT = `<footer><p class="fine" style="text-align:center">© 2026 PT Berita Nasional Digital · <a href="/">Beranda</a> · <a href="./arsip.html">Arsip</a> · Koreksi: <a href="mailto:koreksi@beritanasional.net">koreksi@beritanasional.net</a></p></footer>`;

function articlePage(a) {
  const paras = a.ringkasan.map((p) => `<p>${esc(p)}</p>`).join("\n");
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(a.judul)} — BeritaNasional.net</title>
<meta name="description" content="${esc(a.ringkasan[0].slice(0, 155))}" />
<link rel="canonical" href="https://beritanasional.net/berita/${a.slug}.html" />
<link rel="stylesheet" href="../styles.css" />
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"NewsArticle","headline":${JSON.stringify(a.judul)},"datePublished":"${a.tanggal}","inLanguage":"id","author":{"@type":"Organization","name":"BeritaNasional.net"},"publisher":{"@type":"Organization","name":"BeritaNasional.net"}}
</script>
</head>
<body>
${NAV}
<main class="section" style="max-width:760px">
<p class="kicker">ARSIP RANGKUMAN REDAKSI · ${esc(a.kategori.toUpperCase())} · ${esc(a.display.toUpperCase())}</p>
<h1>${esc(a.judul)}</h1>
<p class="paper-meta">${esc(a.lokasi)} · ${esc(a.display)} · ${a.menit} mnt baca</p>
<div style="margin:12px 0"><span class="score-pill clean"><b>${a.skor}/100</b> CLEAN ✓</span> <span class="fine">Slop Score terverifikasi redaksi</span></div>
${paras}
<div class="banner">Artikel arsip: rangkuman redaksi atas peristiwa yang telah terverifikasi dari sumber primer dan pemberitaan resmi. Ada koreksi? <a href="mailto:koreksi@beritanasional.net">koreksi@beritanasional.net</a> (maks. 2×24 jam).</div>
<p class="fine"><a href="./arsip.html">← Semua arsip</a> · <a href="/">Beranda →</a></p>
</main>
${FOOT}
</body>
</html>`;
}

function arsipPage(groups) {
  const body = groups.map(([year, months]) =>
    `<h2 style="margin-top:28px">${year}</h2>` + months.map(([ym, list]) => {
      const [y, m] = ym.split("-");
      const cards = list.map((a) => `<article class="news"><span class="tag">${esc(a.kategori)}</span><h3><a href="./berita/${a.slug}.html">${esc(a.judul)}</a></h3><div class="nmeta"><span class="score-pill clean">${a.skor} CLEAN</span><span>${esc(a.display)}</span></div></article>`).join("\n");
      return `<h3 style="color:var(--red)">${MONTHS[m]} ${y}</h3><div class="news-grid">${cards}</div>`;
    }).join("\n")
  ).join("\n");
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Arsip Berita 2024–2026 — BeritaNasional.net</title>
<meta name="description" content="Arsip rangkuman redaksi BeritaNasional.net sejak 2024: pilpres, pelantikan, ekonomi, dan peristiwa nasional terverifikasi." />
<link rel="canonical" href="https://beritanasional.net/arsip.html" />
<link rel="stylesheet" href="./styles.css" />
</head>
<body>
${NAV}
<main class="section">
<p class="kicker">ARSIP</p>
<h1>Berita sejak 2024</h1>
<p>Rangkuman redaksi atas peristiwa nasional terverifikasi — terbaru di atas. Setiap artikel tayang dengan Slop Score publik.</p>
${body}
</main>
${FOOT}
</body>
</html>`;
}

// group by year -> month
const byYear = {};
for (const a of items) {
  const y = a.tanggal.slice(0, 4), ym = a.tanggal.slice(0, 7);
  byYear[y] = byYear[y] || {};
  byYear[y][ym] = byYear[y][ym] || [];
  byYear[y][ym].push(a);
}
const groups = Object.keys(byYear).sort().reverse().map((y) => [y, Object.keys(byYear[y]).sort().reverse().map((ym) => [ym, byYear[y][ym]])]);

fs.mkdirSync(path.join(ROOT, "berita"), { recursive: true });
for (const a of items) fs.writeFileSync(path.join(ROOT, "berita", a.slug + ".html"), articlePage(a));
fs.writeFileSync(path.join(ROOT, "arsip.html"), arsipPage(groups));

const statics = ["", "tentang.html", "redaksi.html", "privasi.html", "syarat.html", "mengapa-built-on-claude.html", "arsip.html"];
const urls = [...statics.map((p) => `https://beritanasional.net/${p}`), ...items.map((a) => `https://beritanasional.net/berita/${a.slug}.html`)];
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `<url><loc>${u}</loc></url>`).join("\n") + `\n</urlset>\n`);

console.log(`built ${items.length} articles + arsip.html + sitemap (${urls.length} urls)`);
