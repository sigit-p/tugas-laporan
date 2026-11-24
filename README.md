# 🏍️ Portal Praktik & Rekap Laporan PKSM (Kelas XI TSM)

Sistem informasi berbasis web untuk pemantauan progres laporan praktik, akses jobsheet, materi pembelajaran digital, serta manajemen nilai mata pelajaran **Pemeliharaan Kelistrikan Sepeda Motor (PKSM)** dan **Praktek Bengkel** di **SMK Muhammadiyah Pakem**.

🌐 **Live Portal:** [pksm.tsmmupa.my.id](https://pksm.tsmmupa.my.id)

---

## ✨ Fitur Utama

### 👨‍🎓 Portal Siswa (`index.html`)
* **Cek Rekap Laporan Real-Time:** Siswa dapat memantau status ketuntasan laporan per rombel (`XI SA`, `XI SB`, `XI SC`) dengan indikator warna otomatis (*Lengkap*, *Kurang 1–4 Job*).
* **Rincian Nilai Individu:** Klik nama siswa untuk melihat status detail tiap job beserta nilai dan ambang batas KKM (`75`).
* **Pratinjau Jobsheet & Modul PDF:** Pembacaan langsung Jobsheet (Job 1–4) dan Modul Materi kelistrikan melalui *modal viewer* terintegrasi Google Drive tanpa perlu mengunduh file secara terpisah.
* **Desain Responsif:** Tampilan modern yang nyaman diakses melalui ponsel maupun komputer.

### 🛡️ Dashboard Admin (`admin.html`)
* **Autentikasi & Keamanan Berlapis:** Login terverifikasi server dengan sistem token sesi (`SECRET_KEY`) untuk mencegah perubahan data nilai tanpa otorisasi.
* **Statistik Akademik & Pengunjung:** Ringkasan ketuntasan keseluruhan, progres per kelas, grafik halaman/materi paling sering diakses, serta log 15 aktivitas pengunjung terakhir.
* **Input & Edit Nilai Fleksibel:**
  * Input nilai per siswa dengan *auto-complete* nama.
  * Edit nilai secara cepat via **Modal Mobile-Friendly** maupun **Inline Table Edit** langsung di tabel rekap.
  * Pemisahan otomatis antara data **Nilai Laporan PKSM** (tampil di siswa) dan **Nilai Praktek Bengkel** (`PRAKTEK_XI SA/SB/SC`, khusus arsip admin).
* **Export & Cetak:** Unduh rekap nilai ke format Excel (`.csv`) atau cetak langsung ke PDF.

---

## 📁 Struktur Proyek

```text
portal-pksm/
├── CNAME                  # Konfigurasi domain kustom GitHub Pages
├── README.md              # Dokumentasi proyek
├── index.html             # Halaman utama Portal Siswa
├── admin.html             # Halaman Dashboard & Manajemen Admin
└── assets/
    ├── css/
    │   ├── portal.css     # Stylesheet khusus Portal Siswa
    │   └── admin.css      # Stylesheet khusus Dashboard Admin
    └── js/
        ├── config.js      # Pusat konfigurasi URL API, KKM, daftar jobsheet & materi
        ├── portal.js      # Logika rekap siswa, filter, modal detail & pelacakan aktivitas
        └── admin.js       # Logika autentikasi, statistik dashboard, CRUD nilai & export
```

---

## 🛠️ Teknologi yang Digunakan

* **Frontend:** HTML5, CSS3, Bootstrap 5.3, Font Awesome 6, Google Fonts (*Plus Jakarta Sans*)
* **Backend & Database:** Google Apps Script (`doGet` JSONP/JSON API) & Google Sheets
* **Hosting:** GitHub Pages dengan Custom Domain

---

## ⚙️ Konfigurasi Singkat

Seluruh pengaturan utama berada di dalam file `assets/js/config.js`:
* `API_URL`: Endpoint Google Apps Script utama untuk pembacaan nilai, pembaruan skor, dan pencatatan log pengunjung (`LOG_VISITOR`).
* `AUTH_URL`: Endpoint Google Apps Script khusus verifikasi login operator/admin.
* `KKM`: Standar ketuntasan minimal praktik (default: `75`).
* `DAFTAR_JOBSHEET` & `DAFTAR_MATERI`: Daftar tautan Google Drive untuk pratinjau dokumen PDF.

---

## 👨‍💻 Pengembang

Dikembangkan oleh **Sigit Prabowo**  
Kompetensi Keahlian **Teknik Sepeda Motor (TSM) — SMK Muhammadiyah Pakem**