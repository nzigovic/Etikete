// =====================
// KONSTANTE
// =====================
const MAX_LABELS = 100;
const EXPORT_COUNT = 100;

let labels = [];
let history = [];

// STANDARDNA VREMENA
const TIME_SCHEMES = {
  1: ["05"],
  2: ["05", "20"],
  3: ["05", "14", "22"],
  4: ["05", "12", "18", "22"]
};

// =====================
// ELEMENTI
// =====================
const patientInput = document.getElementById("patient");
const roomSelect = document.getElementById("room");
const drugSelect = document.getElementById("drug");
const customDrugInput = document.getElementById("customDrug");
const doseInput = document.getElementById("dose");
const frequencySelect = document.getElementById("frequency");

const smofBox = document.getElementById("smofBox");
const smofType = document.getElementById("smofType");
const smofZusatz = document.getElementById("smofZusatz");

const clexaneBox = document.getElementById("clexaneBox");
const clexaneDose = document.getElementById("clexaneDose");
const clexaneCustom = document.getElementById("clexaneCustom");

const preview = document.getElementById("preview");
const counter = document.getElementById("counter");

// =====================
// UI LOGIKA
// =====================
drugSelect.addEventListener("change", () => {
  smofBox.style.display = "none";
  clexaneBox.style.display = "none";
  customDrugInput.style.display = "none";
  frequencySelect.disabled = false;

  if (drugSelect.value === "Smof") {
    smofBox.style.display = "block";
    frequencySelect.value = "1";
    frequencySelect.disabled = true;
  }

  if (drugSelect.value === "Clexane") {
    clexaneBox.style.display = "block";
    frequencySelect.value = "2";
    frequencySelect.disabled = true;
  }

  if (drugSelect.value === "custom") {
    customDrugInput.style.display = "block";
  }
});

clexaneDose.addEventListener("change", () => {
  clexaneCustom.style.display =
    clexaneDose.value === "custom" ? "block" : "none";
});

// =====================
// DODAVANJE ETIKETA
// =====================
function addSamePatient() {
  addLabels(false);
}

function addNextPatient() {
  addLabels(true);
}

function addLabels(clearPatient) {
  if (!patientInput.value || !roomSelect.value || !drugSelect.value) {
    alert("Popuni pacijenta, sobu i lek");
    return;
  }

  history.push([...labels]);

  let drugName =
    drugSelect.value === "custom"
      ? customDrugInput.value
      : drugSelect.value;

  let dose = doseInput.value;
  let times = TIME_SCHEMES[frequencySelect.value];

  if (drugSelect.value === "Smof") {
    times = ["20"];
    drugName = smofType.value;
    if (smofZusatz.checked) {
      addSingleLabel("+ Zusatz", "20");
    }
  }

  if (drugSelect.value === "Clexane") {
    times = ["08", "20"];
    dose =
      clexaneDose.value === "custom"
        ? clexaneCustom.value
        : clexaneDose.value;
  }

  times.forEach(time => {
    addSingleLabel(`${drugName} ${dose}`, time);
  });

  if (clearPatient) {
    patientInput.value = "";
    roomSelect.value = "";
  }

  render();
}

function addSingleLabel(drugText, time) {
  if (labels.length >= MAX_LABELS) return;

  labels.push({
    patient: patientInput.value,
    room: roomSelect.value,
    drug: drugText,
    time
  });
}

// =====================
// RENDER (BEZ INLINE JS)
// =====================
function render() {
  preview.innerHTML = "";

  for (let i = 0; i < MAX_LABELS; i++) {
    if (labels[i]) {
      const l = labels[i];
      preview.innerHTML += `
        <div class="label filled">
          <strong>${l.room}. ${l.patient}</strong>
          ${l.drug}<br>
          ${l.time} Uhr
        </div>
      `;
    } else {
      preview.innerHTML += `<div class="label empty"></div>`;
    }
  }

  counter.textContent = `${labels.length} / ${MAX_LABELS}`;
}

// =====================
// COPY – KLIK NA ETIKETU
// =====================
preview.addEventListener("click", (e) => {
  const label = e.target.closest(".label.filled");
  if (!label) return;

  const text = label.innerText.trim();
  navigator.clipboard.writeText(text);

  // ukloni zeleno sa drugih etiketa
  document.querySelectorAll(".label.copied")
    .forEach(el => el.classList.remove("copied"));

  // dodaj zeleno na kliknutu
  label.classList.add("copied");

  // ukloni posle 1 sekunde
  setTimeout(() => {
    label.classList.remove("copied");
  }, 1000);
});

// =====================
// UNDO / RESET
// =====================
function undo() {
  if (!history.length) return;
  labels = history.pop();
  render();
}

function resetAll() {
  if (!confirm("Obrisati sve etikete?")) return;
  labels = [];
  history = [];
  render();
}

// =====================
// EXPORT PDF
// =====================
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  // Dimenzije etikete u mm (50x50mm je standard)
  const labelWidth = 50;
  const labelHeight = 50;
  
  // Margina i broj kolona/redova
  const margin = 5;
  const cols = 3;
  const rows = 5;
  const labelsPerPage = cols * rows;

  let labelIndex = 0;
  let pageNum = 0;

  while (labelIndex < labels.length) {
    if (pageNum > 0) pdf.addPage();
    pageNum++;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (labelIndex >= labels.length) break;

        const l = labels[labelIndex];
        const x = margin + col * (labelWidth + margin);
        const y = margin + row * (labelHeight + margin);

        // Granica etikete
        pdf.rect(x, y, labelWidth, labelHeight);

        // Tekst
        pdf.setFontSize(8);
        pdf.text(`${l.room}. ${l.patient}`, x + 2, y + 8, { maxWidth: labelWidth - 4 });
        
        pdf.setFontSize(7);
        pdf.text(l.drug, x + 2, y + 18, { maxWidth: labelWidth - 4 });
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, "bold");
        pdf.text(`${l.time}h`, x + 2, y + 40);

        labelIndex++;
      }
    }
  }

  pdf.save("etikete.pdf");
}
patientInput.addEventListener("input", () => {
  const value = patientInput.value;
  if (!value) return;

  patientInput.value =
    value.charAt(0).toUpperCase() + value.slice(1);
});

// =====================
// INIT
// =====================
render();