// 1. KONFIGURASI DAFTAR JOB (PKSM & PSSM)
const ALL_JOB_NAMES = {
    'PKSM': [
        "Kelistrikan dasar (Seri-Paralel)", 
        "Overhaull Motor Starter",             
        "Merangkai Kelistrikan Sistem Starter", 
        "Pemeriksaan Sistem Pengapian",         
        "Pemeriksaan Sistem Pengisian",         
        "Merangkai Kelistrikan Sistem Pengapian dan Pengisian",
        "Merangkai Kelistrikan Sistem Penerangan" 
    ],
    'PSSM': [
        "Rem Tromol", 
        "Rem Cakram",               
        "CVT Drive Pulley", 
        "Kemudi/Komstir",           
        "Suspensi Depan",           
        "Tambal Ban Bakar",
        "Tyre Changer" 
    ]
};

// 2. AMBIL PARAMETER DARI URL
const urlParams = new URLSearchParams(window.location.search);
const mapelParam = urlParams.get('mapel') || 'PKSM';
const classParam = urlParams.get('class');
const currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];

// 3. FUNGSI PENERIMA DATA (CALLBACK)
window.handleApiResponse = function(data) {
    if (window.loadingInterval) clearInterval(window.loadingInterval);
    
    // Hapus baris loading
    const loadingRow = document.getElementById('loadingIndicator')?.closest('tr');
    if (loadingRow) loadingRow.remove();

    if (!data || !Array.isArray(data)) {
        alert("Data tidak ditemukan atau format salah.");
        return;
    }
    renderTable(data);
};

// 4. FUNGSI TAMPILAN TABEL
function renderTable(dataRows) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    dataRows.forEach((row) => {
        const tr = document.createElement("tr");
        
        // Indeks 0: Nama Siswa
        let cellsHtml = `<td class="fw-bold">${row[0]}</td>`;
        
        // Indeks 1-7: Nilai Job
        let jobBelumIndeks = [];
        for (let i = 1; i <= 7; i++) {
            let val = String(row[i] || "").trim();
            let style = "";
            
            if (val !== "" && !isNaN(val)) {
                style = parseFloat(val) < 75 ? 'style="color:#dc3545; font-weight:bold; background-color:#fff5f5;"' : 'style="color:#28a745; font-weight:bold;"';
            } else {
                // Jika kosong, catat indeksnya untuk Popup "Belum"
                jobBelumIndeks.push(i); 
            }
            cellsHtml += `<td class="text-center" ${style}>${val || "-"}</td>`;
        }
        
        // Indeks 8: Jumlah Belum, Indeks 9: Nilai Akhir
        const jmlBelum = row[8] || 0;
        const nilaiAkhir = row[9] || 0;
        
        cellsHtml += `
            <td class="text-center">
                ${jmlBelum == 0 
                    ? '<span class="badge bg-success">LUNAS</span>' 
                    : `<span class="badge bg-warning text-dark" style="cursor:pointer" onclick="showPopup('${row[0]}', [${jobBelumIndeks}])">${jmlBelum} Job</span>`
                }
            </td>
            <td class="text-center fw-bold" style="background-color:#f8f9fa;">${nilaiAkhir}</td>
        `;
        
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
}

// 5. FUNGSI POPUP (Menampilkan Nama Job yang Belum)
window.showPopup = function(nama, listIndeks) {
    let teksJob = listIndeks.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert(`Siswa: ${nama}\n\nBelum Mengumpulkan:\n${teksJob}`);
};

// 6. JALANKAN PEMANGGILAN DATA
function init() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
    
    const tbody = document.querySelector("#nilaiTable tbody");
    if (tbody) tbody.innerHTML = '<tr><td colspan="10" id="loadingIndicator" class="text-center">⏳ Memuat Data '+classParam+'... <b id="loadingTimer">(0s)</b></td></tr>';

    let sec = 0;
    window.loadingInterval = setInterval(() => { 
        sec++; 
        if(document.getElementById('loadingTimer')) document.getElementById('loadingTimer').textContent = `(${sec}s)`;
    }, 1000);

    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', init);
