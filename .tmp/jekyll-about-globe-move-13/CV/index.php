<?php
declare(strict_types=1);

require __DIR__ . '/auth/config.php';

cvAuthRequireAccess();

$contentFile = __DIR__ . '/content/index.html';

if (!is_file($contentFile)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "The protected CV content has not been built yet.\n";
    echo "Run the Jekyll build and deploy the generated /CV/content/index.html file.\n";
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile($contentFile);
exit;
