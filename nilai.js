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
