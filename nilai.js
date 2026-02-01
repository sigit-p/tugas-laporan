// 1. KONFIGURASI JOB
const ALL_JOB_NAMES = {
    'PKSM': ["Kelistrikan dasar", "Overhaull Starter", "Rangkai Starter", "Sistem Pengapian", "Sistem Pengisian", "Rangkai Gabungan", "Sistem Penerangan"],
    'PSSM': ["Rem Tromol", "Rem Cakram", "CVT Drive Pulley", "Kemudi/Komstir", "Suspensi Depan", "Tambal Ban Bakar", "Tyre Changer"]
};

// 2. AMBIL PARAMETER URL
const urlParams = new URLSearchParams(window.location.search);
const mapelParam = urlParams.get('mapel') || 'PKSM';
const classParam = urlParams.get('class') || '';
const fiturParam = urlParams.get('fitur') || 'Nilai';
const currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];

// 3. FUNGSI PENERIMA DATA (CALLBACK)
window.handleApiResponse = function(data) {
    console.log("Data diterima:", data);
    if (window.loadingInterval) clearInterval(window.loadingInterval);

    // PASTIKAN PINTU KONTEN TERBUKA
    const contentNilai = document.getElementById('content-nilai');
    if (contentNilai) contentNilai.style.display = 'block';
    
    // Update Header Teks
    document.getElementById('main-header').textContent = `${fiturParam} ${mapelParam} - ${classParam}`;

    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Data kosong.</td></tr>';
        return;
    }

    data.forEach((row) => {
        const tr = document.createElement("tr");
        let cellsHtml = `<td class="fw-bold">${row[0]}</td>`;
        
        // Loop Job 1-7
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
            <td class="text-center fw-bold table-primary">${nAkhir}</td>
        `;
        tr.innerHTML = cellsHtml;
        tbody.appendChild(tr);
    });
};

// 4. FUNGSI POPUP DETAIL JOB
window.showJobDetail = function(nama, indices) {
    if (indices.length === 0) { alert(nama + " sudah LUNAS!"); return; }
    let list = indices.map(i => `${i}. ${currentJobNames[i-1]}`).join("\n");
    alert("Siswa: " + nama + "\n\nBelum Mengumpulkan:\n" + list);
};

// 5. JALANKAN PROSES
function loadData() {
    const API_URL = "https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec";
    
    // Tampilkan Header Sementara
    document.getElementById('main-header').textContent = "Memuat Data " + classParam + "...";

    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${Date.now()}`;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', loadData);
