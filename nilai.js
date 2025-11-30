// ==============================================================================
// 1. KONFIGURASI DAN URL API (WAJIB GANTI)
// ==============================================================================

// GANTI URL INI dengan URL Apps Script API yang sudah Anda deploy
const API_URL = 'https://script.google.com/macros/s/AKfycbxYJmGSPcGtII1YhcMAyUgp63wZZU3Voc-iqr9TX_cLO4LFxxLsxaiNR7DWGYHH0xp4/exec'; 

// Daftar nama job (ditampilkan saat popup). Ini harus urut sesuai kolom di Sheets (E, F, G, H, I, J, K)
// Kita gunakan nama yang lebih pendek untuk memastikan match dengan data header dari Sheet.
const jobNames = [
    "Kelistrikan dasar (Seri-Paralel)", // Job 1 (Kolom E)
    "Overhaull Motor Starter",          // Job 2 (Kolom F)
    "Merangkai Kelistrikan Sistem Starter", // Job 3 (Kolom G)
    "Pemeriksaan Sistem Pengapian",     // Job 4 (Kolom H)
    "Pemeriksaan Sistem Pengisian",     // Job 5 (Kolom I)
    "Merangkai Kelistrikan Sistem Pengapian dan Pengisian", // Job 6 (Kolom J)
    "Merangkai Kelistrikan Sistem Penerangan" // Job 7 (Kolom K)
];

let rawData = []; // Variabel untuk menyimpan data yang sudah diubah ke format horizontal

// ==============================================================================
// 2. FUNGSI PEMROSESAN DATA (API ke Horizontal)
// ==============================================================================

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
            // Inisialisasi: Nama siswa + 7 kolom kosong (untuk 7 job)
            students[name] = [name, ...Array(numJobs).fill("")]; 
        }

        // Tentukan Indeks Job (0-6)
        const jobIndex = jobNames.findIndex(job => assignment.trim() === job.trim());
        
        // Indeks array di students[name] adalah [0]=Nama, [1]=Job1, [2]=Job2, dst.
        // jobIndex dari findIndex dimulai dari 0, jadi perlu +1 untuk array students[name].
        if (jobIndex !== -1) {
             const isMissing = (String(score).toUpperCase().includes('BELUM KUMPUL') || score === 0 || score === "");
             
             students[name][jobIndex + 1] = isMissing 
                 ? "" // Jika Belum Kumpul/Kosong, kembalikan string kosong
                 : score;
        }
    });

    // Kembalikan array, ditambahkan header palsu di awal (karena loadTable mengabaikan baris pertama)
    return [["Nama", ...jobNames], ...Object.values(students)];
}


/**
 * Mengambil daftar job yang belum dikumpulkan berdasarkan baris data horizontal.
 * (Logika ini dipertahankan dari kode Anda sebelumnya).
 */
function getBelum(row) {
    let belumList = [];
    // Dimulai dari indeks 1 (Job 1), hingga 7 (Job 7)
    for (let i = 1; i <= jobNames.length; i++) { 
        // Cek jika kolomnya kosong.
        if (row[i].trim() === "" || row[i].trim() === "0") {
            belumList.push(i);
        }
    }
    return belumList;
}

// ==============================================================================
// 3. FUNGSI TAMPILAN (POPUPS)
// ==============================================================================

function showPopup(nama, jobBelum) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const box = document.createElement("div");
    box.className = "popup-box";

    let html = `<h3>${nama}</h3>`;
    html += "<p>Belum mengumpulkan:</p><ul>";

    jobBelum.forEach(i => {
        // i - 1 untuk mendapatkan nama job dari array jobNames
        html += `<li>${i}. ${jobNames[i - 1]}</li>`; 
    });

    html += "</ul>";

    box.innerHTML = html;
    overlay.appendChild(box);

    overlay.addEventListener("click", (e) => {
        // Hanya hapus overlay jika klik bukan pada box (untuk mencegah penutupan saat mencoba scroll)
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    document.body.appendChild(overlay);
}

// ==============================================================================
// 4. FUNGSI UTAMA (LOAD DATA & RENDER TABLE)
// ==============================================================================

/**
 * Menggambar ulang tabel berdasarkan data horizontal.
 * (Logika ini dipertahankan dari kode Anda sebelumnya).
 */
function loadTable(data) {
    const tbody = document.querySelector("#nilaiTable tbody");
    if (!tbody) {
        console.error("Elemen #nilaiTable tbody tidak ditemukan di HTML.");
        return;
    }
    tbody.innerHTML = "";
    
    // Asumsi baris pertama adalah header, kita mulai dari slice(1)
    data.slice(1).forEach(row => {
        let belum = getBelum(row);
        const tr = document.createElement("tr");

        // row.slice(1, jobNames.length + 1) untuk mengambil 7 nilai job saja
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

/**
 * Fungsi utama untuk mengambil data dari Apps Script API.
 */
function loadAPI() {
    // Tampilkan loading indicator jika ada
    const loadingEl = document.getElementById('loadingIndicator'); // Asumsi ada elemen loading
    if (loadingEl) loadingEl.style.display = 'block';

    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal mengambil data dari API Apps Script. Status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (loadingEl) loadingEl.style.display = 'none';

            if (data.error) {
                 console.error("Apps Script Error:", data.error);
                 // Tampilkan pesan error ke user
                 document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">ERROR DATA: ${data.error}</p>`;
                 return;
            }
            
            // 1. Transformasi data JSON vertikal ke format horizontal array 2D
            rawData = transformToHorizontal(data);
            
            // 2. Panggil loadTable dengan data yang sudah diubah
            loadTable(rawData);
        })
        .catch(error => {
            if (loadingEl) loadingEl.style.display = 'none';
            console.error('Fetch Error:', error);
            document.getElementById("nilaiTable").innerHTML = `<p style="color:red;">Gagal memuat data. Pastikan URL API sudah benar.</p>`;
        });
}


// ==============================================================================
// 5. INISIALISASI DAN SEARCH
// ==============================================================================

// Mulai proses saat DOM siap
document.addEventListener('DOMContentLoaded', loadAPI); 

// Pencarian nama
document.getElementById("searchBox").addEventListener("keyup", function () {
    const f = this.value.toLowerCase();
    document.querySelectorAll("#nilaiTable tbody tr").forEach(r => {
        // Asumsi: Nama siswa ada di children[0]
        r.style.display = r.children[0].textContent.toLowerCase().includes(f) ? "" : "none";
    });
});
