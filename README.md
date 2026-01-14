# 🩺 Medikacione Etikete - Word Export Setup

## ✅ Šta je urađeno

Prebacao sam Word export iz JavaScript-a u PHP backend. Sada će aplikacija:

1. **Koristiti postojeći Word template** (`template.docx`) ako postoji
2. **Ili kreirati novi Word** sa tabelom ako template ne postoji
3. **Automatski popuniti etikete** i omogućiti download

## 📋 Šta trebam da uradiš

### 1. Kreiraj template.docx (OPCIONO)

Ako želiš da koristiš svoj template:

- **Otvori MS Word**
- **Kreiraj template sa placeholder-ima**: `${label1}`, `${label2}`, itd. do `${label28}`
- **Snimi kao**: `template.docx` u `/Applications/XAMPP/xamppfiles/htdocs/Projekat/`

**Primer layout-a:**

```
| Etiketa 1 | Etiketa 2 | Etiketa 3 |
|-----------|-----------|-----------|
| ${label1} | ${label2} | ${label3} |
| ${label4} | ${label5} | ${label6} |
... i tako dalje (28 slotova)
```

### 2. Ili koristi automatski kreirani format

Ako nema `template.docx`, export.php će automatski kreirati Word sa tabelom:

| Soba | Pacijent | Lek | Vreme |
|------|----------|-----|-------|
| ... | ... | ... | ... |

## 🔧 Kako radi

### JavaScript (app.js)

```javascript
// Novi kod šalje etiakete na PHP
const exportData = labels.map(label => 
  `${label.room}. ${label.patient} - ${label.drug} - ${label.time}h`
);

fetch("export.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(exportData)
})
```

### PHP (export.php)

```php
// Proverava da li postoji template.docx
if (file_exists("template.docx")) {
  // Koristi TemplateProcessor
  $template = new TemplateProcessor("template.docx");
  $template->setValue("label".$i, $labels[$i-1]);
} else {
  // Kreira novu tabelu u Word-u
  $phpWord = new PhpWord();
  // ... pravi tabelu sa etiakama
}
```

## ✨ Instalovane biblioteke

- **PhpOffice/PhpWord**: Za rad sa Word fajlovima
- **Laminas/Escaper**: Sigurnost

Sve je u `/vendor/` direktorijumu.

## 🚀 Test

1. **Otvori aplikaciju** u pregledniku
2. **Dodaj nekoliko etiketa**
3. **Klikni na "📄 Exportuj Word"**
4. **Word fajl će se preuzeti**

## 📌 Napomene

- **Bez template-a**: Automatski će se kreirati Word sa tabelom
- **Sa template-om**: Koristi se TemplateProcessor za popunjavanje
- **Do 28 etiketa**: U PHP-u je konfigurisano za 28 slotova (možeš da promeniš)
- **PHP >= 5.4.0** se preporučuje

## ❓ Problemi?

Ako dobija grešku "Greška pri generisanju Word fajla":

1. Proveri da li `/vendor/` direktorijum postoji
2. Proveri PHP error log u `/Applications/XAMPP/logs/`
3. Osiguraj da je `export.php` dostupan iz preglednika
