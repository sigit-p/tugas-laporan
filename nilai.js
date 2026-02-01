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
let masterData = [];

// 2. FUNGSI PEMBUAT ANIMASI LOADING
function showLoading() {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <h5 class="fw-bold text-dark">Sedang Mengambil Data ${classParam}...</h5>
                    <div class="mt-2">
                        <span class="badge bg-danger p-2" style="font-size: 1.1rem;">
                            <i class="fas fa-clock me-1"></i> <span id="timerText">0</span> detik
                        </span>
                    </div>
                    <p class="text-muted mt-3 small">Mohon tunggu, sinkronisasi dengan Google Sheets sedang berlangsung.</p>
                </td>
            </tr>`;
    }

    // Jalankan Timer
    seconds = 0;
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById('timerText');
        if (timerEl) timerEl.textContent = seconds;
    }, 1000);
}

// 3. CALLBACK SAAT DATA TIBA
window.handleApiResponse = function(data) {
    if (loadingInterval) clearInterval(loadingInterval);
    
    // Update Header
    const mainHeader = document.getElementById('main-header');
    if (mainHeader) mainHeader.textContent = `Laporan Nilai ${mapelParam} - ${classParam}`;

    masterData = data;
    renderTable(data);
    setupSearch();
};

// 4. RENDER TABEL
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

// 5. FITUR CARI & POPUP (Tetap Sama)
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

window.showJobDetail = function(nama, indices) {
    if (indices.length === 0) { alert(nama + " sudah LUNAS!"); return; }
    let list = indices.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert("Siswa: " + nama + "\n\nBelum Mengumpulkan:\n" + list);
};

// 6. JALANKAN PROSES (Berurutan)
document.addEventListener('DOMContentLoaded', () => {
    showLoading(); // 1. Gambar loading dulu
    
    // 2. Kasih jeda 100ms baru panggil Google (agar browser sempat gambar loading)
    setTimeout(() => {
        const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
        const script = document.createElement('script');
        script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
        document.head.appendChild(script);
    }, 100);
});
