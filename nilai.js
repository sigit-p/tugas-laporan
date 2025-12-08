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
// 🌟 TEMPATKAN FUNGSI transformToHorizontal DI SINI (BARIS ~26) 🌟
// ==============================================================================
/**
 * Mengubah data JSON (vertikal per tugas + Nilai Akhir) dari Apps Script
 * menjadi format array horizontal (satu baris per siswa).
 */
function transformToHorizontal(data) {
    const students = {};
    const numJobs = jobNames.length;
    
    // 🔥🔥 HAPUS BARIS INI (GUNAKAN FINAL_SCORE_NAME GLOBAL) 🔥🔥
    // const FINAL_SCORE_NAME = 'Nilai Akhir'; // Ini menyebabkan shadowing/kebingungan

    data.forEach(record => {
        const name = record.nama_siswa;
        const assignment = record.nama_tugas;
        const score = record.nilai_status;

        if (!students[name]) {
            // Inisialisasi: [Nama, Job1...Job7, NilaiAkhir]
            students[name] = [name, ...Array(numJobs).fill(""), ""]; 
        }

        // --- Logika Penentuan Indeks Tugas/Job ---
        const jobIndex = jobNames.findIndex(job => assignment.trim() === job.trim());
        
        if (jobIndex !== -1) {
            // Jika itu adalah Job (Kolom E-K)
            const isMissing = (String(score).toUpperCase().includes('BELUM KUMPUL') || score === 0 || String(score).trim() === "");
            
            students[name][jobIndex + 1] = isMissing
                ? "" 
                : score;
        // --- Kode yang sudah dimodifikasi ---
        } else if (assignment.trim() === FINAL_SCORE_NAME.trim()) { 
            // Memastikan nilai adalah angka sebelum dibulatkan
            const numericScore = parseFloat(score); 
            
            // Jika nilai valid, bulatkan ke bilangan bulat terdekat
            if (!isNaN(numericScore)) {
                students[name][numJobs + 1] = Math.round(numericScore); // 🔥 PEMBULATAN 🔥
            } else {
                students[name][numJobs + 1] = score; // Pertahankan jika bukan angka (misal: teks)
            }
        }
    });

    // Kembalikan array, ditambahkan header palsu di awal
    return [["Nama", ...jobNames, FINAL_SCORE_NAME], ...Object.values(students)];
}

// ==============================================================================
// 2. FUNGSI PEMROSESAN DATA & CALLBACK JSONP
// ==============================================================================

// HARUS menjadi fungsi global (ditempelkan ke window)
window.handleApiResponse = function(data) {
    // Ambil elemen loading row
    const loadingRow = document.getElementById('loadingIndicator').closest('tr');

    // **Koreksi Aman:** Cek apakah elemen ada sebelum menghapus
    // Jika elemen ditemukan, hapus (ini membatalkan timeout handler)
    if (loadingRow) {
        loadingRow.remove();
    }

    // Menghapus tag script
    const scriptEl = document.getElementById('jsonp_script');
    if (scriptEl) scriptEl.remove();

    if (data.error) {
        console.error("Apps Script Error:", data.error);
        document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">ERROR DATA: ${data.error}</p>`;
        return;
    }
    
    // 1. Transformasi data JSON vertikal ke format horizontal array 2D
    rawData = transformToHorizontal(data);
    
    console.log("✅ Data Raw Berhasil Diterima:", data); 
    console.log("➡️ Data Setelah Transformasi (rawData):", rawData);
    
    // 2. Panggil loadTable untuk menampilkan data
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
        return; // Hentikan fungsi jika tbody tidak ada
    }
    
    // **Koreksi Penting:** Bersihkan isi tbody sebelum appendChild
    // Meskipun handleApiResponse menghapus TR loading, ini memastikan tbody benar-benar kosong.
    tbody.innerHTML = ""; 

    console.log("Memulai pengisian tabel dengan data:", data.length, "baris.");
    
    // Pastikan kita bekerja dengan Array, bukan NodeList atau sejenisnya
    const dataRows = Array.isArray(data) ? data.slice(1) : [];

    dataRows.forEach(row => {
        let belum = getBelum(row);
        const tr = document.createElement("tr");

        // row.slice(1, jobNames.length + 1) mengambil Job 1 sampai Job 7
        const jobCells = row.slice(1, jobNames.length + 1).map(v => `<td>${v}</td>`).join("");
        
        // Nilai Akhir berada di indeks 8 (yaitu jobNames.length + 1)
        const finalScore = row[jobNames.length + 1] || "-"; 

        tr.innerHTML = `
            <td>${row[0]}</td>
            ${jobCells}
            <td>
              ${belum.length === 0 
                ? "-" 
                : `<span class="badge-belum" data-nama="${row[0]}" data-belum="${belum.join(",")}">${belum.length} job</span>`
              }
            </td>
            <td>${finalScore}</td>
        `;

        tbody.appendChild(tr);
    });
    
    console.log("✅ Tabel Selesai Diisi.");

    // Event klik badge (kode tetap sama)
    document.querySelectorAll(".badge-belum").forEach(b => {
        b.addEventListener("click", () => {
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
            </td></tr>
        `;
    }
    const loadingEl = document.getElementById('loadingIndicator');

    // Buat elemen script baru
    const script = document.createElement('script');
    script.id = 'jsonp_script';
    
    // Kirim nama sheet sebagai parameter 'sheet'
    script.src = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&callback=handleApiResponse`; 
    
    document.head.appendChild(script);
}

// ==============================================================================
// 5. INISIALISASI DAN SEARCH
// ==============================================================================

// Mulai proses saat DOM siap
document.addEventListener('DOMContentLoaded', loadDataJSONP); 

// Pencarian nama
document.getElementById("searchBox").addEventListener("keyup", function () {
    const f = this.value.toLowerCase();
    document.querySelectorAll("#nilaiTable tbody tr").forEach(r => {
        r.style.display = r.children[0].textContent.toLowerCase().includes(f) ? "" : "none";
    });
});

