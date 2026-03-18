<?php
declare(strict_types=1);

require __DIR__ . '/auth/config.php';

cvAuthRequireAccess();

$relativePath = (string) ($_GET['path'] ?? '');
$relativePath = str_replace('\\', '/', $relativePath);
$relativePath = ltrim($relativePath, '/');

if ($relativePath === '' || str_contains($relativePath, '..')) {
    http_response_code(400);
    exit;
}

$assetRoot = realpath(__DIR__ . '/assets');
$assetPath = realpath(__DIR__ . '/assets/' . $relativePath);

if ($assetRoot === false || $assetPath === false || !str_starts_with($assetPath, $assetRoot . DIRECTORY_SEPARATOR) || !is_file($assetPath)) {
    http_response_code(404);
    exit;
}

$extension = strtolower((string) pathinfo($assetPath, PATHINFO_EXTENSION));
$mimeTypes = [
    'css' => 'text/css; charset=UTF-8',
    'js' => 'application/javascript; charset=UTF-8',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'svg' => 'image/svg+xml',
    'webp' => 'image/webp',
    'avif' => 'image/avif',
    'ico' => 'image/x-icon',
    'txt' => 'text/plain; charset=UTF-8',
    'json' => 'application/json; charset=UTF-8',
    'map' => 'application/json; charset=UTF-8',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf' => 'font/ttf',
    'otf' => 'font/otf',
    'pdf' => 'application/pdf',
];

$contentType = $mimeTypes[$extension] ?? 'application/octet-stream';

header('Content-Type: ' . $contentType);
header('Content-Length: ' . (string) filesize($assetPath));
header('Cache-Control: private, max-age=3600');

readfile($assetPath);
exit;
