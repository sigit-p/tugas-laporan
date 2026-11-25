const API_URL = APP_CONFIG.API_URL;
const DAFTAR_JOBSHEET = APP_CONFIG.DAFTAR_JOBSHEET;
const DAFTAR_MATERI = APP_CONFIG.DAFTAR_MATERI;
const KKM = APP_CONFIG.KKM;

let kelasAktif = "",
  dataSiswa = [],
  timerLoad = null;
let tempNames = null,
  tempTable = null;

/* ======================================================
   PENCATAT AKTIVITAS & KETERANGAN PENGUNJUNG SISWA
====================================================== */
function kirimLogSiswa(namaHalaman, keterangan, isInitialVisit = false) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? "HP / Mobile"
    : "Laptop / PC";
  const aksi =
    isInitialVisit && sessionStorage.getItem("pksm_siswa_visited")
      ? "get_stats"
      : "visit";

  const cbName =
    "cbLogSiswa_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
  window[cbName] = function (res) {
    if (isInitialVisit && res && res.status === "success") {
      sessionStorage.setItem("pksm_siswa_visited", "1");
      const el = document.getElementById("footerVisitorBadge");
      if (el) {
        el.innerHTML = `<i class="fas fa-eye text-primary me-1"></i> ${Number(res.total || 0).toLocaleString("id-ID")} Kunjungan (${res.hari_ini || 0} Hari Ini)`;
      }
    }
    delete window[cbName];
    const oldScript = document.getElementById(cbName);
    if (oldScript) oldScript.remove();
  };

  const s = document.createElement("script");
  s.id = cbName;
  s.src = `${API_URL}?action=${aksi}&page=${encodeURIComponent(namaHalaman)}&device=${encodeURIComponent(isMobile)}&info=${encodeURIComponent(keterangan)}&callback=${cbName}&t=${Date.now()}`;
  document.head.appendChild(s);
}

function toDriveEmbedUrl(url) {
  if (!url || url === "#") return "";
  const match =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return url;
}

function bukaEmbedDokumen(judul, rawUrl) {
  const embedUrl = toDriveEmbedUrl(rawUrl);
  if (!embedUrl) {
    alert('Link Google Drive untuk dokumen "' + judul + '" belum diisi.');
    return;
  }
  kirimLogSiswa(judul, "Membaca pratinjau dokumen PDF");
  document.getElementById("viewerDocTitle").innerHTML =
    `<i class="fas fa-file-pdf text-warning me-2"></i>${judul}`;
  document.getElementById("iframeDocViewer").src = embedUrl;
  new bootstrap.Modal(document.getElementById("modalDocViewer")).show();
}

function tutupViewer() {
  document.getElementById("iframeDocViewer").src = "";
}

document
  .getElementById("modalDocViewer")
  .addEventListener("hidden.bs.modal", tutupViewer);

document.getElementById("containerJobsheet").innerHTML = DAFTAR_JOBSHEET.map(
  (j, idx) => `
  <div class="col-md-6 col-lg-3">
    <div class="card job-card h-100 shadow-sm">
      <div class="card-body d-flex flex-column p-3">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1 rounded-pill">Job ${j.no}</span>
          <i class="fas fa-file-pdf text-danger opacity-75"></i>
        </div>
        <h6 class="fw-bold text-dark mb-2">${j.judul}</h6>
        <p class="small text-muted mb-3 flex-grow-1">${j.ket}</p>
        <button type="button" onclick="bukaEmbedDokumen('Jobsheet ${j.no}: ${j.judul}', DAFTAR_JOBSHEET[${idx}].pdf)" class="btn btn-sm btn-outline-primary rounded-3 fw-semibold mt-auto w-100 py-2">
          <i class="fas fa-eye me-1"></i> Lihat Jobsheet ${j.no}
        </button>
      </div>
    </div>
  </div>
`,
).join("");

document.getElementById("containerMateri").innerHTML = DAFTAR_MATERI.map(
  (m, idx) => `
  <button type="button" onclick="bukaEmbedDokumen(DAFTAR_MATERI[${idx}].judul, DAFTAR_MATERI[${idx}].pdf)" class="list-group-item list-group-item-action materi-item d-flex justify-content-between align-items-center gap-3 text-start">
    <div class="d-flex align-items-center gap-3">
      <span class="materi-icon-box"><i class="fas fa-book"></i></span>
      <div>
        <div class="fw-bold text-dark">${m.judul}</div>
        <small class="text-muted">${m.ket}</small>
      </div>
    </div>
    <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-2 fw-semibold flex-shrink-0">
      <i class="fas fa-eye me-1"></i> Baca di Sini
    </span>
  </button>
`,
).join("");

function bukaKelas(kelas) {
  kelasAktif = kelas;
  kirimLogSiswa(
    `Rekap Kelas ${kelas}`,
    `Membuka daftar rekap laporan siswa kelas ${kelas}`,
  );
  document.getElementById("judulKelasAktif").textContent =
    "Rekap Laporan Kelas " + kelas;
  document.getElementById("inputCariNama").value = "";
  document.getElementById("filterStatusSiswa").value = "all";
  document.getElementById("viewBeranda").classList.add("d-none");
  document.getElementById("viewRekapKelas").classList.remove("d-none");
  window.scrollTo(0, 0);
  muatUlangKelas();
}

function muatUlangKelas() {
  let detik = 0;
  tempNames = null;
  tempTable = null;

  document.getElementById("tbodySiswa").innerHTML =
    `<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border text-primary mb-2"></div><div class="fw-bold text-dark">Memuat ${kelasAktif}... (<span id="detikLoad">0</span>s)</div></td></tr>`;
  clearInterval(timerLoad);
  timerLoad = setInterval(() => {
    detik++;
    const el = document.getElementById("detikLoad");
    if (el) el.textContent = detik;
  }, 1000);

  ["gasNames", "gasTable"].forEach((id) => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });

  const s1 = document.createElement("script");
  s1.id = "gasNames";
  s1.src = `${API_URL}?sheet=${encodeURIComponent(kelasAktif)}&callback=terimaNama&t=${Date.now()}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.id = "gasTable";
  s2.src = `${API_URL}?action=read&sheet=${encodeURIComponent(kelasAktif)}&callback=terimaNilai&t=${Date.now()}`;
  document.head.appendChild(s2);
}

window.terimaNama = function (names) {
  tempNames = Array.isArray(names) ? names : [];
  gabungkanData();
};

window.terimaNilai = function (table) {
  tempTable = Array.isArray(table) ? table : [];
  gabungkanData();
};

function gabungkanData() {
  if (tempNames === null || tempTable === null) return;
  clearInterval(timerLoad);

  if (tempTable.length < 2) {
    dataSiswa = [];
    renderTabel([]);
    return;
  }

  const headers = tempTable[0].map((h) => String(h || "").trim());
  const rows = tempTable.slice(1);

  const idxAkhir = headers.findIndex((h) =>
    /nilai\s*akhir|akhir|\bna\b/i.test(h),
  );
  const jobCols = [];
  headers.forEach((h, i) => {
    if (i > 0 && i !== idxAkhir && h !== "") jobCols.push({ i, judul: h });
  });

  dataSiswa = tempNames
    .map((namaRaw, idx) => {
      const nama = String(
        Array.isArray(namaRaw) ? namaRaw[0] : namaRaw || "",
      ).trim();
      const r = rows[idx] || [];

      let na = "-";
      if (idxAkhir >= 0 && r[idxAkhir] !== "" && r[idxAkhir] != null) {
        const n = parseFloat(r[idxAkhir]);
        na = !isNaN(n) ? Number(n.toFixed(1)) : r[idxAkhir];
      }

      const jobs = jobCols.map((c) => {
        const raw = String(r[c.i] ?? "").trim();
        const num = parseFloat(raw);
        let status = "Belum";
        if (raw !== "" && !isNaN(num) && num > 0) {
          status = num >= KKM ? "Tuntas" : "Perlu Perbaikan";
        }
        return { judul: c.judul, nilai: raw === "" ? "0" : raw, status };
      });

      return {
        nama,
        na,
        jobs,
        kurang: jobs.filter((j) => j.status !== "Tuntas").length,
      };
    })
    .filter((s) => s.nama !== "");

  terapkanFilterSiswa();
}

function terapkanFilterSiswa() {
  const q = document.getElementById("inputCariNama").value.toLowerCase().trim();
  const st = document.getElementById("filterStatusSiswa").value;

  const filtered = dataSiswa.filter((s) => {
    if (!s.nama.toLowerCase().includes(q)) return false;
    if (st === "all") return true;
    if (st === "4") return s.kurang >= 4;
    return String(s.kurang) === st;
  });

  renderTabel(filtered);
}

function getBadgeStatusSiswa(s) {
  const totalJob = s.jobs.length;
  if (s.kurang === 0) {
    return `<span class="pill-status pill-ok"><i class="fas fa-check-circle"></i> Lengkap (${totalJob}/${totalJob})</span>`;
  }
  if (s.kurang === 1) {
    return `<span class="pill-status pill-kurang-1"><i class="fas fa-clock"></i> Kurang 1 Job</span>`;
  }
  if (s.kurang === 2) {
    return `<span class="pill-status pill-kurang-2"><i class="fas fa-exclamation-circle"></i> Kurang 2 Job</span>`;
  }
  if (s.kurang === 3) {
    return `<span class="pill-status pill-kurang-3"><i class="fas fa-exclamation-triangle"></i> Kurang 3 Job</span>`;
  }
  return `<span class="pill-status pill-kurang-4"><i class="fas fa-times-circle"></i> Kurang ${s.kurang} Job</span>`;
}

function renderTabel(list) {
  document.getElementById("infoJumlahSiswa").textContent =
    `Menampilkan ${list.length} siswa`;
  if (!list.length) {
    document.getElementById("tbodySiswa").innerHTML =
      `<tr><td colspan="5" class="text-center text-muted py-4">Data siswa tidak ditemukan.</td></tr>`;
    return;
  }
  document.getElementById("tbodySiswa").innerHTML = list
    .map((s, idx) => {
      const badge = getBadgeStatusSiswa(s);
      const asli = dataSiswa.indexOf(s);
      const naNum = parseFloat(s.na);
      const naClass = isNaN(naNum)
        ? "text-dark"
        : naNum >= KKM
          ? "text-success"
          : "text-danger";
      return `<tr class="row-siswa" onclick="detailSiswa(${asli})">
      <td class="text-center text-muted fw-medium">${idx + 1}</td>
      <td class="fw-semibold text-dark">${s.nama}</td>
      <td class="text-center">${badge}</td>
      <td class="text-center fw-bold ${naClass}">${s.na}</td>
      <td class="text-center"><button type="button" class="btn btn-sm btn-outline-primary rounded-3 px-2 fw-semibold">Detail</button></td></tr>`;
    })
    .join("");
}

function detailSiswa(idx) {
  const s = dataSiswa[idx];
  if (!s) return;
  kirimLogSiswa(`Cek Detail (${kelasAktif})`, `Mengecek rincian laporan: ${s.nama}`);
  document.getElementById("modalNamaSiswa").textContent = s.nama;
  document.getElementById("modalInfoKelas").textContent = `Kelas ${kelasAktif} • Nilai Akhir: ${s.na}`;

  document.getElementById("modalIsiLaporan").innerHTML = `<div class="list-group rounded-3 overflow-hidden">` + s.jobs.map((j, jobIdx) => {
    // Cari kecocokan jobsheet berdasarkan judul atau urutan indeks
    const matchedJob = DAFTAR_JOBSHEET.find(dj =>
      j.judul.toLowerCase().includes(dj.judul.toLowerCase()) ||
      dj.judul.toLowerCase().includes(j.judul.toLowerCase())
    ) || DAFTAR_JOBSHEET[jobIdx];

    const btnJobsheet = matchedJob
      ? `<button type="button" onclick="bukaJobsheetDariDetail(${matchedJob.no - 1})" class="btn btn-sm btn-outline-dark rounded-3 px-2 py-1 fw-semibold flex-shrink-0"><i class="fas fa-file-pdf text-danger me-1"></i>Lihat Jobsheet ${matchedJob.no}</button>`
      : "";

    if (j.status === "Tuntas") {
      return `<div class="list-group-item p-3"><div class="d-flex justify-content-between align-items-center mb-1"><strong class="text-dark">${j.judul}</strong><span class="badge bg-success-subtle text-success rounded-pill px-3 py-1">Tuntas (${j.nilai})</span></div><small class="text-muted">Laporan sudah dikumpulkan dan tuntas.</small></div>`;
    }
    if (j.status === "Perlu Perbaikan") {
      return `<div class="list-group-item list-group-item-warning p-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong>${j.judul}</strong>
          <span class="badge bg-warning text-dark rounded-pill px-3 py-1">Di Bawah KKM (${j.nilai})</span>
        </div>
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
          <small>Nilai di bawah ${KKM}, silakan konfirmasi perbaikan.</small>
          ${btnJobsheet}
        </div>
      </div>`;
    }
    return `<div class="list-group-item list-group-item-danger p-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong>${j.judul}</strong>
        <span class="badge bg-danger rounded-pill px-3 py-1">Belum Mengumpulkan</span>
      </div>
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
        <small class="text-danger">Laporan & nilai praktik belum masuk.</small>
        ${btnJobsheet}
      </div>
    </div>`;
  }).join("") + `</div>`;

  new bootstrap.Modal(document.getElementById("modalDetailSiswa")).show();
}

function bukaJobsheetDariDetail(jobIdx) {
  const job = DAFTAR_JOBSHEET[jobIdx];
  if (!job) return;

  const modalDetail = bootstrap.Modal.getInstance(document.getElementById("modalDetailSiswa"));
  if (modalDetail) modalDetail.hide();

  setTimeout(() => {
    bukaEmbedDokumen(`Jobsheet ${job.no}: ${job.judul}`, job.pdf);
  }, 200);
}

function kembaliKeBeranda(e) {
  if (e) e.preventDefault();
  document.getElementById("viewRekapKelas").classList.add("d-none");
  document.getElementById("viewBeranda").classList.remove("d-none");
  window.scrollTo(0, 0);
}

function bukaPanduanDariModal() {
  const m = bootstrap.Modal.getInstance(document.getElementById("modalDetailSiswa"));
  if (m) m.hide();

  // Tampilkan beranda tanpa memaksa scroll ke paling atas
  document.getElementById("viewRekapKelas").classList.add("d-none");
  document.getElementById("viewBeranda").classList.remove("d-none");

  // Langsung gulir mulus menuju bagian Daftar Job Praktek & Jobsheet
  setTimeout(() => {
    const target = document.getElementById("sectionJobsheet");
    if (target) {
      const yOffset = -80; // Memberi jarak agar judul tidak tertutup navbar atas
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, 150);
}

/* ======================================================
   BANNER PENGUMUMAN DINAMIS DARI ADMIN
====================================================== */
function muatPengumumanSiswa() {
  const container = document.getElementById("bannerPengumumanSiswa");
  if (!container) return;

  const cbName = "cbInfoSiswa_" + Date.now();
  window[cbName] = function (res) {
    delete window[cbName];
    const el = document.getElementById(cbName);
    if (el) el.remove();

    if (!res || res.status !== "success" || !res.data || !res.data.aktif) {
      container.classList.add("d-none");
      return;
    }

    const d = res.data;
const tipeMap = {
      warning: {
        bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        accentBar: "#f59e0b",
        iconBg: "bg-warning text-dark",
        badgeBg: "bg-white text-warning-emphasis border border-warning-subtle",
        label: "INFO TENGGAT TUGAS",
        icon: "fa-bullhorn"
      },
      info: {
        bgGradient: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
        accentBar: "#2563eb",
        iconBg: "bg-primary text-white",
        badgeBg: "bg-white text-primary border border-primary-subtle",
        label: "PENGUMUMAN",
        icon: "fa-info-circle"
      },
      danger: {
        bgGradient: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
        accentBar: "#dc2626",
        iconBg: "bg-danger text-white",
        badgeBg: "bg-white text-danger border border-danger-subtle",
        label: "PENGUMUMAN PENTING",
        icon: "fa-exclamation-circle"
      },
      success: {
        bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
        accentBar: "#16a34a",
        iconBg: "bg-success text-white",
        badgeBg: "bg-white text-success border border-success-subtle",
        label: "INFO PRAKTIK",
        icon: "fa-calendar-check"
      }
    };
    const style = tipeMap[d.tipe] || tipeMap.warning;

    container.innerHTML = `
      <div class="modern-card p-3 p-md-4 position-relative overflow-hidden" style="background: ${style.bgGradient};">
        <div class="d-flex align-items-start gap-3">
          <!-- Bilah aksen vertikal melengkung di dalam kartu -->
          <div class="rounded-pill flex-shrink-0 d-none d-sm-block" style="width: 5px; align-self: stretch; background-color: ${style.accentBar};"></div>

          <!-- Kotak Ikon Solid Berbayang -->
          <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm ${style.iconBg}" style="width: 48px; height: 48px; font-size: 1.2rem;">
            <i class="fas ${style.icon}"></i>
          </div>

          <!-- Konten Pengumuman -->
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
              <span class="badge ${style.badgeBg} rounded-pill px-2 py-1 fw-bold d-inline-flex align-items-center gap-2" style="font-size: 0.7rem; letter-spacing: 0.3px;">
                <span class="pulse-dot"></span> ${style.label}
              </span>
              ${d.waktu ? `<span class="badge bg-white text-muted border fw-normal" style="font-size: 0.72rem;"><i class="far fa-clock me-1"></i>${d.waktu}</span>` : ""}
            </div>
            <h6 class="fw-bold text-dark mt-1 mb-1" style="font-size: 1.02rem;">${d.judul}</h6>
            <p class="text-dark opacity-75 small mb-0" style="line-height: 1.6; white-space: pre-line;">${d.isi}</p>
          </div>
        </div>
      </div>
    `;
    container.classList.remove("d-none");
  };

  const s = document.createElement("script");
  s.id = cbName;
  s.src = `${APP_CONFIG.API_URL}?action=get_info&callback=${cbName}&t=${Date.now()}`;
  document.head.appendChild(s);
}

// Jalankan otomatis saat portal siswa dibuka
muatPengumumanSiswa();

// Catat kunjungan awal saat halaman portal siswa dibuka
kirimLogSiswa("Portal Siswa", "Membuka halaman beranda portal siswa", true);
