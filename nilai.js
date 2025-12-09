// ==============================================================================
// 1. KONFIGURASI DAN URL API (WAJIB GANTI)
// ==============================================================================

// PASTI GANTI URL INI!
const API_URL = 'https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec';

// Daftar nama job (harus sama persis dengan header di Sheets, E sampai K)
const jobNames = [
    "Kelistrikan dasar (Seri-Paralel)", 
    "Overhaull Motor Starter",          
    "Merangkai Kelistrikan Sistem Starter", 
    "Pemeriksaan Sistem Pengapian",     
    "Pemeriksaan Sistem Pengisian",     
    "Merangkai Kelistrikan Sistem Pengapian dan Pengisian",
    "Merangkai Kelistrikan Sistem Penerangan" 
];

let rawData = []; // Data setelah diubah ke format horizontal
const FINAL_SCORE_NAME = 'Nilai Akhir'; // Nama tugas untuk nilai akhir (Kolom L)

// 🔥 VARIABEL GLOBAL BARU UNTUK KONTROL TIMER 🔥
let loadingInterval; 
let secondsElapsed = 0;
// ==============================================================================
// FUNGSI UNTUK MEMBACA PARAMETER URL
// ==============================================================================
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// 🔥🔥 LOKASI TERBAIK UNTUK KODE CATATAN KHUSUS (DI SINI) 🔥🔥
const classParam = getUrlParameter('class'); 
const mapelParam = getUrlParameter('mapel'); 
const jobNoteContainer = document.getElementById('jobNoteContainer');

if (jobNoteContainer) {
    if (classParam === 'XI SB' && mapelParam === 'PKSM') {
        // Konten catatan khusus untuk XI SB PKSM
        const noteHtml = `
            <div style="background-color: #fff3cd; color: #856404; padding: 15px; border: 1px solid #ffeeba; border-radius: 5px; margin-bottom: 20px;">
                <strong>💡 Catatan Penting:</strong> Untuk PKSM kelas *XI TSMB*, baru praktek 5 kali. Jadi wajib mengumpulkan laporan 5 job saja sesuai yang telah dipraktekan. Untuk Cek beres atau belum bisa dilihat pada kolom belum. Untuk kelas XI TSMB harusnya belum 2 Job.
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
    
    // 💡 KOREKSI UTAMA: Deklarasi dan Akses Variabel Loading
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
    // Tidak perlu 'else' untuk clearInterval karena sudah di handle di awal fungsi.

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
 */
function getBelum(row) {
    let belumList = [];
    // Dimulai dari indeks 1 (Job 1), hingga jobNames.length (Job 7)
    for (let i = 1; i <= jobNames.length; i++) { 
        
        // Cek hanya di kolom Tugas/Job, abaikan kolom Nilai Akhir.
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
    // ... (Fungsi ini tidak diubah)
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const box = document.createElement("div");
    box.className = "popup-box";

    let html = `<h3>${nama}</h3>`;
    html += "<p>Belum mengumpulkan:</p><ul>";

    jobBelum.forEach(i => {
        html += `<li>${i}. ${jobNames[i - 1]}</li>`;
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
    
    // 🔥 KOREKSI 1: Membersihkan elemen sisa loading / sekat aneh 🔥
    // Ini memastikan tbody benar-benar kosong sebelum data baru ditambahkan.
    tbody.innerHTML = ""; 
    
    // console.log("Memulai pengisian tabel dengan data:", data.length, "baris.");
    
    const dataRows = Array.isArray(data) ? data : []; 
    
    dataRows.forEach(row => {
        // 1. AMBIL JUMLAH BELUM DARI APPS SCRIPT (Index 8)
        const belumCount = row[jobNames.length + 1]; // row[8]
        
        // 2. AMBIL DAFTAR JOB BELUM (Dibutuhkan untuk Pop-up)
        let belumList = getBelum(row); 

        const tr = document.createElement("tr");

        // row.slice(1, 8) mengambil Job 1 sampai Job 7
        const jobCells = row.slice(1, jobNames.length + 1).map(v => `<td>${v}</td>`).join("");
        
        // 3. AMBIL NILAI AKHIR DARI INDEKS BARU (Index 9)
        const finalScore = row[jobNames.length + 2]; // row[9]

        tr.innerHTML = `
            <td>${row[0]}</td>
            ${jobCells}
            <td>
              ${belumCount === 0 
                ? "-" 
                : `<span class="badge-belum" data-nama="${row[0]}" data-belum="${belumList.join(",")}">${belumCount} job</span>`
              }
            </td>
            <td class="final-score-cell">${finalScore}</td>
            `;

        tbody.appendChild(tr);
    });
    
    // console.log("✅ Tabel Selesai Diisi.");

    // 🔥 KOREKSI 2: Memperbaiki Event Listener Popup 🔥
    // Event listener harus dipasang SETELAH semua TR dan badge selesai dibuat
    document.querySelectorAll(".badge-belum").forEach(b => {
        b.addEventListener("click", (e) => {
            
            // PENTING: Mencegah event click menyebar ke TR/tbody yang memblokir popup
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
 * Kini juga mengatur header dinamis.
 */
function loadDataJSONP() {
    const classParam = getUrlParameter('class'); 
    const mapelParam = getUrlParameter('mapel'); 
    const fiturParam = getUrlParameter('fitur'); 

    if (!classParam || !mapelParam || !fiturParam || fiturParam !== 'Nilai') {
        return; 
    }

    // 🌟 PANGGILAN DI SINI 🌟
    showContent(fiturParam);
    
    // --- Langkah 1: Atur Tampilan Header ---
    const headerEl = document.getElementById('main-header');
    headerEl.textContent = `${fiturParam.toUpperCase()} ${mapelParam} Kelas ${classParam}`;
    document.getElementById('page-title').textContent = `${fiturParam} ${mapelParam}`;
    document.getElementById('back-link').href = `select_feature.html?mapel=${mapelParam}`;
    
    // --- Langkah 2: Memuat Data dari API ---
    
    // Sheet Name HANYA MENGGUNAKAN KELAS
    const sheetName = classParam; 

// **PERBAIKAN LOGIKA LOADING DI SINI**
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
    const loadingEl = document.getElementById('loadingIndicator');

    // Pastikan timer di-reset sebelum start
    secondsElapsed = 0;
    
    // 🔥 START TIMER (Interval akan berjalan setiap 1 detik) 🔥
    loadingInterval = setInterval(() => {
        secondsElapsed++;
        const timerEl = document.getElementById('loadingTimer');
        if (timerEl) {
            timerEl.textContent = `(${secondsElapsed} detik)`;
        } else {
            // Berhenti jika elemen loading sudah hilang (kasus error/terhapus)
            clearInterval(loadingInterval);
        }
    }, 1000); // Update setiap 1000 milidetik (1 detik)

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
