// GANTI dengan link CSV hasil "Publish to Web" dari Google Sheets
const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRqs_Eed9wnvgrHralGoxXe8VfzUsoTGAASCMwfCbzi4n7jtJhMyoQnBfhx0KTBEQ/pub?output=csv";

function loadCSV(url) {
    return fetch(url).then(response => response.text());
}

function parseCSV(text) {
    return text.trim().split("\n").map(r => r.split(","));
}

function hitungBelum(row) {
    let count = 0;
    for (let i = 1; i <= 7; i++) {
        if (row[i].trim() === "0" || row[i].trim() === "") {
            count++;
        }
    }
    return count === 0 ? "-" : count + " job";
}

function tampilkanData(data) {
    const table = document.querySelector("#nilaiTable tbody");
    table.innerHTML = "";

    data.slice(1).forEach(row => {
        if (row.length < 8) return;

        const belum = hitungBelum(row);

        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${row[3]}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
          <td>${row[6]}</td>
          <td>${row[7]}</td>
          <td>${belum !== '-' ? `<span class="badge-belum">${belum}</span>` : '-'}</td>
        `;

        table.appendChild(tr);
    });
}

loadCSV(sheetURL).then(text => {
    const data = parseCSV(text);
    tampilkanData(data);
});

// Pencarian nama
document.getElementById("searchBox").addEventListener("keyup", function () {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#nilaiTable tbody tr");

    rows.forEach(row => {
        const nama = row.children[0].textContent.toLowerCase();
        row.style.display = nama.includes(filter) ? "" : "none";
    });
});
