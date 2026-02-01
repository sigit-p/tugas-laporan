// ==============================================================================
// 3. FUNGSI TAMPILAN (POPUPS & TABLE)
// ==============================================================================

function showPopup(nama, jobBelum) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const box = document.createElement("div");
    box.className = "popup-box";

    let html = `<h3>${nama}</h3>`;
    html += "<p>Belum mengumpulkan laporan:</p><ul>";

    // PENGGUNAAN currentJobNames
    jobBelum.forEach(i => {
        // i-1 karena jobBelum berisi indeks 1-7, sedangkan array mulai dari 0
        const namaJob = currentJobNames[i - 1] || `Job ${i}`;
        html += `<li><b>Job ${i}:</b> ${namaJob}</li>`;
    });

    html += "</ul><p style='font-size:0.8em; color:gray;'>Klik di luar kotak untuk menutup</p>";

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
    const jobCount = currentJobNames.length; // Biasanya 7
    
    dataRows.forEach(row => {
        // Berdasarkan kode GS: row[0]=Nama, row[1-7]=Jobs, row[8]=BelumCount, row[9]=NilaiAkhir
        const belumCount = parseInt(row[jobCount + 1]) || 0; 
        let belumList = getBelum(row); 

        // 1. Olah Sel Job (Job 1 - Job 7) dengan pewarnaan
        const jobCells = row.slice(1, jobCount + 1).map(v => {
            let cellValue = String(v).trim();
            let style = "";
            
            if (cellValue !== "" && !isNaN(cellValue) && cellValue !== "0") {
                let num = parseFloat(cellValue);
                if (num < 75) {
                    // Merah jika di bawah KKM
                    style = 'style="color: #dc3545; font-weight: bold; background-color: #fff5f5; border: 1px solid #ffc1c1;"';
                } else {
                    // Hijau jika tuntas
                    style = 'style="color: #28a745; font-weight: bold;"';
                }
            }
            return `<td ${style} class="text-center">${cellValue || "-"}</td>`;
        }).join("");
        
        // 2. Olah Nilai Akhir dengan warna background
        const finalScore = row[jobCount + 2];
        let finalBadgeStyle = "";
        
        if (finalScore !== "" && !isNaN(finalScore)) {
            let fs = parseFloat(finalScore);
            if (fs > 0) {
                if (fs < 75) {
                    finalBadgeStyle = 'style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; min-width: 40px;"';
                } else {
                    finalBadgeStyle = 'style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; display: inline-block; min-width: 40px;"';
                }
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="fw-bold">${row[0]}</td>
            ${jobCells}
            <td class="text-center">
              ${belumCount === 0 
                ? '<span class="badge bg-success" style="cursor:default;">LUNAS</span>' 
                : `<span class="badge-belum" style="cursor:pointer; background:#ffc107; color:#000; padding:2px 8px; border-radius:10px; font-weight:bold;" data-nama="${row[0]}" data-belum="${belumList.join(",")}">${belumCount} job</span>`
              }
            </td>
            <td class="text-center fw-bold">
                <span ${finalBadgeStyle}>${finalScore || "0"}</span>
            </td>
        `;

        tbody.appendChild(tr);
    });
    
    // Pasang ulang Event Listener Popup untuk Badge Belum
    document.querySelectorAll(".badge-belum").forEach(b => {
        b.addEventListener("click", (e) => {
            e.stopPropagation(); 
            const nama = b.getAttribute("data-nama");
            const dataBelum = b.getAttribute("data-belum");
            const belumArr = dataBelum ? dataBelum.split(",").map(n => parseInt(n)) : [];
            showPopup(nama, belumArr);
        });
    });
}
