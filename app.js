// =====================
// KONSTANTE
// =====================
const MAX_LABELS = 32;
const EXPORT_COUNT = 28;

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
const exportBtn = document.getElementById("exportWord");

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
// RENDER
// =====================
function render() {
  preview.innerHTML = "";

  for (let i = 0; i < MAX_LABELS; i++) {
    if (labels[i]) {
      preview.innerHTML += `
        <div class="label filled">
          <div><strong>${labels[i].room}. ${labels[i].patient}</strong></div>
          <div>${labels[i].drug}</div>
          <div>${labels[i].time} Uhr</div>
        </div>`;
    } else {
      preview.innerHTML += `<div class="label empty"></div>`;
    }
  }

  counter.textContent = `${labels.length} / ${MAX_LABELS}`;
}

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
// EXPORT U WORD (RADI)
// =====================


document.getElementById("exportWord").addEventListener("click", () => {
  fetch("export.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(labels.slice(0, 28))
  })
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "etikete.docx";
    a.click();
    URL.revokeObjectURL(url);
  });
}); 
// INIT
render();




