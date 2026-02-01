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

// 2. CALLBACK PENERIMA DATA
window.handleApiResponse = function(data) {
    // Berhentikan Animasi Loading
    if (loadingInterval) clearInterval(loadingInterval);
    
    const contentNilai = document.getElementById('content-nilai');
    if (contentNilai) contentNilai.style.display = 'block';
    
    document.getElementById('main-header').textContent = `Nilai ${mapelParam} - ${classParam}`;

    renderTable(data);
    setupSearch(data); // Aktifkan fitur cari
};

// 3. FUNGSI TAMPILKAN TABEL
function renderTable(dataRows) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

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
                <span class="badge bg-danger" style="cursor:pointer" onclick="showJobDetail('${row[0]}', [${belumList}])">
                    ${jmlBelum} Job
                </span>
            </td>
            <td class="text-center fw-bold text-primary" style="background-color: #e7f3ff; border-left: 2px solid #dee2e6;">${nAkhir}</td>
        `;
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
}

// 4. FITUR PENCARIAN NAMA
function setupSearch(data) {
    const searchBox = document.getElementById('searchBox');
    if (!searchBox) return;

    searchBox.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const filteredData = data.filter(row => row[0].toLowerCase().includes(keyword));
        renderTable(filteredData);
    });
}

// 5. POPUP DETAIL
window.showJobDetail = function(nama, indices) {
    if (indices.length === 0) { alert(nama + " sudah LUNAS!"); return; }
    let list = indices.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert("Siswa: " + nama + "\n\nBelum Mengumpulkan:\n" + list);
};

// 6. INIT DENGAN ANIMASI TIMER
function init() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
    
    // Aktifkan Timer di Layar
    const tbody = document.querySelector("#nilaiTable tbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center py-5">
            <div class="spinner-border text-primary me-2"></div> 
            <span class="fw-bold">Menghubungkan ke server...</span><br>
            <small class="text-muted">Proses: <span id="timerText">0</span> detik</small>
        </td></tr>`;
    }

    loadingInterval = setInterval(() => {
        seconds++;
        const timerEl = document.getElementById('timerText');
        if (timerEl) timerEl.textContent = seconds;
    }, 1000);

    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', init);
