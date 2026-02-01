// 1. KONFIGURASI JOB
const ALL_JOB_NAMES = {
    'PKSM': ["Kelistrikan dasar", "Overhaull Starter", "Rangkai Starter", "Sistem Pengapian", "Sistem Pengisian", "Rangkai Gabungan", "Sistem Penerangan"],
    'PSSM': ["Rem Tromol", "Rem Cakram", "CVT Drive Pulley", "Kemudi/Komstir", "Suspensi Depan", "Tambal Ban Bakar", "Tyre Changer"]
};

const urlParams = new URLSearchParams(window.location.search);
const mapelParam = urlParams.get('mapel') || 'PKSM';
const classParam = urlParams.get('class') || '';
const currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];

let loadingInterval;
let seconds = 0;
let masterData = []; // Simpan data asli di sini untuk fitur pencarian

// 2. FUNGSI UTAMA DIMULAI (INIT)
function init() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
    
    // Ambil elemen tabel
    const tbody = document.querySelector("#nilaiTable tbody");
    const mainHeader = document.getElementById('main-header');

    if (mainHeader) mainHeader.textContent = "Menghubungkan ke Database...";

    // PAKSA MUNCULKAN LOADING
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
                    <h5 class="fw-bold">Sedang Mengambil Data ${classParam}...</h5>
                    <p class="text-muted">Waktu Berjalan: <span id="timerText" class="badge bg-dark">0</span> detik</p>
                    <p class="small text-secondary">Mohon tunggu, jangan tutup halaman ini.</p>
                </td>
            </tr>`;
    }

    // JALANKAN TIMER
    seconds = 0;
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById('timerText');
        if (timerEl) {
            timerEl.textContent = seconds;
        }
    }, 1000);

    // PANGGIL DATA DARI GOOGLE
    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
    document.head.appendChild(script);
}

// 3. CALLBACK SAAT DATA DARI GOOGLE TIBA
window.handleApiResponse = function(data) {
    console.log("Data mendarat!");
    
    // Matikan Timer
    if (loadingInterval) clearInterval(loadingInterval);
    
    // Pastikan container konten terlihat
    const contentNilai = document.getElementById('content-nilai');
    if (contentNilai) {
        contentNilai.style.display = 'block';
    }
    
    // Update Header
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) mainHeader.textContent = `Laporan Nilai ${mapelParam} - ${classParam}`;

    masterData = data; // Simpan data untuk pencarian
    renderTable(data);
    setupSearch(); // Aktifkan pencarian
};

// 4. FUNGSI RENDER TABEL
function renderTable(dataRows) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!dataRows || dataRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Data tidak ditemukan.</td></tr>';
        return;
    }

    dataRows.forEach((row) => {
        const tr = document.createElement("tr");
        let cellsHtml = `<td class="fw-bold">${row[0]}</td>`;
        
        let belumList = [];
        for (let i = 1; i <= 7; i++) {
            let val = String(row[i] || "").trim();
            let style = "";
            if (val !== "" && !isNaN(val)) {
                style = parseFloat(val) < 75 ? 'style="color:red; font-weight:bold; background:#fff5f5"' : 'style="color:green; font-weight:bold;"';
            } else {
                belumList.push(i);
            }
            cellsHtml += `<td class="text-center" ${style}>${val || "-"}</td>`;
        }
        
        const jmlBelum = row[8] || 0;
        const nAkhir = row[9] || 0;
        
        cellsHtml += `
            <td class="text-center">
                <span class="badge ${jmlBelum == 0 ? 'bg-success' : 'bg-danger'}" style="cursor:pointer" onclick="showJobDetail('${row[0]}', [${belumList}])">
                    ${jmlBelum == 0 ? 'LUNAS' : jmlBelum + ' Job'}
                </span>
            </td>
            <td class="text-center fw-bold text-primary" style="background-color: #e7f3ff; border-left: 2px solid #dee2e6;">${nAkhir}</td>
        `;
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
}

// 5. FITUR CARI
function setupSearch() {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const keyword = e.target.value.toLowerCase();
            const filtered = masterData.filter(row => row[0].toLowerCase().includes(keyword));
            renderTable(filtered);
        });
    }
}

// 6. POPUP DETAIL
window.showJobDetail = function(nama, indices) {
    if (indices.length === 0) { alert(nama + " sudah LUNAS!"); return; }
    let list = indices.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert("Siswa: " + nama + "\n\nBelum Mengumpulkan:\n" + list);
};

// Jalankan aplikasi
document.addEventListener('DOMContentLoaded', init);
