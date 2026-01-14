// =====================
// KONSTANTE
// =====================
const MAX_LABELS = 79;
const TIME_SCHEMES = {
  1: ["05"],
  2: ["05", "20"],
  3: ["05", "14", "22"],
  4: ["05", "12", "18", "22"]
};

// PDF EXPORT CONFIG
const PDF_CONFIG = {
  labelWidth: 50,
  labelHeight: 50,
  margin: 5,
  cols: 3,
  rows: 5,
  fontSize: { name: 8, drug: 7, time: 10 }
};

// How many empty placeholder slots to show at most for performance
const VISIBLE_EMPTY_SLOTS = 20;

// =====================
// DOM ELEMENTI
// =====================
const DOM = {
  patient: document.getElementById("patient"),
  room: document.getElementById("room"),
  drug: document.getElementById("drug"),
  customDrug: document.getElementById("customDrug"),
  dose: document.getElementById("dose"),
  frequency: document.getElementById("frequency"),
  smofBox: document.getElementById("smofBox"),
  smofType: document.getElementById("smofType"),
  smofZusatz: document.getElementById("smofZusatz"),
  clexaneBox: document.getElementById("clexaneBox"),
  clexaneDose: document.getElementById("clexaneDose"),
  clexaneCustom: document.getElementById("clexaneCustom"),
  jonoBox: document.getElementById("jonoBox"),
  jono1L: document.getElementById("jono1L"),
  jono500: document.getElementById("jono500"),
  preview: document.getElementById("preview"),
  counter: document.getElementById("counter")
};

// STATE
let labels = [];
let history = [];
let inputTimeout = null;

// =====================
// LOCALSTORAGE - AUTO SAVE
// =====================
const STORAGE_KEY = "medikacione_etikete";

function saveLabels() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
}

// Debounced save to avoid frequent localStorage writes
const SAVE_DEBOUNCE_MS = 300;
let _saveTimeout = null;
function scheduleSave() {
  clearTimeout(_saveTimeout);
  _saveTimeout = setTimeout(() => saveLabels(), SAVE_DEBOUNCE_MS);
}

// Ensure saved on unload
window.addEventListener('beforeunload', () => saveLabels());

function loadLabels() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      labels = JSON.parse(saved);
    } catch (error) {
      console.error("Greška pri učitavanju:", error);
      labels = [];
    }
  }
}

// =====================
// NOTIFICATIONS (LEPE PORUKE)
// =====================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Ukloni nakon 4 sekunde
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Inline field error helpers
function clearFieldErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.remove());
}

function showFieldError(inputEl, message) {
  clearFieldErrors();
  const err = document.createElement('span');
  err.className = 'field-error';
  err.textContent = message;
  inputEl.insertAdjacentElement('afterend', err);
}

/**
 * showConfirm - displays a custom confirmation modal
 * @param {string} message - message to show
 * @returns {Promise<boolean>} resolves true if confirmed, false otherwise
 */
function showConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";

    const modal = document.createElement("div");
    modal.className = "confirm-modal";

    modal.innerHTML = `
      <div class="confirm-title">🗑️ <strong>Potvrdite brisanje</strong></div>
      <div class="confirm-body">${message}</div>
      <div class="confirm-actions">
        <button class="btn-cancel">Otkaži</button>
        <button class="btn-confirm">Obriši</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const btnCancel = modal.querySelector('.btn-cancel');
    const btnConfirm = modal.querySelector('.btn-confirm');

    function clean(updating) {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
      resolve(updating);
    }

    function onKey(e) {
      if (e.key === 'Escape') clean(false);
      if (e.key === 'Enter') { e.preventDefault(); clean(true); }
    }

    // click outside closes
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) clean(false);
    });

    btnCancel.addEventListener('click', () => clean(false));
    btnConfirm.addEventListener('click', () => clean(true));

    document.addEventListener('keydown', onKey);

    // focus confirm for quick keyboard usage
    btnConfirm.focus();
  });
}

// =====================
// UI LOGIKA
// =====================
function handleDrugChange() {
  const drug = DOM.drug.value;
  
  // Resetuj sve opcije
  DOM.smofBox.style.display = "none";
  DOM.clexaneBox.style.display = "none";
  DOM.customDrug.style.display = "none";
  DOM.jonoBox.style.display = "none";
  DOM.frequency.disabled = false;

  // Prikazi relevantne opcije
  const drugConfig = {
    "Smof": () => {
      DOM.smofBox.style.display = "block";
      DOM.frequency.value = "1";
      DOM.frequency.disabled = true;
    },
    "Clexane": () => {
      DOM.clexaneBox.style.display = "block";
      DOM.frequency.value = "2";
      DOM.frequency.disabled = true;
    },
    "Jono": () => {
      DOM.jonoBox.style.display = "block";
      // default to 1L when shown if nothing selected
      if (DOM.jono1L && DOM.jono500 && !DOM.jono1L.checked && !DOM.jono500.checked) {
        DOM.jono1L.checked = true;
      }
    },
    "custom": () => {
      DOM.customDrug.style.display = "block";
    }
  };

  drugConfig[drug]?.();
}

function handleClexaneDoseChange() {
  DOM.clexaneCustom.style.display = DOM.clexaneDose.value === "custom" ? "block" : "none";
}

function handlePatientInput() {
  clearTimeout(inputTimeout);
  inputTimeout = setTimeout(() => {
    const value = DOM.patient.value.trim();
    if (value) {
      DOM.patient.value = value.charAt(0).toUpperCase() + value.slice(1);
    }
  }, 200);
}

// Inicijalizuj event listenere
DOM.drug.addEventListener("change", handleDrugChange);
DOM.clexaneDose.addEventListener("change", handleClexaneDoseChange);
DOM.patient.addEventListener("input", handlePatientInput);

// =====================
// VALIDACIJA
// =====================
function validateInput() {
  clearFieldErrors();

  // per-field validation with inline errors
  if (!DOM.patient.value.trim()) {
    showFieldError(DOM.patient, "Unesite pacijenta");
    DOM.patient.focus();
    return false;
  }

  if (!DOM.room.value) {
    showFieldError(DOM.room, "Izaberite sobu");
    DOM.room.focus();
    return false;
  }

  if (!DOM.drug.value) {
    showFieldError(DOM.drug, "Izaberite lek");
    DOM.drug.focus();
    return false;
  }

  if (DOM.drug.value === "custom" && !DOM.customDrug.value.trim()) {
    showFieldError(DOM.customDrug, "Unesite naziv leka");
    DOM.customDrug.focus();
    return false;
  }

  return true;
}

// =====================
// DODAVANJE ETIKETA
// =====================
function addSamePatient() {
  addLabels(false);
}

function addNextPatient() {
  addLabels(true);
}

function getDrugConfig() {
  const drug = DOM.drug.value;
  let times = TIME_SCHEMES[DOM.frequency.value];
  let drugName = drug === "custom" ? DOM.customDrug.value : drug;
  let dose = DOM.dose.value;

  if (drug === "Smof") {
    times = ["20"];
    drugName = DOM.smofType.value;
  } else if (drug === "Clexane") {
    times = ["08", "20"];
    dose = DOM.clexaneDose.value === "custom" ? DOM.clexaneCustom.value : DOM.clexaneDose.value;
  }

  // Jono - izbor zapremine (1L ili 500ml)
  if (drug === "Jono") {
    // prefer radio buttons, fallback to dose input
    if (DOM.jono1L && DOM.jono1L.checked) dose = "1L";
    else if (DOM.jono500 && DOM.jono500.checked) dose = "500ml";
    else if (!dose) dose = "1L";
  }

  return { times, drugName, dose };
}

function addLabels(clearPatient) {
  if (!validateInput()) return;

  history.push([...labels]);

  const { times, drugName, dose } = getDrugConfig();

  times.forEach(time => {
    addSingleLabel(`${drugName} ${dose}`, time);
  });

  if (DOM.drug.value === "Smof" && DOM.smofZusatz.checked) {
    addSingleLabel("+ Zusatz", "20");
  }

  if (clearPatient) {
    DOM.patient.value = "";
    DOM.room.value = "";
  }

  render();
  scheduleSave(); // debounced save
}

function addSingleLabel(drugText, time) {
  if (labels.length >= MAX_LABELS) {
    showNotification(`Maksimalan broj etiketa (${MAX_LABELS}) je dostignut! Morate da odštampate pre nego što nastavite.`, "warning");
    return;
  }

  labels.push({
    patient: DOM.patient.value.trim(),
    room: DOM.room.value,
    drug: drugText.trim(),
    time
  });
}

// =====================
// RENDER (OPTIMIZOVANO)
// =====================
function render() {
  const fragment = document.createDocumentFragment();

  // Render filled labels only
  for (let i = 0; i < labels.length; i++) {
    const l = labels[i];
    const div = document.createElement("div");
    div.className = "label filled";
    div.innerHTML = `<strong>${l.room}. ${l.patient}</strong>${l.drug}<br>${l.time} Uhr`;
    fragment.appendChild(div);
  }

  // Render a limited number of empty placeholders for visual balance
  const emptyToShow = Math.min(VISIBLE_EMPTY_SLOTS, Math.max(0, MAX_LABELS - labels.length));
  for (let i = 0; i < emptyToShow; i++) {
    const div = document.createElement("div");
    div.className = "label empty";
    fragment.appendChild(div);
  }

  DOM.preview.innerHTML = "";
  DOM.preview.appendChild(fragment);
  DOM.counter.textContent = `${labels.length} / ${MAX_LABELS}`;
}

// =====================
// COPY – KLIK NA ETIKETU
// =====================
function handleLabelClick(e) {
  const label = e.target.closest(".label.filled");
  if (!label) return;

  const text = label.innerText.trim();
  
  navigator.clipboard.writeText(text).then(() => {
    // Ukloni highlight sa svih
    document.querySelectorAll(".label.copied").forEach(el => el.classList.remove("copied"));
    
    // Dodaj na kliknutu
    label.classList.add("copied");
    
    // Ukloni nakon 1 sekunde
    setTimeout(() => label.classList.remove("copied"), 1000);
  }).catch(err => console.error("Greška pri kopiranju:", err));
}

DOM.preview.addEventListener("click", handleLabelClick);

// =====================
// UNDO / RESET
// =====================
function undo() {
  if (history.length === 0) {
    showNotification("Nema šta da se vrati", "info");
    return;
  }
  labels = history.pop();
  render();
  scheduleSave(); // debounced save
}

async function resetAll() {
  const confirmed = await showConfirm("Obrisati sve etikete? Ovo se ne može poništiti.");
  if (!confirmed) return;
  labels = [];
  history = [];
  render();
  scheduleSave(); // debounced save
  showNotification("Sve etikete su obrisane", "info");
}

// =====================
// EXPORT PDF (LEPA TABELA SA REDNIM BROJEVIMA)
// =====================
function exportPDF() {
  if (labels.length === 0) {
    showNotification("Nema etiaketa za export", "error");
    return;
  }

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    // Margin i dimenzije
    const marginTop = 15;
    const marginLeft = 12;
    const marginRight = 12;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - marginLeft - marginRight;

    let y = marginTop;
    let pageNum = 1;

    // Naslov
    pdf.setFontSize(16);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(102, 126, 234);
    pdf.text("Medikacione Etikete", marginLeft, y);
    y += 8;

    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Generisano: ${new Date().toLocaleDateString("sr-RS")} | Ukupno: ${labels.length} etiaketa`, marginLeft, y);
    y += 10;

    // Zaglavlje tabele
    const colWidths = [12, 40, 60, 40];
    const rowHeight = 8;

    function drawTableHeader() {
      // Zaglavlje - CRNA boja sa belim tekstom
      pdf.setFillColor(30, 41, 59);
      pdf.setDrawColor(50, 50, 50);
      pdf.setLineWidth(0.5);
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(9);

      let x = marginLeft;
      const headers = ["#", "Soba", "Pacijent", "Lek"];
      
      colWidths.forEach((width, i) => {
        pdf.rect(x, y, width, rowHeight, "FD");
        pdf.text(headers[i], x + 2, y + 6);
        x += width;
      });

      // Vreme
      pdf.rect(x, y, contentWidth - (x - marginLeft), rowHeight, "FD");
      pdf.text("Vreme", x + 2, y + 6);

      y += rowHeight;
    }

    drawTableHeader();

    // Crtaj redove
    let rowCount = 0;
    labels.forEach((label, index) => {
      // Provera da li treba nova stranica
      if (y > pageHeight - 20) {
        pdf.addPage();
        pageNum++;
        y = marginTop;
        drawTableHeader();
      }

      // Alternativna boja redova - SVETLA pozadina
      if (rowCount % 2 === 0) {
        pdf.setFillColor(240, 245, 255); // Svetla plava
      } else {
        pdf.setFillColor(255, 255, 255); // Bela
      }

      // Crtaj red
      let x = marginLeft;
      const rowData = [String(index + 1), label.room, label.patient, label.drug];
      
      pdf.setDrawColor(200, 210, 235); // Svetla plava granica
      pdf.setLineWidth(0.3);
      pdf.setTextColor(0, 0, 0); // CRNI tekst
      pdf.setFont(undefined, "normal");
      pdf.setFontSize(8);

      rowData.forEach((data, i) => {
        pdf.setFillColor(rowCount % 2 === 0 ? 240 : 255, rowCount % 2 === 0 ? 245 : 255, rowCount % 2 === 0 ? 255 : 255);
        pdf.rect(x, y, colWidths[i], rowHeight, "FD");
        pdf.setTextColor(0, 0, 0); // CRNI tekst
        
        let text = data;
        if (data.length > 15) {
          text = data.substring(0, 12) + "...";
        }
        pdf.text(text, x + 2, y + 6);
        x += colWidths[i];
      });

      // Vreme u posebnoj koloni - svetla zelena pozadina sa crnim tekstom
      pdf.setFillColor(200, 245, 200); // Svetla zelena
      pdf.rect(x, y, contentWidth - (x - marginLeft), rowHeight, "FD");
      
      pdf.setTextColor(0, 0, 0); // CRNI tekst
      pdf.setFont(undefined, "bold");
      pdf.setFontSize(9);
      pdf.text(`${label.time}h`, x + 5, y + 6);

      y += rowHeight;
      rowCount++;
    });

    // Donji deo - informacije
    y += 5;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont(undefined, "normal");
    pdf.text(`Stranica ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: "center" });

    pdf.save(`medikacione_etikete_${new Date().getTime()}.pdf`);
    showNotification(`✅ PDF sa ${labels.length} etiaketa je preuzet!`, "success");

  } catch (error) {
    console.error("Greška pri generisanju PDF-a:", error);
    showNotification("Greška pri generisanju PDF-a. Proverite konzolu.", "error");
  }
}

// =====================
// EXPORT WORD
// =====================
function exportWord() {
  if (labels.length === 0) {
    showNotification("Nema etiaketa za export", "error");
    return;
  }

  // Pripremi podatke za PHP - Formatujem svaku etiketu kao string
  const exportData = labels.map(label => 
    `${label.room}. ${label.patient} - ${label.drug} - ${label.time}h`
  );

  console.log("Slanje na export.php:", exportData);

  // Pošalji na PHP backend
  fetch("export.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(exportData)
  })
  .then(response => {
    console.log("Odgovor sa servera:", response.status, response.statusText);
    
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`HTTP Error ${response.status}: ${text}`);
      });
    }
    return response.blob();
  })
  .then(blob => {
    console.log("Preuzet blob:", blob.size, "bajtova");
    
    // Kreiraj download link i preuzmi fajl
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medikacione_etikete_${new Date().getTime()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showNotification(`✅ Word sa ${labels.length} etiaketa je preuzet!`, "success");
  })
  .catch(error => {
    console.error("Greška pri export-u:", error);
    showNotification(`Greška: ${error.message}`, "error");
  });
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
  // Učitaj sačuvane etikete
  loadLabels();
  render();
  
  // Dodaj event listener za Word export
  const exportWordBtn = document.getElementById("exportWord");
  if (exportWordBtn) {
    exportWordBtn.addEventListener("click", exportWord);
  }
  
  console.log("Aplikacija je učitana");
});