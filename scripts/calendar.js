/* Generate kalender redaksi 1 Feb 2024 – 31 Okt 2026 (1 slot/hari).
   - Slot peristiwa nyata (terverifikasi) + hari besar + rubrik mingguan.
   - Slot berstatus "draft" TIDAK diterbitkan (build.js hanya render published).
   - published = entri data/berita.json yang tanggalnya cocok.
   Usage: node scripts/calendar.js → data/kalender.json */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

// tanggal ISO → [judul, kategori]; hanya yang terverifikasi / hari besar tetap
const ANCHOR = {
  "2024-02-04": ["Debat capres pamungkas Pilpres 2024", "Nasional"],
  "2024-02-10": ["Tahun Baru Imlek 2575 Kongzili", "Nasional"],
  "2024-02-14": ["Hari pencoblosan Pilpres & Pileg 2024", "Nasional"],
  "2024-03-20": ["KPU tetapkan Prabowo–Gibran menang satu putaran", "Nasional"],
  "2024-04-10": ["Idul Fitri 1445 H", "Nasional"],
  "2024-04-21": ["Hari Kartini", "Nasional"],
  "2024-05-01": ["Hari Buruh Internasional", "Nasional"],
  "2024-05-09": ["Kenaikan Isa Almasih", "Nasional"],
  "2024-05-23": ["Hari Raya Waisak 2568 BE", "Nasional"],
  "2024-06-01": ["Hari Lahir Pancasila", "Nasional"],
  "2024-06-11": ["Timnas melaju ke putaran tiga Kualifikasi Piala Dunia", "Olahraga"],
  "2024-06-17": ["Idul Adha 1445 H", "Nasional"],
  "2024-07-07": ["Tahun Baru Islam 1446 H", "Nasional"],
  "2024-08-17": ["HUT ke-79 RI untuk pertama kali di IKN", "Nasional"],
  "2024-09-03": ["Paus Fransiskus tiba di Indonesia", "Nasional"],
  "2024-09-09": ["PON XXI Aceh–Sumut dibuka", "Olahraga"],
  "2024-09-18": ["BI pangkas suku bunga acuan ke 6,00%", "Ekonomi"],
  "2024-09-20": ["PON XXI Aceh–Sumut ditutup", "Olahraga"],
  "2024-09-29": ["MotoGP Mandalika 2024 digelar", "Olahraga"],
  "2024-10-20": ["Prabowo–Gibran dilantik, Kabinet Merah Putih diumumkan", "Nasional"],
  "2024-10-28": ["Hari Sumpah Pemuda", "Nasional"],
  "2024-11-03": ["Erupsi besar Lewotobi Laki-laki", "Daerah"],
  "2024-11-10": ["Hari Pahlawan", "Nasional"],
  "2024-11-19": ["Timnas taklukkan Arab Saudi di GBK", "Olahraga"],
  "2024-11-27": ["Pilkada serentak terbesar dalam sejarah", "Nasional"],
  "2024-12-25": ["Hari Raya Natal", "Nasional"],
  "2024-12-26": ["20 tahun tsunami Aceh", "Daerah"],
  "2025-01-01": ["PPN 12% khusus barang mewah berlaku", "Ekonomi"],
  "2025-01-06": ["Makan Bergizi Gratis resmi dimulai", "Nasional"],
  "2025-01-29": ["Tahun Baru Imlek 2576 Kongzili", "Nasional"],
  "2025-02-24": ["Danantara diluncurkan sebagai SWF kedua RI", "Ekonomi"],
  "2025-03-29": ["Hari Raya Nyepi Tahun Baru Saka 1947", "Nasional"],
  "2025-03-31": ["Idul Fitri 1446 H", "Nasional"],
  "2025-05-12": ["Hari Raya Waisak 2569 BE", "Nasional"],
  "2025-05-29": ["Kenaikan Isa Almasih", "Nasional"],
  "2025-06-06": ["Idul Adha 1446 H", "Nasional"],
  "2025-06-27": ["Tahun Baru Islam 1447 H", "Nasional"],
  "2025-08-17": ["HUT ke-80 Kemerdekaan RI", "Nasional"],
  "2025-10-05": ["HUT ke-80 TNI", "Nasional"],
  "2025-10-28": ["Hari Sumpah Pemuda", "Nasional"],
  "2025-11-10": ["Hari Pahlawan", "Nasional"],
  "2025-12-25": ["Hari Raya Natal", "Nasional"],
  "2026-01-01": ["Tahun Baru 2026", "Nasional"],
  "2026-04-21": ["Hari Kartini", "Nasional"],
  "2026-05-01": ["Hari Buruh Internasional", "Nasional"],
  "2026-06-01": ["Hari Lahir Pancasila", "Nasional"],
  "2026-08-17": ["HUT ke-81 Kemerdekaan RI", "Nasional"],
  "2026-10-28": ["Hari Sumpah Pemuda", "Nasional"],
  "2026-12-25": ["Hari Raya Natal", "Nasional"],
};

// rubrik mingguan default (status draft — ditulis bertahap)
const RUBRIK = {
  0: ["Catatan Redaksi Pekan Ini", "Opini"],
  1: ["Ringkasan Sepekan: Nasional", "Nasional"],
  2: ["Fokus Daerah Hari Ini", "Daerah"],
  3: ["Cek Fakta: Hoaks Pekan Ini", "Cek Fakta"],
  4: ["Ekonomi Sepekan", "Ekonomi"],
  5: ["Teknologi & AI Sepekan", "Teknologi"],
  6: ["Olahraga & Komunitas Akhir Pekan", "Olahraga"],
};

const published = {};
try {
  for (const a of JSON.parse(fs.readFileSync(path.join(ROOT, "data", "berita.json"), "utf8")))
    published[a.tanggal] = a.slug;
} catch {}

const slots = [];
const d = new Date(Date.UTC(2024, 1, 1));
const end = new Date(Date.UTC(2026, 9, 31));
while (d <= end) {
  const iso = d.toISOString().slice(0, 10);
  if (published[iso]) {
    const a = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "berita.json"), "utf8")).find((x) => x.tanggal === iso);
    slots.push({ tanggal: iso, judul: a.judul, kategori: a.kategori, status: "published", slug: a.slug });
  } else if (ANCHOR[iso]) {
    slots.push({ tanggal: iso, judul: ANCHOR[iso][0], kategori: ANCHOR[iso][1], status: "draft", catatan: "peristiwa terverifikasi — tulis ringkasan" });
  } else {
    const [judul, kategori] = RUBRIK[d.getUTCDay()];
    slots.push({ tanggal: iso, judul: `${judul} (${iso})`, kategori, status: "draft", catatan: "rubrik mingguan — tulis bertahap" });
  }
  d.setUTCDate(d.getUTCDate() + 1);
}
fs.writeFileSync(path.join(ROOT, "data", "kalender.json"), JSON.stringify(slots, null, 1));
const pub = slots.filter((s) => s.status === "published").length;
const anc = slots.filter((s) => s.status === "draft" && s.catatan.startsWith("peristiwa")).length;
console.log(`kalender: ${slots.length} slot · ${pub} published · ${anc} draft peristiwa · ${slots.length - pub - anc} draft rubrik`);
