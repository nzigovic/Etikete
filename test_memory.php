<?php
// Test sa memorijskim stream-om
$labels = [
    "Soba 101 - Marko - Aspirin - 08:00",
    "Soba 102 - Jelena - Metformin - 12:00",
    "Soba 103 - Petar - Vitamin - 14:00"
];

require 'vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;

echo "=== TEST MEMORY STREAM ===\n\n";

// Test 1: Template sa memorijom
if (file_exists("template.docx")) {
    echo "📋 TEST 1: Template sa php://memory\n";
    try {
        $template = new TemplateProcessor("template.docx");
        
        for ($i = 1; $i <= count($labels); $i++) {
            $template->setValue("label".$i, $labels[$i-1]);
        }
        
        $memStream = 'php://memory';
        echo "💾 Čuvam u php://memory...\n";
        $template->saveAs($memStream);
        
        $fp = fopen($memStream, 'r');
        $fileContent = stream_get_contents($fp);
        fclose($fp);
        
        if ($fileContent === false) {
            throw new Exception("Nije moguće pročitati iz memorije");
        }
        
        echo "✅ USPEŠNO!\n";
        echo "Veličina: " . strlen($fileContent) . " bytes\n\n";
    } catch (Exception $e) {
        echo "❌ GREŠKA: " . $e->getMessage() . "\n\n";
    }
}

// Test 2: Novi dokument sa memorijom
echo "📝 TEST 2: Novi dokument sa php://memory\n";
try {
    $phpWord = new PhpWord();
    $section = $phpWord->addSection();
    $section->addText("Test Dokument");
    
    $memStream = 'php://memory';
    echo "💾 Čuvam u php://memory...\n";
    $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
    $objWriter->save($memStream);
    
    $fp = fopen($memStream, 'r');
    $fileContent = stream_get_contents($fp);
    fclose($fp);
    
    if ($fileContent === false) {
        throw new Exception("Nije moguće pročitati iz memorije");
    }
    
    echo "✅ USPEŠNO!\n";
    echo "Veličina: " . strlen($fileContent) . " bytes\n";
} catch (Exception $e) {
    echo "❌ GREŠKA: " . $e->getMessage() . "\n";
}
?>
