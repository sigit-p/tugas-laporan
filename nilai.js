// GANTI dengan link CSV hasil "Publish to Web" dari Google Sheets
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqs_Eed9wnvgrHralGoxXe8VfzUsoTGAASCMwfCbzi4n7jtJhMyoQnBfhx0KTBEQ/pub?gid=1587510872&single=true&output=csv";

// Daftar nama job (ditampilkan saat popup)
const jobNames = [
    "Kelistrikan Dasar (Seri–Paralel)",
    "Overhaul Motor Starter",
    "Merangkai Sistem Starter",
    "Pemeriksaan Pengapian",
    "Pemeriksaan Pengisian",
    "Rangkaian Pengapian & Pengisian",
    "Rangkaian Penerangan"
];

function loadCSV(url) {
    return fetch(url).then(r => r.text());
}

function parseCSV(text) {
    return text.trim().split("\n").map(r => r.split(","));
}

function getBelum(row) {
    let belumList = [];
    for (let i = 1; i <= 7; i++) {
        if (row[i].trim() === "" || row[i].trim() === "0") {
            belumList.push(i);
        }
    }
    return belumList;
}

function showPopup(nama, jobBelum) {
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

    overlay.addEventListener("click", () => {
        overlay.remove();
    });

    document.body.appendChild(overlay);
}

function loadTable(data) {
    const tbody = document.querySelector("#nilaiTable tbody");
    tbody.innerHTML = "";

    data.slice(1).forEach(row => {
        let belum = getBelum(row);
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${row[0]}</td>
            ${row.slice(1, 8).map(v => `<td>${v}</td>`).join("")}
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

// Load CSV
loadCSV(sheetURL).then(text => loadTable(parseCSV(text)));

// Pencarian nama
document.getElementById("searchBox").addEventListener("keyup", function () {
    const f = this.value.toLowerCase();
    document.querySelectorAll("#nilaiTable tbody tr").forEach(r => {
        r.style.display = r.children[0].textContent.toLowerCase().includes(f) ? "" : "none";
    });
});
