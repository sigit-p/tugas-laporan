// 1. KONFIGURASI JOB
const ALL_JOB_NAMES = {
    'PKSM': ["Kelistrikan dasar", "Overhaull Starter", "Rangkai Starter", "Sistem Pengapian", "Sistem Pengisian", "Rangkai Gabungan", "Sistem Penerangan"],
    'PSSM': ["Rem Tromol", "Rem Cakram", "CVT Drive Pulley", "Kemudi/Komstir", "Suspensi Depan", "Tambal Ban Bakar", "Tyre Changer"]
};

// 2. PARAMETER URL
const urlParams = new URLSearchParams(window.location.search);
const mapelParam = urlParams.get('mapel') || 'PKSM';
const classParam = urlParams.get('class') || '';
const fiturParam = urlParams.get('fitur') || 'Nilai';
const currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];

// 3. CALLBACK PENERIMA DATA
window.handleApiResponse = function(data) {
    if (window.loadingInterval) clearInterval(window.loadingInterval);

    const contentNilai = document.getElementById('content-nilai');
    if (contentNilai) contentNilai.style.display = 'block';
    
    document.getElementById('main-header').textContent = `${fiturParam} ${mapelParam} - ${classParam}`;

    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    data.forEach((row) => {
        const tr = document.createElement("tr");
        
        // --- 1. KOLOM NAMA ---
        let cellsHtml = `<td class="fw-bold">${row[0]}</td>`;
        
        // --- 2. KOLOM JOB 1-7 (LOOPING) ---
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
        
        // Ambil data Belum (Index 8) dan Akhir (Index 9)
        const jmlBelum = row[8] || 0;
        const nAkhir = row[9] || 0;
        
        // --- 3. KOLOM BELUM & AKHIR (DI LUAR LOOPING) ---
        cellsHtml += `
            <td class="text-center">
                <span class="badge bg-danger" style="cursor:pointer" onclick="showJobDetail('${row[0]}', [${belumList}])">
                    ${jmlBelum} Job
                </span>
            </td>
            <td class="text-center fw-bold text-primary" style="background-color: #e7f3ff; border-left: 2px solid #dee2e6;">
                ${nAkhir}
            </td>
        `;
        
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
};

// 4. POPUP
window.showJobDetail = function(nama, indices) {
    if (indices.length === 0) { alert(nama + " sudah LUNAS!"); return; }
    let list = indices.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert("Siswa: " + nama + "\n\nBelum Mengumpulkan:\n" + list);
};

// 5. INIT
function loadData() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', loadData);
