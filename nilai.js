// ==============================================================================
// 1. KONFIGURASI DAN URL API (WAJIB GANTI)
// ==============================================================================

// Pastikan URL ini adalah URL Apps Script API yang sudah di-deploy dengan fungsi doGet(e) JSONP
const API_URL = 'https://script.google.com/macros/s/AKfycbwswDuj1YQHP4C6fXfdEa1G1rqW6hvbx6ZCnnfsRJsHC1fb5byCpHtMmU0vIZBgoYqaPg/exec'; 

// Daftar nama job (harus sama persis dengan header di Sheets)
const jobNames = [
    "Kelistrikan dasar (Seri-Paralel)", 
    "Overhaull Motor Starter",          
    "Merangkai Kelistrikan Sistem Starter", 
    "Pemeriksaan Sistem Pengapian",     
    "Pemeriksaan Sistem Pengisian",     
    "Merangkai Kelistrikan Sistem Pengapian dan Pengisian", 
    "Merangkai Kelistrikan Sistem Penerangan" 
];

let rawData = []; // Variabel untuk menyimpan data yang sudah diubah ke format horizontal

// ==============================================================================
// 2. FUNGSI PEMROSESAN DATA & CALLBACK JSONP
// ==============================================================================

// HARUS menjadi fungsi global (ditempelkan ke window) agar dapat dipanggil oleh Apps Script API (JSONP)
window.handleApiResponse = function(data) {
    // Sembunyikan loading indicator
    const loadingEl = document.getElementById('loadingIndicator'); 
    if (loadingEl) loadingEl.style.display = 'none';

    // Menghapus tag script yang baru saja digunakan untuk membersihkan DOM
    const scriptEl = document.getElementById('jsonp_script');
    if (scriptEl) scriptEl.remove();

    // Lanjutkan dengan logika pemrosesan data
    if (data.error) {
        console.error("Apps Script Error:", data.error);
        document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">ERROR DATA: ${data.error}</p>`;
        return;
    }
    
    // 1. Transformasi data JSON vertikal ke format horizontal array 2D
    rawData = transformToHorizontal(data);
    
    // 2. Panggil loadTable untuk menampilkan data
    loadTable(rawData);
};


/**
 * Mengubah data JSON (vertikal per tugas) dari Apps Script
 * menjadi format array horizontal (satu baris per siswa) yang Anda butuhkan.
 */
function transformToHorizontal(data) {
    const students = {};
    const numJobs = jobNames.length;

    data.forEach(record => {
        const name = record.nama_siswa;
        const assignment = record.nama_tugas;
        const score = record.nilai_status;

        if (!students[name]) {
            students[name] = [name, ...Array(numJobs).fill("")]; 
        }

        // Tentukan Indeks Job (0-6)
        const jobIndex = jobNames.findIndex(job => assignment.trim() === job.trim());
        
        if (jobIndex !== -1) {
             const isMissing = (String(score).toUpperCase().includes('BELUM KUMPUL') || score === 0 || score === "");
             
             students[name][jobIndex + 1] = isMissing 
                 ? "" 
                 : score;
        }
    });

    // Kembalikan array, ditambahkan header palsu di awal
    return [["Nama", ...jobNames], ...Object.values(students)];
}


/**
 * Mengambil daftar job yang belum dikumpulkan berdasarkan baris data horizontal.
 */
function getBelum(row) {
    let belumList = [];
    // Dimulai dari indeks 1 (Job 1), hingga 7 (Job 7)
    for (let i = 1; i <= jobNames.length; i++) { 
        
        // --- KOREKSI PENTING: Ubah ke String sebelum menggunakan .trim() ---
        // Jika row[i] adalah angka (misalnya 75), String(75) akan menjadi "75".
        const cellValue = String(row[i]).trim();
        
        // Cek jika kolomnya kosong ("" yang berasal dari .trim()) atau nol ("0").
        if (cellValue === "" || cellValue === "0") {
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
    // ... (Fungsi ini tidak diubah, hanya memastikan event listener terpasang)
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) {
        console.error("Elemen #nilaiTable tbody tidak ditemukan di HTML.");
        return;
    }
    tbody.innerHTML = "";
    
    data.slice(1).forEach(row => {
        let belum = getBelum(row);
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row[0]}</td>
            ${row.slice(1, jobNames.length + 1).map(v => `<td>${v}</td>`).join("")}
            <td>
              ${belum.length === 0 
                ? "-" 
                : `<span class="badge-belum" data-nama="${row[0]}" data-belum="${belum.join(",")}">${belum.length} job</span>`
              }
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Event klik badge
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
// 4. FUNGSI INISIALISASI UTAMA (MENGGANTI loadAPI lama)
// ==============================================================================

/**
 * Fungsi utama untuk mengambil data dari Apps Script API menggunakan JSONP.
 * Ini yang menggantikan fetch().
 */
function loadDataJSONP() {
    // Tampilkan loading indicator
    const loadingEl = document.getElementById('loadingIndicator'); 
    if (loadingEl) loadingEl.style.display = 'block';

    // Buat elemen script baru
    const script = document.createElement('script');
    script.id = 'jsonp_script';
    
    // Tambahkan parameter 'callback=handleApiResponse' ke URL API
    // Ini yang membuat Apps Script tahu bahwa ia harus membungkus JSON dengan fungsi handleApiResponse
    script.src = API_URL + '?callback=handleApiResponse'; 
    
    // Tambahkan script ke dokumen untuk memicu pemuatan data
    document.head.appendChild(script);

    // *Opsional: Tambahkan Timeout Error Handler*
    setTimeout(() => {
        if (loadingEl && loadingEl.style.display !== 'none') {
            loadingEl.style.display = 'none';
            document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">Gagal memuat data (Timeout). Pastikan URL dan akses Apps Script sudah benar.</p>`;
        }
    }, 15000); // 10 detik timeout
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
