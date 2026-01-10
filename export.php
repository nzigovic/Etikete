<?php
require 'vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;

$data = json_decode(file_get_contents("php://input"), true);

$template = new TemplateProcessor("template.docx");

for ($i = 1; $i <= 28; $i++) {
    $template->setValue("label".$i, $data[$i-1] ?? "");
}

$file = "etikete_" . time() . ".docx";
$template->saveAs($file);

header("Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document");
header("Content-Disposition: attachment; filename=$file");
readfile($file);
unlink($file);
exit;