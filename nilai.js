// 1. KONFIGURASI DAN PARAMETER URL
const mapelParam = getUrlParameter('mapel');
const classParam = getUrlParameter('class');
const fiturParam = getUrlParameter('fitur');

const ALL_JOB_NAMES = {
    'PKSM': ["Kelistrikan dasar", "Overhaull Starter", "Rangkai Starter", "Sistem Pengapian", "Sistem Pengisian", "Rangkai Gabungan", "Sistem Penerangan"],
    'PSSM': ["Rem Tromol", "Rem Cakram", "CVT Drive Pulley", "Kemudi/Komstir", "Suspensi Depan", "Tambal Ban Bakar", "Tyre Changer"]
};

let currentJobNames = [];
let API_URL = (mapelParam === 'PSSM') 
    ? 'https://script.google.com/macros/s/AKfycbx4yH7_roOJLbv3bjwAKT4b5hfUpgokq0g4gdPujbmV9UEAIfSx1HkZc1ASzcPtpyGmSw/exec' 
    : 'https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec';

let loadingInterval;
let secondsElapsed = 0;

// 2. FUNGSI PENERIMA DATA (JSONP CALLBACK) - WAJIB DI ATAS
window.handleApiResponse = function(data) {
    if (loadingInterval) clearInterval(loadingInterval);
    const loadingRow = document.getElementById('loadingIndicator')?.closest('tr');
    if (loadingRow) loadingRow.remove();

    if (data.error) {
        alert("Error dari Google Sheets: " + data.error);
        return;
    }
    loadTable(data);
};

// 3. FUNGSI PEMANGGIL DATA (MESIN JSONP)
function loadDataJSONP() {
    if (!classParam || fiturParam !== 'Nilai') return;

    currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];
    
    // Tampilkan Loading
    const tbody = document.querySelector("#nilaiTable tbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:20px;">
            <span id="loadingIndicator">⏳ Memuat Data ${classParam}... </span>
            <b id="loadingTimer">(0 detik)</b>
        </td></tr>`;
    }

    secondsElapsed = 0;
    loadingInterval = setInterval(() => {
        secondsElapsed++;
        if(document.getElementById('loadingTimer')) document.getElementById('loadingTimer').textContent = `(${secondsElapsed} detik)`;
    }, 1000);

    // Panggil Script Google
    const script = document.createElement('script');
    script.src = `${API_URL}?sheet=${encodeURIComponent(classParam)}&callback=handleApiResponse&t=${new Date().getTime()}`;
    document.head.appendChild(script);
}

// 4. FUNGSI TAMPILAN TABEL
function loadTable(data) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const jobCount = currentJobNames.length;
    
    data.forEach(row => {
        const belumCount = parseInt(row[jobCount + 1]) || 0;
        const finalScore = row[jobCount + 2];
        
        const jobCells = row.slice(1, jobCount + 1).map(v => {
            let val = String(v).trim();
            let style = (val !== "" && !isNaN(val) && parseFloat(val) < 75) 
                ? 'style="color: #dc3545; font-weight: bold; background-color: #fff5f5;"' 
                : (val !== "" && !isNaN(val)) ? 'style="color: #28a745; font-weight: bold;"' : '';
            return `<td ${style} class="text-center">${val || "-"}</td>`;
        }).join("");

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="fw-bold">${row[0]}</td>
            ${jobCells}
            <td class="text-center"><span class="badge ${belumCount === 0 ? 'bg-success' : 'bg-warning text-dark'}">${belumCount} Job</span></td>
            <td class="text-center fw-bold">${finalScore || "0"}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. HELPER & INITIALIZER
function getUrlParameter(name) {
    const results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', loadDataJSONP);
