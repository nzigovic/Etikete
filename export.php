
<?php
require 'auth.php';
require_login();
enforce_session_timeout();

// Maksimalan broj etiketa
define('MAX_LABELS', 79);
// Očisti output buffer
ob_start();
require 'vendor/autoload.php';
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\TemplateProcessor;
// Preuzmi JSON podatke
$json = file_get_contents("php://input");

$labels = json_decode($json, true);

// Ograniči broj etiketa na MAX_LABELS
if (is_array($labels) && count($labels) > MAX_LABELS) {
    ob_end_clean();
    http_response_code(400);
    header("Content-Type: text/plain");
    die("Maksimalan broj etiketa je " . MAX_LABELS . ". Morate da odštampate pre nego što nastavite!");
}

if (empty($labels)) {
    ob_end_clean();
    http_response_code(400);
    header("Content-Type: text/plain");
    die("Nema podataka za export");
}

try {
    $filename = "etikete_" . time() . ".docx";
    
    // UVEK koristi template.docx ako postoji
    if (file_exists("template.docx") && is_array($labels)) {
        // Pripremi temp folder koji je 100% dostupan
        $myTemp = __DIR__ . '/temp/';
        if (!is_dir($myTemp)) { @mkdir($myTemp, 0777, true); }
        @chmod($myTemp, 0777);
        putenv('TMPDIR=' . $myTemp);

        $template = new TemplateProcessor("template.docx");
        // Pronađi maksimalni broj placeholdera u template-u
        $maxLabels = MAX_LABELS;
        $maxLabels = 0;
        if (!empty($matches[1])) {
            $maxLabels = max(array_map('intval', $matches[1]));
        } else {
            $maxLabels = 28; // fallback ako ne može da pročita
        }
// ===== SAFE LABEL REPLACEMENT LOOP =====
for ($i = 1; $i <= MAX_LABELS; $i++) {
    if (array_key_exists($i - 1, $labels)) {
        $value = $labels[$i - 1];
        if (is_array($value)) {
            $value = implode(PHP_EOL, $value);
        }
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
        $template->setValue("label" . $i, trim($value));
    } else {
        $template->setValue("label" . $i, " ");
    }
}

// ===== SAFE DOCX OUTPUT =====
ob_end_clean();

$tmpFile = tempnam($myTemp, 'etikete_') . '.docx';
$template->saveAs($tmpFile);

$fileContent = file_get_contents($tmpFile);
unlink($tmpFile);

header("Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document");
header("Content-Disposition: attachment; filename=\"$filename\"");
header("Cache-Control: no-cache, must-revalidate");
header("Pragma: no-cache");

echo $fileContent;
exit;
    } else {
        ob_end_clean();
        http_response_code(500);
        header("Content-Type: text/plain");
        die("Greska: Nema template.docx u folderu!");
    }
    
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    header("Content-Type: text/plain");
    die("Greska: " . $e->getMessage());
}
?>
