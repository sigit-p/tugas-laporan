const SCRIPT_URL = APP_CONFIG.API_URL;
const AUTH_URL = APP_CONFIG.AUTH_URL;
const KKM = APP_CONFIG.KKM;

let currentMapel = "";
let editModeMapel = "";
let dataGabungan = [];
let daftarHeaderJob = [];
let tempNames = null;
let tempTable = null;
let activeModalSiswaId = null;
let activeModalScores = [];
let modalEditInstance = null;
let activeBatchJobIdx = null;

if (sessionStorage.getItem("admin_tsm_logged_in") === "true") {
  document.getElementById("loginWrapper").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  muatStatistikDashboard();
}

function toggleSidebar() {
  if (window.innerWidth <= 768) {
    document.body.classList.toggle("sidebar-mobile-open");
  } else {
    document.body.classList.toggle("sidebar-collapsed");
  }
}

function tutupSidebarMobile() {
  document.body.classList.remove("sidebar-mobile-open");
}

function getNamaSheet(kelas, mode) {
  if (mode === "PRAKTEK") return `PRAKTEK_${kelas}`;
  return kelas;
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const u = document.getElementById("user").value.trim();
  const p = document.getElementById("pass").value.trim();
  const btn = document.getElementById("btnLogin");

  if (!u || !p) return alert("Username dan Password harus diisi!");

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Memverifikasi...`;

  try {
    const resp = await fetch(`${AUTH_URL}?user=${encodeURIComponent(u)}&pass=${encodeURIComponent(p)}`);
    const hasil = await resp.json();

    if (hasil.status === "success") {
      sessionStorage.setItem("admin_tsm_logged_in", "true");
      sessionStorage.setItem("admin_tsm_token", hasil.token || "");
      document.getElementById("loginWrapper").style.display = "none";
      document.getElementById("adminPanel").style.display = "block";
      muatStatistikDashboard();
    } else {
      alert("Gagal: " + hasil.message);
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  } catch (err) {
    alert("Terjadi kesalahan koneksi ke server login.");
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function handleLogout() {
  sessionStorage.removeItem("admin_tsm_logged_in");
  sessionStorage.removeItem("admin_tsm_token");
  location.reload();
}

document.getElementById("togglePassword").addEventListener("click", function () {
  const passwordField = document.getElementById("pass");
  const eyeIcon = document.getElementById("eyeIcon");
  const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
  passwordField.setAttribute("type", type);
  eyeIcon.classList.toggle("fa-eye");
  eyeIcon.classList.toggle("fa-eye-slash");
});

/* ======================================================
   NAVIGASI MENU DASHBOARD & STATISTIK NILAI + PENGUNJUNG
====================================================== */
function tampilkanDashboard(el) {
  tutupSidebarMobile();
  document.getElementById("dashboardView").style.display = "block";
  document.getElementById("formKonten").style.display = "none";
  document.getElementById("tabelKonten").style.display = "none";
  document.getElementById("nav-status").innerText = "Dashboard Admin";

  document.querySelectorAll(".list-group-item").forEach((i) => i.classList.remove("active-menu"));
  if (el) el.classList.add("active-menu");

  muatStatistikDashboard();
}

function bukaKelasLangsung(mode, kelas) {
  const menuEl =
    mode === "PRAKTEK"
      ? document.getElementById("menuTabelPraktek")
      : document.getElementById("menuTabelPKSM");
  document.getElementById("kelasTabel").value = kelas;
  pilihModeEdit(mode, menuEl);
}

function bacaSheetJsonp(sheetName) {
  return new Promise((resolve) => {
    const cbName =
      "cbDash_" +
      sheetName.replace(/\s+/g, "_") +
      "_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 1000);
    const timer = setTimeout(() => {
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
      resolve([]);
    }, 9000);

    window[cbName] = function (data) {
      clearTimeout(timer);
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
      resolve(Array.isArray(data) ? data : []);
    };

    const s = document.createElement("script");
    s.id = cbName;
    s.src = `${SCRIPT_URL}?action=read&sheet=${encodeURIComponent(sheetName)}&callback=${cbName}&t=${Date.now()}`;
    s.onerror = () => {
      clearTimeout(timer);
      delete window[cbName];
      s.remove();
      resolve([]);
    };
    document.head.appendChild(s);
  });
}

function hitungMetrikKumpulanKelas(daftarKelas, hasilTabelKelas, mode) {
  let totalSiswa = 0;
  let totalTuntas = 0;
  let sumNilai = 0;
  let countNilai = 0;
  let sheetSiap = 0;

  const htmlList = daftarKelas
    .map((kelas, idx) => {
      const table = hasilTabelKelas[idx];
      if (!table || table.length < 2) {
        return `
          <div class="p-3 rounded-3 border bg-light d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-bold text-dark">${kelas}</div>
              <small class="text-muted">${mode === "PRAKTEK" ? `Tab PRAKTEK_${kelas} belum dibuat / kosong` : "Belum ada data terbaca"}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary rounded-3" onclick="bukaKelasLangsung('${mode}', '${kelas}')">Buka</button>
          </div>
        `;
      }

      sheetSiap++;
      const headers = table[0].map((h) => String(h || "").trim());
      const rows = table.slice(1).filter((r) => String(r[0] || "").trim() !== "");
      const idxAkhir = headers.findIndex((h) => /nilai\s*akhir|akhir|\bna\b/i.test(h));
      const jobIndices = [];
      headers.forEach((h, i) => {
        if (i > 0 && i !== idxAkhir && h !== "") jobIndices.push(i);
      });

      let tuntasKelas = 0;
      rows.forEach((r) => {
        const scores = jobIndices.map((ci) => {
          const num = parseFloat(String(r[ci] ?? "").trim());
          return isNaN(num) ? 0 : num;
        });
        scores.forEach((v) => {
          sumNilai += v;
          countNilai++;
        });
        if (scores.length > 0 && scores.every((v) => v >= KKM)) {
          tuntasKelas++;
        }
      });

      const totalKelas = rows.length;
      const persen = totalKelas > 0 ? Math.round((tuntasKelas / totalKelas) * 100) : 0;
      totalSiswa += totalKelas;
      totalTuntas += tuntasKelas;

      const barColor =
        persen >= 80
          ? "bg-success"
          : persen >= 50
            ? mode === "PRAKTEK"
              ? "bg-info"
              : "bg-primary"
            : "bg-warning";

      return `
        <div class="p-3 rounded-3 border bg-white">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span class="fw-bold text-dark me-2">${kelas}</span>
              <span class="badge bg-light text-secondary border">${tuntasKelas}/${totalKelas} Tuntas</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold small ${persen >= KKM ? "text-success" : "text-primary"}">${persen}%</span>
              <button type="button" class="btn btn-sm btn-light border py-0 px-2" onclick="bukaKelasLangsung('${mode}', '${kelas}')" title="Lihat Detail ${kelas}">
                <i class="fas fa-arrow-right small"></i>
              </button>
            </div>
          </div>
          <div class="progress" style="height: 8px; border-radius: 6px;">
            <div class="progress-bar ${barColor}" role="progressbar" style="width: ${persen}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");

  return {
    totalSiswa,
    totalTuntas,
    totalBelum: totalSiswa - totalTuntas,
    rataRata: countNilai > 0 ? (sumNilai / countNilai).toFixed(1) : "0.0",
    sheetSiap,
    htmlList,
  };
}

async function muatStatistikDashboard() {
  muatStatistikPengunjung();

  const daftarKelas = APP_CONFIG.DAFTAR_KELAS;
  const [hasilLaporan, hasilPraktek] = await Promise.all([
    Promise.all(daftarKelas.map((k) => bacaSheetJsonp(k))),
    Promise.all(daftarKelas.map((k) => bacaSheetJsonp(`PRAKTEK_${k}`))),
  ]);

  const metrikLaporan = hitungMetrikKumpulanKelas(daftarKelas, hasilLaporan, "PKSM");
  const metrikPraktek = hitungMetrikKumpulanKelas(daftarKelas, hasilPraktek, "PRAKTEK");

  document.getElementById("dashTotalSiswa").innerText = metrikLaporan.totalSiswa || metrikPraktek.totalSiswa;
  document.getElementById("dashTuntasLaporan").innerText = `${metrikLaporan.totalTuntas} / ${metrikLaporan.totalSiswa}`;
  document.getElementById("dashRataLaporan").innerText = metrikLaporan.rataRata;
  document.getElementById("dashBelumLaporan").innerText = metrikLaporan.totalBelum;

  document.getElementById("dashTuntasPraktek").innerText =
    metrikPraktek.sheetSiap > 0 ? `${metrikPraktek.totalTuntas} / ${metrikPraktek.totalSiswa}` : "-";
  document.getElementById("dashRataPraktek").innerText = metrikPraktek.sheetSiap > 0 ? metrikPraktek.rataRata : "-";
  document.getElementById("dashBelumPraktek").innerText = metrikPraktek.sheetSiap > 0 ? metrikPraktek.totalBelum : "-";

  document.getElementById("dashProgresKelasContainer").innerHTML = metrikLaporan.htmlList;
  document.getElementById("dashProgresPraktekContainer").innerHTML = metrikPraktek.htmlList;

  const statusPraktekEl = document.getElementById("dashStatusPraktek");
  if (metrikPraktek.sheetSiap > 0) {
    statusPraktekEl.className = "badge bg-success-subtle text-success";
    statusPraktekEl.innerText = `${metrikPraktek.sheetSiap}/3 Sheet Aktif`;
  } else {
    statusPraktekEl.className = "badge bg-warning-subtle text-warning-emphasis";
    statusPraktekEl.innerText = "Belum Ada Sheet";
  }

  const now = new Date();
  document.getElementById("dashLastUpdate").innerText =
    `Terakhir diperbarui: ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}

function muatStatistikPengunjung() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "HP / Mobile" : "Laptop / PC";
  const sudahTercatat = sessionStorage.getItem("pksm_admin_visited");
  const aksi = sudahTercatat ? "get_stats" : "visit";
  const badgeEl = document.getElementById("badgeStatusVisitor");
  if (badgeEl) badgeEl.innerText = "Menyinkronkan...";

  window.onVisitorAdminResp = function (res) {
    if (!res || res.status !== "success") {
      if (badgeEl) badgeEl.innerText = "Gagal Memuat";
      return;
    }
    sessionStorage.setItem("pksm_admin_visited", "1");
    if (badgeEl) badgeEl.innerText = "Real-Time Log";

    document.getElementById("visHariIni").innerText = res.hari_ini ?? 0;
    document.getElementById("visTotal").innerText = res.total ?? 0;
    document.getElementById("visSiswa").innerText = res.siswa ?? 0;
    document.getElementById("visAdmin").innerText = res.admin ?? 0;

    const topContainer = document.getElementById("listTopPages");
    if (res.top_pages && res.top_pages.length > 0) {
      topContainer.innerHTML = res.top_pages
        .map(
          (item) => `
            <div class="d-flex justify-content-between align-items-center p-2 rounded-2 bg-light border">
              <span class="fw-semibold text-dark text-truncate me-2" title="${item.halaman}">${item.halaman}</span>
              <span class="badge bg-primary rounded-pill">${item.jumlah}x</span>
            </div>
          `
        )
        .join("");
    } else {
      topContainer.innerHTML = `<div class="text-muted">Belum ada catatan halaman.</div>`;
    }

    const tbodyLog = document.getElementById("tbodyRecentLogs");
    if (res.recent_logs && res.recent_logs.length > 0) {
      tbodyLog.innerHTML = res.recent_logs
        .map((log) => {
          const isAdm = String(log.halaman || "").toLowerCase().includes("admin");
          const badgeCls = isAdm ? "bg-warning-subtle text-warning-emphasis" : "bg-success-subtle text-success";
          const ketHtml =
            log.ket && log.ket !== "-"
              ? `<div class="text-muted mt-1" style="font-size: 0.72rem;">${log.ket}</div>`
              : "";
          return `
            <tr>
              <td class="text-muted text-nowrap">${log.waktu}</td>
              <td>
                <span class="badge ${badgeCls} fw-semibold">${log.halaman}</span>
                ${ketHtml}
              </td>
              <td class="text-muted text-nowrap">${log.perangkat}</td>
            </tr>
          `;
        })
        .join("");
    } else {
      tbodyLog.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Belum ada riwayat aktivitas.</td></tr>`;
    }
  };

  const old = document.getElementById("scriptVisitorAdmin");
  if (old) old.remove();

  const s = document.createElement("script");
  s.id = "scriptVisitorAdmin";
  s.src = `${SCRIPT_URL}?action=${aksi}&page=Dashboard%20Admin&device=${encodeURIComponent(isMobile)}&info=${encodeURIComponent("Membuka & memantau dashboard admin")}&callback=onVisitorAdminResp&t=${Date.now()}`;
  document.head.appendChild(s);
}

/* ======================================================
   BAGIAN INPUT NILAI (LAPORAN PKSM & PRAKTEK ADMIN)
====================================================== */
function pilihMapel(m, el) {
  currentMapel = m;
  tutupSidebarMobile();
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("tabelKonten").style.display = "none";
  document.getElementById("formKonten").style.display = "block";

  const isPraktek = m === "PRAKTEK";
  document.getElementById("judulForm").innerHTML = isPraktek
    ? `<i class="fas fa-tools text-success me-2"></i>Input Nilai Praktek (Admin Only)`
    : `<i class="fas fa-edit text-primary me-2"></i>Input Nilai Laporan (PKSM)`;
  document.getElementById("nav-status").innerText = isPraktek ? `Input Nilai / Praktek` : `Input Nilai / Laporan PKSM`;

  const infoBox = document.getElementById("infoSheetPraktek");
  if (infoBox) infoBox.classList.toggle("d-none", !isPraktek);

  document.querySelectorAll(".list-group-item").forEach((i) => i.classList.remove("active-menu"));
  if (el) el.classList.add("active-menu");

  updateJobSelect("job_index", m);
  loadStudentNames();
}

function updateJobSelect(id, m) {
  const js = document.getElementById(id);
  const daftar = APP_CONFIG.DAFTAR_JOB_ADMIN[m] || [];
  js.innerHTML = '<option value="">-- Pilih Job / Materi Praktik --</option>';
  daftar.forEach((item, i) => (js.innerHTML += `<option value="${i + 1}">Job ${i + 1} - ${item}</option>`));
}

function loadStudentNames() {
  const k = document.getElementById("kelas").value;
  if (!k) return;
  fetch(`${SCRIPT_URL}?sheet=${encodeURIComponent(k)}`)
    .then((r) => r.json())
    .then((d) => {
      const dl = document.getElementById("listSiswa");
      dl.innerHTML = "";
      d.forEach((item) => {
        const nama = Array.isArray(item) ? item[0] : item;
        if (nama) dl.innerHTML += `<option value="${String(nama).trim()}">`;
      });
    });
}

function simpanNilai() {
  const btn = document.getElementById("btnSimpan");
  const k = document.getElementById("kelas").value;
  const n = document.getElementById("nama").value;
  const j = document.getElementById("job_index").value;
  const ni = document.getElementById("nilai").value;
  if (!k || !n || !j || !ni) return alert("Mohon lengkapi semua data!");

  const targetSheet = getNamaSheet(k, currentMapel);
  btn.disabled = true;
  btn.innerText = "Mengirim...";
  sendUpdate(targetSheet, n, j, ni, "handleUpdateResponse");
}

function sendUpdate(sheetTarget, n, j, ni, cb) {
  const token = sessionStorage.getItem("admin_tsm_token") || "";
  const url = `${SCRIPT_URL}?action=update&sheet=${encodeURIComponent(sheetTarget)}&nama=${encodeURIComponent(n)}&job_index=${j}&nilai=${ni}&key=${encodeURIComponent(token)}&callback=${cb}`;
  const s = document.createElement("script");
  s.src = url;
  document.head.appendChild(s);
}

window.handleUpdateResponse = function (r) {
  document.getElementById("btnSimpan").disabled = false;
  document.getElementById("btnSimpan").innerHTML = `<i class="fas fa-save me-2"></i> Simpan Nilai ke Google Sheet`;
  if (r && r.status === "success") {
    alert("✅ Nilai berhasil disimpan!");
    document.getElementById("nilai").value = "";
  } else {
    alert("⚠️ Gagal menyimpan: " + (r?.message || "Pastikan tab sheet sudah dibuat di Google Spreadsheet."));
  }
};

/* ======================================================
   BAGIAN TABEL REKAP, EXPORT EXCEL/PDF & EDIT NILAI
====================================================== */
function exportRekapCSV() {
  if (!dataGabungan || dataGabungan.length === 0) {
    return alert("Tidak ada data siswa untuk di-export!");
  }

  const kelas = document.getElementById("kelasTabel").value;
  const jenisLabel = editModeMapel === "PRAKTEK" ? "Nilai_Praktek" : "Nilai_Laporan_PKSM";

  const headers = ["No", "Nama Siswa", ...daftarHeaderJob, "Nilai Akhir (NA)", `Status KKM (${KKM})`];
  const rows = dataGabungan.map((s, idx) => {
    const tuntas = s.scores.length > 0 && s.scores.every((v) => v >= KKM) ? "TUNTAS" : "BELUM TUNTAS";
    const namaAman = `"${s.nama.replace(/"/g, '""')}"`;
    return [idx + 1, namaAman, ...s.scores, s.na, tuntas].join(";");
  });

  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const tgl = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `Rekap_${jenisLabel}_${kelas.replace(/\s+/g, "_")}_${tgl}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function cetakRekapPDF() {
  if (!dataGabungan || dataGabungan.length === 0) {
    return alert("Tidak ada data siswa untuk dicetak!");
  }
  const kelas = document.getElementById("kelasTabel").value;
  const jenisLabel = editModeMapel === "PRAKTEK" ? "REKAP NILAI PRAKTEK BENGKEL" : "REKAP NILAI LAPORAN PKSM";
  document.getElementById("printJudulDokumen").innerText = `${jenisLabel} - KELAS ${kelas}`;
  document.getElementById("printSubJudulDokumen").innerText =
    `TSM SMK Muhammadiyah Pakem • Dicetak pada ${new Date().toLocaleDateString("id-ID")}`;
  window.print();
}

function sendUpdatePromise(sheetTarget, n, j, ni) {
  return new Promise((resolve, reject) => {
    const token = sessionStorage.getItem("admin_tsm_token") || "";
    const cbName = "cbUpd_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    const timer = setTimeout(() => {
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
      reject(new Error("Timeout saat menyimpan ke Google Sheet"));
    }, 12000);

    window[cbName] = function (r) {
      clearTimeout(timer);
      delete window[cbName];
      const el = document.getElementById(cbName);
      if (el) el.remove();
      resolve(r);
    };

    const url = `${SCRIPT_URL}?action=update&sheet=${encodeURIComponent(sheetTarget)}&nama=${encodeURIComponent(n)}&job_index=${j}&nilai=${ni}&key=${encodeURIComponent(token)}&callback=${cbName}&t=${Date.now()}`;
    const s = document.createElement("script");
    s.id = cbName;
    s.src = url;
    s.onerror = () => {
      clearTimeout(timer);
      delete window[cbName];
      s.remove();
      reject(new Error("Gagal menghubungi server"));
    };
    document.head.appendChild(s);
  });
}

function pilihModeEdit(m, el) {
  editModeMapel = m;
  tutupSidebarMobile();
  document.getElementById("dashboardView").style.display = "none";
  document.getElementById("formKonten").style.display = "none";
  document.getElementById("tabelKonten").style.display = "block";

  const isPraktek = m === "PRAKTEK";
  document.getElementById("judulTabel").innerHTML = isPraktek
    ? `<i class="fas fa-clipboard-list text-success me-2"></i>Rekap & Edit Nilai Praktek (Admin)`
    : `<i class="fas fa-table text-primary me-2"></i>Rekap & Edit Nilai Laporan (PKSM)`;
  document.getElementById("nav-status").innerText = isPraktek ? `Rekap Nilai / Praktek` : `Rekap Nilai / Laporan PKSM`;

  document.querySelectorAll(".list-group-item").forEach((i) => i.classList.remove("active-menu"));
  if (el) el.classList.add("active-menu");
  refreshTabel();
}

function refreshTabel() {
  const k = document.getElementById("kelasTabel").value;
  const targetSheet = getNamaSheet(k, editModeMapel);
  const b = document.getElementById("bodyTable");
  tempNames = null;
  tempTable = null;
  b.innerHTML = `<tr><td colspan="10" class="py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div> Memuat data sheet <strong>${targetSheet}</strong>...</td></tr>`;

  ["adminGasNames", "adminGasTable"].forEach((id) => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });

  const s1 = document.createElement("script");
  s1.id = "adminGasNames";
  s1.src = `${SCRIPT_URL}?sheet=${encodeURIComponent(targetSheet)}&callback=adminOnNames&t=${Date.now()}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.id = "adminGasTable";
  s2.src = `${SCRIPT_URL}?action=read&sheet=${encodeURIComponent(targetSheet)}&callback=adminOnTable&t=${Date.now()}`;
  document.head.appendChild(s2);
}

window.adminOnNames = function (names) {
  tempNames = Array.isArray(names) ? names : [];
  gabungDataAdmin();
};

window.adminOnTable = function (table) {
  tempTable = Array.isArray(table) ? table : [];
  gabungDataAdmin();
};

function gabungDataAdmin() {
  if (tempNames === null || tempTable === null) return;

  const k = document.getElementById("kelasTabel").value;
  const targetSheet = getNamaSheet(k, editModeMapel);

  if (tempTable.length < 2) {
    dataGabungan = [];
    perbaruiStatistikAdmin();
    document.getElementById("bodyTable").innerHTML = `
      <tr>
        <td colspan="10" class="py-4 text-muted">
          Data di sheet <strong>${targetSheet}</strong> belum ditemukan atau masih kosong.<br>
          <small>Pastikan tab <code>${targetSheet}</code> sudah dibuat di Google Spreadsheet.</small>
        </td>
      </tr>
    `;
    return;
  }

  const headers = tempTable[0].map((h) => String(h || "").trim());
  const rows = tempTable.slice(1);
  const idxAkhir = headers.findIndex((h) => /nilai\s*akhir|akhir|\bna\b/i.test(h));

  const jobCols = [];
  headers.forEach((h, i) => {
    if (i > 0 && i !== idxAkhir && h !== "") jobCols.push({ i, judul: h });
  });
  daftarHeaderJob = jobCols.map((c) => c.judul);

  activeBatchJobIdx = null;
  perbaruiTombolBatchUI();
  const selBatch = document.getElementById("selectBatchJob");
  if (selBatch) {
    selBatch.innerHTML =
      `<option value="">-- Edit Massal per Job --</option>` +
      daftarHeaderJob.map((j, idx) => `<option value="${idx}">Job ${idx + 1}: ${j}</option>`).join("");
  }

  document.getElementById("headerTable").innerHTML = `
    <th width="45">No</th>
    <th class="text-start">Nama Siswa</th>
    ${daftarHeaderJob.map((j) => `<th>${j}</th>`).join("")}
    <th>NA</th>
    <th width="165" class="col-aksi">Aksi</th>
  `;

  dataGabungan = tempNames
    .map((namaRaw, idx) => {
      const nama = String(Array.isArray(namaRaw) ? namaRaw[0] : namaRaw || "").trim();
      const r = rows[idx] || [];

      const scores = jobCols.map((c) => {
        const raw = String(r[c.i] ?? "").trim();
        const num = parseFloat(raw);
        return raw === "" || isNaN(num) ? 0 : num;
      });

      let na = hitungNA(scores);
      if (idxAkhir >= 0 && r[idxAkhir] !== "" && r[idxAkhir] != null) {
        const n = parseFloat(r[idxAkhir]);
        if (!isNaN(n)) na = Number(n.toFixed(1));
      }

      return {
        id: idx,
        nama,
        scores,
        originalScores: [...scores],
        na,
        editing: false,
        saving: false,
      };
    })
    .filter((s) => s.nama !== "");

  perbaruiStatistikAdmin();
  filterBarisTabel();
}

function hitungNA(scores) {
  if (!scores || !scores.length) return 0;
  const total = scores.reduce((a, b) => a + (Number(b) || 0), 0);
  return Number((total / scores.length).toFixed(1));
}

function perbaruiStatistikAdmin() {
  document.getElementById("statTotal").innerText = dataGabungan.length;
  const tuntasCount = dataGabungan.filter((s) => s.scores.length > 0 && s.scores.every((v) => v >= KKM)).length;
  document.getElementById("statTuntas").innerText = tuntasCount;
  document.getElementById("statKurang").innerText = dataGabungan.length - tuntasCount;
}

function filterBarisTabel() {
  const q = document.getElementById("cariNamaTabel").value.toLowerCase().trim();
  const st = document.getElementById("filterKetuntasan").value;

  const filtered = dataGabungan.filter((s) => {
    if (!s.nama.toLowerCase().includes(q)) return false;
    const tuntasSemua = s.scores.length > 0 && s.scores.every((v) => v >= KKM);
    if (st === "tuntas") return tuntasSemua;
    if (st === "kurang") return !tuntasSemua;
    return true;
  });

  renderTabelAdmin(filtered);
}

function renderTabelAdmin(list) {
  const b = document.getElementById("bodyTable");
  b.innerHTML = "";
  if (!list.length) {
    b.innerHTML = `<tr><td colspan="${daftarHeaderJob.length + 4}" class="py-4 text-muted">Data siswa tidak ditemukan.</td></tr>`;
    return;
  }

  list.forEach((s, noUrut) => {
    const tr = document.createElement("tr");
    tr.id = `rowSiswa_${s.id}`;
    if (s.editing || activeBatchJobIdx !== null) tr.classList.add("row-editing");

    const noHtml = `<td class="text-muted fw-medium">${noUrut + 1}</td>`;
    const namaHtml = `<td class="text-start fw-semibold text-dark">${s.nama}</td>`;

    const jobsHtml = s.scores
      .map((val, jobIdx) => {
        const cls = val >= KKM ? "score-pass" : "score-fail";
        const isBatchCol = activeBatchJobIdx === jobIdx;

        if (s.editing || isBatchCol) {
          return `
            <td>
              <input
                type="number"
                min="0"
                max="100"
                class="form-control inline-score-input ${cls} ${isBatchCol ? "batch-input-cell" : ""}"
                id="inp_${s.id}_${jobIdx}"
                value="${val}"
                onfocus="this.select()"
                oninput="ubahNilaiInline(${s.id}, ${jobIdx}, this)"
                onkeydown="navigasiInputBatch(event, ${noUrut}, ${jobIdx})"
              >
            </td>
          `;
        } else {
          return `<td><span class="score-pill ${cls}">${val}</span></td>`;
        }
      })
      .join("");

    const naCls = s.na >= KKM ? "text-success" : "text-danger";
    const naHtml = `<td class="fw-bold ${naCls}" id="naSiswa_${s.id}">${s.na}</td>`;

    let aksiHtml = `<td class="col-aksi">`;
    if (activeBatchJobIdx !== null) {
      aksiHtml += `<span class="badge bg-warning-subtle text-warning-emphasis border">Mode Massal</span>`;
    } else if (s.saving) {
      aksiHtml += `<button class="btn btn-sm btn-secondary rounded-3 px-2" disabled><span class="spinner-border spinner-border-sm me-1"></span>Menyimpan</button>`;
    } else if (s.editing) {
      aksiHtml += `
        <div class="d-inline-flex gap-1">
          <button type="button" class="btn btn-sm btn-success fw-semibold rounded-3 px-2" onclick="simpanBarisInline(${s.id})" title="Simpan Perubahan">
            <i class="fas fa-save me-1"></i>Simpan
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary rounded-3 px-2" onclick="batalEditBaris(${s.id})" title="Batal">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    } else {
      aksiHtml += `
        <div class="d-inline-flex gap-1">
          <button type="button" class="btn btn-sm btn-primary fw-semibold rounded-3 px-2" onclick="bukaModalEditNilai(${s.id})" title="Edit Semua Nilai via Modal (Nyaman di HP)">
            <i class="fas fa-edit me-1"></i>Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-warning text-dark rounded-3 px-2" onclick="mulaiEditBaris(${s.id})" title="Edit Langsung di Tabel (Inline)">
            <i class="fas fa-table"></i>
          </button>
        </div>
      `;
    }
    aksiHtml += `</td>`;

    tr.innerHTML = noHtml + namaHtml + jobsHtml + naHtml + aksiHtml;
    b.appendChild(tr);
  });
}

/* ======================================================
   BATCH / EDIT MASSAL PER KOLOM JOB
====================================================== */
function perbaruiTombolBatchUI() {
  const isBatch = activeBatchJobIdx !== null;
  const sel = document.getElementById("selectBatchJob");
  const btnMulai = document.getElementById("btnMulaiBatch");
  const btnSimpan = document.getElementById("btnSimpanBatch");
  const btnBatal = document.getElementById("btnBatalBatch");

  if (!sel || !btnMulai || !btnSimpan || !btnBatal) return;
  sel.disabled = isBatch;
  btnMulai.classList.toggle("d-none", isBatch);
  btnSimpan.classList.toggle("d-none", !isBatch);
  btnBatal.classList.toggle("d-none", !isBatch);
}

function mulaiBatchEditJob() {
  const sel = document.getElementById("selectBatchJob");
  if (!sel || sel.value === "") {
    return alert("Pilih dulu kolom Job mana yang ingin diedit massal!");
  }
  activeBatchJobIdx = parseInt(sel.value);
  perbaruiTombolBatchUI();
  filterBarisTabel();

  const firstCell = document.querySelector(".batch-input-cell");
  if (firstCell) firstCell.focus();
}

function batalBatchEditJob() {
  dataGabungan.forEach((s) => {
    s.scores = [...s.originalScores];
    s.na = hitungNA(s.scores);
  });
  activeBatchJobIdx = null;
  perbaruiTombolBatchUI();
  perbaruiStatistikAdmin();
  filterBarisTabel();
}

function navigasiInputBatch(e, rowIndex, jobIdx) {
  if (activeBatchJobIdx === null) return;
  if (e.key === "Enter" || e.key === "ArrowDown") {
    e.preventDefault();
    const cells = document.querySelectorAll(".batch-input-cell");
    if (cells[rowIndex + 1]) cells[rowIndex + 1].focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    const cells = document.querySelectorAll(".batch-input-cell");
    if (cells[rowIndex - 1]) cells[rowIndex - 1].focus();
  }
}

async function simpanBatchEditJob() {
  if (activeBatchJobIdx === null) return;
  const jobIdx = activeBatchJobIdx;

  const daftarBerubah = dataGabungan.filter((s) => s.scores[jobIdx] !== s.originalScores[jobIdx]);

  if (daftarBerubah.length === 0) {
    activeBatchJobIdx = null;
    perbaruiTombolBatchUI();
    filterBarisTabel();
    return alert("Tidak ada perubahan nilai untuk disimpan.");
  }

  const btnSimpan = document.getElementById("btnSimpanBatch");
  const btnBatal = document.getElementById("btnBatalBatch");
  const originalText = btnSimpan.innerHTML;
  btnSimpan.disabled = true;
  btnBatal.disabled = true;

  const k = document.getElementById("kelasTabel").value;
  const targetSheet = getNamaSheet(k, editModeMapel);

  try {
    for (let i = 0; i < daftarBerubah.length; i++) {
      const s = daftarBerubah[i];
      btnSimpan.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan (${i + 1}/${daftarBerubah.length})...`;
      const res = await sendUpdatePromise(targetSheet, s.nama, jobIdx + 1, s.scores[jobIdx]);
      if (!res || res.status !== "success") {
        throw new Error(`Gagal menyimpan nilai ${s.nama}: ${res?.message || "Server error"}`);
      }
      s.originalScores[jobIdx] = s.scores[jobIdx];
    }

    activeBatchJobIdx = null;
    perbaruiTombolBatchUI();
    perbaruiStatistikAdmin();
    filterBarisTabel();
    alert(`✅ Berhasil menyimpan ${daftarBerubah.length} perubahan nilai!`);
  } catch (err) {
    alert("❌ " + (err.message || "Terjadi kesalahan saat menyimpan massal."));
  } finally {
    btnSimpan.disabled = false;
    btnBatal.disabled = false;
    btnSimpan.innerHTML = originalText;
  }
}

/* ======================================================
   MODAL EDIT SEMUA NILAI (MOBILE FRIENDLY)
====================================================== */
function bukaModalEditNilai(siswaId) {
  const s = dataGabungan.find((item) => item.id === siswaId);
  if (!s) return;

  activeModalSiswaId = siswaId;
  activeModalScores = [...s.scores];

  const kelas = document.getElementById("kelasTabel").value;
  const labelMode = editModeMapel === "PRAKTEK" ? "Nilai Praktek (Admin)" : "Nilai Laporan (PKSM)";

  document.getElementById("modalEditKelasBadge").innerText = `${kelas} • ${labelMode}`;
  document.getElementById("modalEditNamaSiswa").innerText = s.nama;
  document.getElementById("modalEditSubJudul").innerText = `Ubah semua skor job praktik di bawah lalu klik Simpan`;

  const container = document.getElementById("modalEditJobsList");
  container.innerHTML = activeModalScores
    .map((val, idx) => {
      const namaJob = daftarHeaderJob[idx] || `Job ${idx + 1}`;
      const isPass = val >= KKM;
      return `
        <div class="modal-job-card ${isPass ? "pass-card" : "fail-card"} d-flex justify-content-between align-items-center gap-3" id="modalJobCard_${idx}">
          <div>
            <div class="fw-bold text-dark small">${namaJob}</div>
            <small class="${isPass ? "text-success" : "text-danger"} fw-medium" id="modalJobStatus_${idx}">
              ${isPass ? '<i class="fas fa-check-circle me-1"></i>Tuntas KKM' : `<i class="fas fa-exclamation-circle me-1"></i>Belum Tuntas (< ${KKM})`}
            </small>
          </div>
          <input
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            class="form-control modal-score-input"
            id="modalJobInp_${idx}"
            value="${val}"
            onfocus="this.select()"
            oninput="ubahNilaiDiModal(${idx}, this)"
          >
        </div>
      `;
    })
    .join("");

  perbaruiPreviewNAModal();

  if (!modalEditInstance) {
    modalEditInstance = new bootstrap.Modal(document.getElementById("modalEditNilaiSiswa"));
  }
  modalEditInstance.show();
}

function ubahNilaiDiModal(jobIdx, inputEl) {
  let val = parseFloat(inputEl.value);
  if (isNaN(val)) val = 0;
  if (val < 0) val = 0;
  if (val > 100) val = 100;

  activeModalScores[jobIdx] = val;

  const isPass = val >= KKM;
  const card = document.getElementById(`modalJobCard_${jobIdx}`);
  const statusEl = document.getElementById(`modalJobStatus_${jobIdx}`);

  if (card) {
    card.classList.remove("pass-card", "fail-card");
    card.classList.add(isPass ? "pass-card" : "fail-card");
  }
  if (statusEl) {
    statusEl.className = `${isPass ? "text-success" : "text-danger"} fw-medium`;
    statusEl.innerHTML = isPass
      ? '<i class="fas fa-check-circle me-1"></i>Tuntas KKM'
      : `<i class="fas fa-exclamation-circle me-1"></i>Belum Tuntas (< ${KKM})`;
  }

  perbaruiPreviewNAModal();
}

function perbaruiPreviewNAModal() {
  const na = hitungNA(activeModalScores);
  const naEl = document.getElementById("modalEditPreviewNA");
  if (naEl) {
    naEl.innerText = na;
    naEl.className = `h3 fw-bold mb-0 ${na >= KKM ? "text-success" : "text-danger"}`;
  }
}

async function simpanDariModal() {
  const s = dataGabungan.find((item) => item.id === activeModalSiswaId);
  if (!s) return;

  const btn = document.getElementById("btnSimpanModalNilai");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...`;

  const k = document.getElementById("kelasTabel").value;
  const targetSheet = getNamaSheet(k, editModeMapel);

  try {
    for (let idx = 0; idx < activeModalScores.length; idx++) {
      if (activeModalScores[idx] !== s.originalScores[idx]) {
        const res = await sendUpdatePromise(targetSheet, s.nama, idx + 1, activeModalScores[idx]);
        if (!res || res.status !== "success") {
          throw new Error(`Gagal menyimpan ${daftarHeaderJob[idx] || "Job " + (idx + 1)} untuk ${s.nama}`);
        }
        s.originalScores[idx] = activeModalScores[idx];
      }
    }
    s.scores = [...activeModalScores];
    s.na = hitungNA(s.scores);
    s.editing = false;

    if (modalEditInstance) modalEditInstance.hide();
    perbaruiStatistikAdmin();
    filterBarisTabel();
  } catch (err) {
    alert("❌ " + (err.message || "Gagal menyimpan perubahan."));
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/* ======================================================
   INLINE EDIT DI TABEL (UNTUK DESKTOP / LAPTOP)
====================================================== */
function mulaiEditBaris(siswaId) {
  const s = dataGabungan.find((item) => item.id === siswaId);
  if (!s) return;
  s.editing = true;
  filterBarisTabel();
  const firstInput = document.getElementById(`inp_${siswaId}_0`);
  if (firstInput) firstInput.focus();
}

function batalEditBaris(siswaId) {
  const s = dataGabungan.find((item) => item.id === siswaId);
  if (!s) return;
  s.scores = [...s.originalScores];
  s.na = hitungNA(s.scores);
  s.editing = false;
  filterBarisTabel();
}

function ubahNilaiInline(siswaId, jobIdx, inputEl) {
  const s = dataGabungan.find((item) => item.id === siswaId);
  if (!s) return;

  let val = parseFloat(inputEl.value);
  if (isNaN(val)) val = 0;
  if (val < 0) val = 0;
  if (val > 100) val = 100;

  s.scores[jobIdx] = val;
  s.na = hitungNA(s.scores);

  inputEl.classList.remove("score-pass", "score-fail");
  inputEl.classList.add(val >= KKM ? "score-pass" : "score-fail");

  const naEl = document.getElementById(`naSiswa_${siswaId}`);
  if (naEl) {
    naEl.innerText = s.na;
    naEl.className = `fw-bold ${s.na >= KKM ? "text-success" : "text-danger"}`;
  }
}

async function simpanBarisInline(siswaId) {
  const s = dataGabungan.find((item) => item.id === siswaId);
  if (!s) return;

  const k = document.getElementById("kelasTabel").value;
  const targetSheet = getNamaSheet(k, editModeMapel);
  s.saving = true;
  filterBarisTabel();

  try {
    for (let idx = 0; idx < s.scores.length; idx++) {
      if (s.scores[idx] !== s.originalScores[idx]) {
        const res = await sendUpdatePromise(targetSheet, s.nama, idx + 1, s.scores[idx]);
        if (!res || res.status !== "success") {
          throw new Error(`Gagal menyimpan Job ${idx + 1} untuk ${s.nama}`);
        }
        s.originalScores[idx] = s.scores[idx];
      }
    }
    s.editing = false;
  } catch (err) {
    alert("❌ " + (err.message || "Gagal menyimpan perubahan."));
  } finally {
    s.saving = false;
    perbaruiStatistikAdmin();
    filterBarisTabel();
  }
}