// ==============================================================================
// FUNGSI UNTUK MEMBACA PARAMETER URL
// ==============================================================================
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// ==============================================================================
// 1. KONFIGURASI DAN URL API (MULTI-MAPEL)
// ==============================================================================

const mapelParam = getUrlParameter('mapel');
const classParam = getUrlParameter('class');

// --- DAFTAR JOB UNTUK SEMUA MAPEL ---
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
// ------------------------------------

let currentJobNames = []; // 🔥 VARIABEL GLOBAL BARU UNTUK DAFTAR JOB AKTIF 🔥

// PASTI GANTI DUA URL INI!
let API_URL = '';

if (mapelParam === 'PSSM') {
    // 🔥 URL API BARU DARI APPS SCRIPT SHEET PSSM (GANTI DI SINI!)
    API_URL = 'https://script.google.com/macros/s/AKfycbx4yH7_roOJLbv3bjwAKT4b5hfUpgokq0g4gdPujbmV9UEAIfSx1HkZc1ASzcPtpyGmSw/exec'; 
} else {
    // URL API LAMA UNTUK PKSM (GANTI DI SINI!)
    API_URL = 'https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec'; 
}

const FINAL_SCORE_NAME = 'Nilai Akhir'; 
let rawData = [];

// 🔥 VARIABEL GLOBAL UNTUK KONTROL TIMER 🔥
let loadingInterval;
let secondsElapsed = 0;

// ==============================================================================
// FUNGSI CATATAN KHUSUS (TETAP)
// ==============================================================================
const jobNoteContainer = document.getElementById('jobNoteContainer');

if (jobNoteContainer) {
    // KONDISI 1: PKSM Kelas XI SB
    if (classParam === 'XI SB' && mapelParam === 'PKSM') {
        // Konten catatan khusus untuk XI SB PKSM (5 Job wajib)
        const noteHtml = `
            <div style="background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeeba; border-radius: 5px; margin-bottom: 20px;">
                <strong>💡 Catatan Penting:</strong> Untuk PKSM kelas *XI TSMB*, baru praktek 5 kali. Jadi wajib mengumpulkan laporan 5 job saja sesuai yang telah dipraktekan. Untuk lunas atau belum, bisa dilihat pada kolom belum. Jika tertulis belum *2 Job* berarti sudah beres. 
            </div> 
        `;
        jobNoteContainer.innerHTML = noteHtml;
        
    // 🔥 KONDISI BARU: PSSM Kelas XI SA 🔥
    } else if (classParam === 'XI SA' && mapelParam === 'PSSM') {
        // Konten catatan khusus untuk XI SA PSSM (4 Job wajib)
        const noteHtml = `
            <div style="background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeeba; border-radius: 5px; margin-bottom: 20px;">
                <strong>💡 Catatan Penting:</strong> Untuk PSSM kelas *XI TSM A*, saat ini baru 4 Job yang wajib dikumpulkan (sesuai yang telah dipraktekkan). Untuk lunas atau belum, silakan lihat pada kolom **Belum**. Jika tertulis belum *3 job* berarti sudah beres.
            </div> 
        `;
        jobNoteContainer.innerHTML = noteHtml;
        
    } else {
        jobNoteContainer.innerHTML = '';
    }
}

// ==============================================================================
// 1.5. FUNGSI UTILITAS TAMPILAN
// ==============================================================================

/**
 * Mengontrol tampilan div konten yang dipilih (Nilai, Materi, Video, Soal).
 */
function showContent(fitur) {
    // Sembunyikan semua konten fitur
    document.querySelectorAll('.feature-content').forEach(el => {
        el.style.display = 'none';
    });

    // Tampilkan konten yang sesuai
    if (fitur === 'Nilai') {
        document.getElementById('content-nilai').style.display = 'block';
    } 
    // Jika Anda menambahkan fitur lain nanti (Materi, Video), tambahkan logika di sini.
}

// ==============================================================================
// 2. FUNGSI PEMROSESAN DATA & CALLBACK JSONP
// ==============================================================================

// HARUS menjadi fungsi global (ditempelkan ke window)
window.handleApiResponse = function(data) {
   
    // 🔥 STOP TIMER DI AWAL FUNGSI 🔥
    if (loadingInterval) {
        clearInterval(loadingInterval);
    }
    
    // Ambil elemen loading (span)
    const loadingEl = document.getElementById('loadingIndicator');

    // Cek jika elemen loading ditemukan
    if (loadingEl) {
        // Cari baris (<tr>) terdekat dari span loading
        const loadingRow = loadingEl.closest('tr');
        
        // Jika baris loading ditemukan, hapus
        if (loadingRow) {
            loadingRow.remove();
        }
    } 
    
    // Menghapus tag script
    const scriptEl = document.getElementById('jsonp_script');
    if (scriptEl) scriptEl.remove();

    if (data.error) {
        console.error("Apps Script Error:", data.error);
        document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">ERROR DATA: ${data.error}</p>`;
        return;
    }
    
    // Data yang diterima sudah dalam bentuk horizontal, langsung gunakan.
    rawData = data; 
    
    console.log("✅ Data Raw Berhasil Diterima & Sudah Horizontal:", rawData); 
    
    // Panggil loadTable untuk menampilkan data
    loadTable(rawData);
};

/**
 * Mengambil daftar job yang belum dikumpulkan berdasarkan baris data horizontal.
 * Menggunakan currentJobNames global.
 */
function getBelum(row) {
    let belumList = [];
    
    // 🔥 PENGGUNAAN currentJobNames 🔥
    const jobCount = currentJobNames.length;
    
    // Dimulai dari indeks 1 (Job 1), hingga jobCount (Job 7)
    for (let i = 1; i <= jobCount; i++) { 
        
        // Cek hanya di kolom Tugas/Job.
        const cellValue = String(row[i]).trim();
        
        // Cek jika kolomnya kosong ("" yang berasal dari .trim())
        if (cellValue === "") {
            belumList.push(i);
        }
    }
    return belumList;
}

// ==============================================================================
// 3. FUNGSI TAMPILAN (POPUPS & TABLE)
// ==============================================================================

function showPopup(nama, jobBelum) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const box = document.createElement("div");
    box.className = "popup-box";

    let html = `<h3>${nama}</h3>`;
    html += "<p>Belum mengumpulkan:</p><ul>";

    // 🔥 PENGGUNAAN currentJobNames 🔥
    jobBelum.forEach(i => {
        html += `<li>${i}. ${currentJobNames[i - 1]}</li>`;
    });

    html += "</ul>";

    box.innerHTML = html;
    overlay.appendChild(box);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
}

function loadTable(data) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) {
        console.error("Elemen #nilaiTable tbody TIDAK DITEMUKAN.");
        return; 
    }
    
    tbody.innerHTML = ""; 
    
    const dataRows = Array.isArray(data) ? data : []; 
    const jobCount = currentJobNames.length;
    
    dataRows.forEach(row => {
        const belumCount = row[jobCount + 1]; 
        let belumList = getBelum(row); 

        const tr = document.createElement("tr");

        // --- MODIFIKASI LOGIKA PEWARNAAN DI SINI ---
        const jobCells = row.slice(1, jobCount + 1).map(v => {
            let cellValue = String(v).trim();
            let style = "";
            
            // Cek jika sel berisi angka
            if (cellValue !== "" && !isNaN(cellValue)) {
                let num = parseFloat(cellValue);
                if (num < 75) {
                    style = 'style="color: #dc3545; font-weight: bold; background-color: #fff5f5;"'; // Merah
                } else {
                    style = 'style="color: #28a745; font-weight: bold;"'; // Hijau
                }
            }
            return `<td ${style} class="text-center">${cellValue}</td>`;
        }).join("");
        // -------------------------------------------
        
        const finalScore = row[jobCount + 2];
        let finalStyle = "";
        
        // Warna untuk Nilai Akhir
        if (finalScore !== "" && !isNaN(finalScore)) {
            finalStyle = parseFloat(finalScore) < 75 ? 'text-danger' : 'text-success';
        }

        tr.innerHTML = `
            <td class="fw-bold">${row[0]}</td>
            ${jobCells}
            <td class="text-center">
              ${belumCount === 0 
                ? '<span class="badge bg-success">LUNAS</span>' 
                : `<span class="badge-belum" data-nama="${row[0]}" data-belum="${belumList.join(",")}">${belumCount} job</span>`
              }
            </td>
            <td class="final-score-cell text-center fw-bold ${finalStyle}">${finalScore}</td>
            `;

        tbody.appendChild(tr);
    });
    
    // Pasang ulang Event Listener Popup
    document.querySelectorAll(".badge-belum").forEach(b => {
        b.addEventListener("click", (e) => {
            e.stopPropagation(); 
            const nama = b.getAttribute("data-nama");
            const belum = b.getAttribute("data-belum")
                                 .split(",")
                                 .map(n => parseInt(n));
            showPopup(nama, belum);
        });
    });
}

// ==============================================================================
// 4. FUNGSI INISIALISASI UTAMA (MENGGANTIKAN loadAPI lama)
// ==============================================================================

/**
 * Fungsi utama untuk mengambil data dari Apps Script API menggunakan JSONP.
 * Kini juga mengatur header dinamis dan variabel Job.
 */
function loadDataJSONP() {
    const classParam = getUrlParameter('class'); 
    const fiturParam = getUrlParameter('fitur'); 
    
    if (!classParam || !mapelParam || !fiturParam || fiturParam !== 'Nilai') {
        return; 
    }

    // 🌟 PENTING: SET VARIABEL DAFTAR JOB AKTIF DI SINI 🌟
    currentJobNames = ALL_JOB_NAMES[mapelParam] || ALL_JOB_NAMES['PKSM'];
    if (currentJobNames.length === 0) {
        console.error(`ERROR: Job list for mapel ${mapelParam} not found.`);
        return;
    }
    
    showContent(fiturParam);
    
    // --- Langkah 1: Atur Tampilan Header ---
    const headerEl = document.getElementById('main-header');
    headerEl.textContent = `${fiturParam.toUpperCase()} ${mapelParam} Kelas ${classParam}`;
    document.getElementById('page-title').textContent = `${fiturParam} ${mapelParam}`;
    document.getElementById('back-link').href = `select_feature.html?mapel=${mapelParam}`;
    
    // --- Langkah 2: Memuat Data dari API ---
    
    // Sheet Name HANYA MENGGUNAKAN KELAS
    const sheetName = classParam; 

    // **LOGIKA LOADING**
    const tbody = document.querySelector("#nilaiTable tbody");
    if (tbody) {
        // Tampilkan ulang baris loading sebelum memanggil API
        tbody.innerHTML = `
            <tr><td colspan="10" style="text-align:center;">
                <span id="loadingIndicator">⏳ Memuat data nilai... Harap tunggu.</span>
                
                <span id="loadingTimer" style="margin-left: 10px; font-weight: bold;">(0 detik)</span>

            </td></tr>
        `;
    }
    
    // Pastikan timer di-reset sebelum start
    secondsElapsed = 0;
    
    // 🔥 START TIMER 🔥
    loadingInterval = setInterval(() => {
        secondsElapsed++;
        const timerEl = document.getElementById('loadingTimer');
        if (timerEl) {
            timerEl.textContent = `(${secondsElapsed} detik)`;
        } else {
            clearInterval(loadingInterval);
        }
    }, 1000); 

    // Buat elemen script baru
    const script = document.createElement('script');
    script.id = 'jsonp_script';
    
    // Kirim nama sheet sebagai parameter 'sheet'
    script.src = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&callback=handleApiResponse`; 
    
    document.head.appendChild(script);
}

// --- DI nilai.js ---

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            
            // 1. Tampilkan loading state
            const originalText = refreshBtn.textContent;
            refreshBtn.textContent = 'Menyinkronkan... Harap Tunggu';
            refreshBtn.disabled = true;
            
            // 2. Buat URL refresh (memanggil Apps Script dengan action=refresh)
            const refreshUrl = `${API_URL}?action=refresh`;
            
            try {
                // Panggil API dengan Fetch untuk menjalankan perintah di server
                const response = await fetch(refreshUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const result = await response.json();
                
                // 3. Proses Hasil Sinkronisasi
                if (result.status === 'success') {
                    alert('✅ Sinkronisasi data master XLSX berhasil! Memuat ulang data tabel...');
                    // Muat ulang tabel untuk menampilkan data terbaru
                    loadDataJSONP(); 
                } else {
                    alert(`❌ Sinkronisasi Gagal: ${result.message}`);
                }
                
            } catch (error) {
                alert('❌ Error Koneksi Server atau Gagal Sinkronisasi.');
                console.error('Refresh Error:', error);
            }
            
            // 4. Kembalikan tombol ke state normal
            refreshBtn.textContent = originalText;
            refreshBtn.disabled = false;
        });
    }
}

// ==============================================================================
// 5. INISIALISASI DAN SEARCH
// ==============================================================================

// Mulai proses saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Tombol Refresh
    setupRefreshButton(); 
    
    // 2. Muat Data Nilai
    loadDataJSONP(); 
    
    // 3. Setup Pencarian
    document.getElementById("searchBox").addEventListener("keyup", function () {
        const f = this.value.toLowerCase();
        document.querySelectorAll("#nilaiTable tbody tr").forEach(r => {
            // Pastikan baris data (bukan baris loading/kosong) disaring
            if (r.children.length > 0) { 
                r.style.display = r.children[0].textContent.toLowerCase().includes(f) ? "" : "none";
            }
        });
    });
});
