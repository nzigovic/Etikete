<?php
chdir('/Applications/XAMPP/xamppfiles/htdocs/Projekat');
require 'vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;

$labels = ['Soba 1 - Marko - Aspirin - 08:00', 'Soba 2 - Jelena - Metformin - 12:00'];

echo "=== TEST XAMPP TEMP DIREKTORIJUM ===\n\n";

// Test 1: Template sa XAMPP temp
echo "📋 TEST 1: Template sa /Applications/XAMPP/temp/\n";
try {
    $xamppTemp = '/Applications/XAMPP/temp/';
    @mkdir($xamppTemp, 0777, true);
    @chmod($xamppTemp, 0777);
    
    echo "📁 Provera direktorijuma: " . (is_writable($xamppTemp) ? '✓ dostupan' : '✗ NIJE dostupan') . "\n";
    
    $template = new TemplateProcessor('template.docx');
    $template->setValue('label1', $labels[0]);
    $template->setValue('label2', $labels[1]);
    
    $tempfile = $xamppTemp . uniqid('docx_', true) . '.docx';
    echo "💾 Temp fajl: " . basename($tempfile) . "\n";
    
    $template->saveAs($tempfile);
    echo "✓ Sačuvano\n";
    
    usleep(500000);
    echo "✓ Čekanje\n";
    
    $fileContent = file_get_contents($tempfile);
    if ($fileContent === false || empty($fileContent)) {
        throw new Exception("Fajl je prazan ili nije dostupan");
    }
    
    @unlink($tempfile);
    echo "✓ Obrisano\n";
    
    echo "\n✅ TEST 1 USPEŠAN! " . strlen($fileContent) . " bytes\n\n";
} catch (Exception $e) {
    echo "\n❌ GREŠKA: " . $e->getMessage() . "\n\n";
}

// Test 2: Novi dokument sa XAMPP temp
echo "📝 TEST 2: Novi dokument sa /Applications/XAMPP/temp/\n";
try {
    $xamppTemp = '/Applications/XAMPP/temp/';
    
    $phpWord = new PhpWord();
    $section = $phpWord->addSection();
    $section->addText("Test");
    
    $tempfile = $xamppTemp . uniqid('docx_', true) . '.docx';
    echo "💾 Temp fajl: " . basename($tempfile) . "\n";
    
    $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
    $objWriter->save($tempfile);
    echo "✓ Sačuvano\n";
    
    usleep(500000);
    echo "✓ Čekanje\n";
    
    $fileContent = file_get_contents($tempfile);
    if ($fileContent === false || empty($fileContent)) {
        throw new Exception("Fajl je prazan ili nije dostupan");
    }
    
    @unlink($tempfile);
    echo "✓ Obrisano\n";
    
    echo "\n✅ TEST 2 USPEŠAN! " . strlen($fileContent) . " bytes\n";
} catch (Exception $e) {
    echo "\n❌ GREŠKA: " . $e->getMessage() . "\n";
}
?>
