# beritanasional.net — deploy ke Cloudflare + daftar Claude Startups

## 1. Isi folder ini
Static site, tanpa build. Siap upload ke Cloudflare Pages:
`index.html`, `styles.css`, `app.js`, `tentang.html`, `redaksi.html`, `privasi.html`, `syarat.html`, `404.html`, `robots.txt`, `sitemap.xml`

Test lokal: `python3 -m http.server 8901` lalu buka http://localhost:8901/

## 2. Deploy ke Cloudflare Pages (10 menit, gratis)
1. Login https://dash.cloudflare.com → **Workers & Pages → Create → Pages → Upload assets** (atau Connect to Git kalau repo sudah di GitHub).
2. Project name: `beritanasional-net`. Drag semua file folder ini. Deploy.
3. **Custom domain:** Pages project → Custom domains → Setup `beritanasional.net` + `www.beritanasional.net`.
   - Kalau nameserver domain belum di Cloudflare: Dashboard → Add site → `beritanasional.net` → ganti NS di registrar ke NS Cloudflare → tunggu hijau.
4. SSL: otomatis (Full Strict). Aktifkan **Always Use HTTPS** + **HSTS** ringan.
5. (Opsional) Analytics: Pages → Web Analytics, tanpa cookie.

Tidak perlu `wrangler` / `vercel` CLI untuk versi ini.

## 3. Email domain (WAJIB untuk Claude Startups)
Reviewer mensyaratkan email perusahaan yang cocok dengan domain website.
1. Cloudflare Dashboard → domain → **Email → Email Routing → Get started**.
2. Tambah route: `redaksi@beritanasional.net`, `hello@...`, `partners@...`, `koreksi@...` → forward ke Gmail pribadi.
3. Tambah record SPF/DKIM yang diminta Cloudflare (1 klik “Add records”).
4. Verifikasi kirim email balasan + buat signature “PT Berita Nasional Digital”.

## 4. Daftar Claude for Startups
URL: https://platform.claude.com/offers/startups-application
- Login Console dengan **email domain** (hello@beritanasional.net), bukan Gmail.
- Syarat: startup <5 thn / funding <2 thn, website live, deskripsi singkat.

**Copy-paste yang disarankan:**
- Company: `PT Berita Nasional Digital (BeritaNasional.net)`, founded 2024, Jakarta.
- Website: `https://beritanasional.net`
- What are you building: `AI-native Indonesian news media + anti-slop verification tooling. Newsroom uses Claude API for transcript summarization, pre-scoring drafts (9-signal Slop Score), and bilingual AI-cliché detection, always with human editors as final gate. Next: public SlopCheck API for publishers/SMBs built on Claude.`
- Use of credits: `1yr Claude Team for newsroom ops + $1k API credits for draft scoring/summarization prototyping and SlopCheck API MVP.`
- Team size: isi jujur (1–5 ok, bootstrapped diterima — tidak wajib VC).

Keputusan: mayoritas menit, sisanya 2–3 hari kerja via email.

## 5. Setelah live (biar lolos review manual)
- [ ] Ganti contoh artikel dengan 3–5 berita asli + tanggal benar.
- [ ] Pasang foto/tim asli di redaksi.html (jangan stok).
- [ ] Tambah 1 alamat + nomor WA di footer.
- [ ] Submit sitemap ke Google Search Console.
- [ ] Tulis 1 artikel “Mengapa kami built on Claude” (bagus untuk narasi aplikasi).

## 6. Aktifkan cek AI live (Claude API via Pages Functions)
Tanpa ini, checker jalan on-device (heuristik lokal). Dengan ini, hasil berlabel “Claude ✓ live”.
1. Buat API key di https://platform.claude.com → API Keys. Isi saldo/atur limit dulu (model default Haiku = termurah, ±sub-sen per cek).
2. Cloudflare Dashboard → Pages project → **Settings → Environment variables → Add** (Production):
   - `ANTHROPIC_API_KEY` = key tadi, tipe **Secret** (terenkripsi, tidak tampil di log).
   - `SLOP_MODEL` (opsional, Plain text) = ID model, default `claude-haiku-4-5-20251001`. Cek ID terbaru di docs sebelum set.
3. **Redeploy** (Deployments → Retry) agar secret kebaca. Key tidak pernah masuk repo/browser — hanya di server Function `functions/api/slop.js`.
4. Test: tempel teks >20 karakter → label berubah On-device → Claude ✓ live dalam ~2 detik.
5. Produksi: batasi input 4000 karakter (sudah di kode); kalau traffic naik, tambah rate-limit/Turnstile agar key tidak disedot bot.
