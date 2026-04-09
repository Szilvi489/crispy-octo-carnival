<?php
declare(strict_types=1);

$config = [
    'recipient_email' => 'mail@szilviavarga.eu',
    'from_email' => 'mail@szilviavarga.eu',
    'from_name' => 'Szilvia Varga Portfolio',
    'subject_prefix' => 'Portfolio contact',
    'success_message' => 'Thanks, your message has been sent.',
    'rate_limit_window' => 900,
    'rate_limit_max' => 4,
];

$localConfigFile = __DIR__ . '/contact.local.php';
if (is_file($localConfigFile)) {
    $localConfig = require $localConfigFile;
    if (is_array($localConfig)) {
        $config = array_merge($config, $localConfig);
    }
}

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function contactRespond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function contactConfig(array $config, string $key, mixed $default = null): mixed
{
    return $config[$key] ?? $default;
}

function contactCleanText(string $value): string
{
    $value = trim($value);
    $value = preg_replace('/\r\n?/', "\n", $value) ?? $value;
    $value = preg_replace('/[^\P{C}\n\t]+/u', '', $value) ?? $value;
    return trim($value);
}

function contactHeaderValue(string $value): string
{
    return trim(str_replace(["\r", "\n"], ' ', $value));
}

function contactClientIp(): string
{
    $value = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return preg_replace('/[^0-9a-fA-F:., ]/', '', (string) $value) ?: 'unknown';
}

function contactRateLimit(array $config): bool
{
    $ip = contactClientIp();
    $key = sha1($ip);
    $path = sys_get_temp_dir() . '/contact-rate-' . $key . '.json';
    $window = max(60, (int) contactConfig($config, 'rate_limit_window', 900));
    $maxRequests = max(1, (int) contactConfig($config, 'rate_limit_max', 4));
    $now = time();
    $timestamps = [];

    if (is_file($path)) {
        $json = file_get_contents($path);
        $data = is_string($json) ? json_decode($json, true) : null;
        if (is_array($data)) {
            foreach ($data as $timestamp) {
                if (is_int($timestamp) && ($now - $timestamp) < $window) {
                    $timestamps[] = $timestamp;
                }
            }
        }
    }

    if (count($timestamps) >= $maxRequests) {
        return false;
    }

    $timestamps[] = $now;
    @file_put_contents($path, json_encode($timestamps));
    return true;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    contactRespond(405, [
        'ok' => false,
        'message' => 'Method not allowed.'
    ]);
}

if (!contactRateLimit($config)) {
    contactRespond(429, [
        'ok' => false,
        'message' => 'Too many messages in a short time. Please wait a bit and try again.'
    ]);
}

$name = contactCleanText((string) ($_POST['name'] ?? ''));
$reason = contactCleanText((string) ($_POST['reason'] ?? ''));
$about = contactCleanText((string) ($_POST['about'] ?? ''));
$message = contactCleanText((string) ($_POST['message'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$honeypot = trim((string) ($_POST['website'] ?? ''));

if ($honeypot !== '') {
    contactRespond(200, [
        'ok' => true,
        'message' => (string) contactConfig($config, 'success_message', 'Thanks, your message has been sent.')
    ]);
}

$allowedReasons = [
    'job' => 'Job opportunity',
    'freelance-project' => 'Freelance Project',
    'collab' => 'Collaboration',
    'question' => 'Question',
    'other' => 'Other',
];

if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 120) {
    contactRespond(422, [
        'ok' => false,
        'message' => 'Please enter your name.'
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 160) {
    contactRespond(422, [
        'ok' => false,
        'message' => 'Please enter a valid email address.'
    ]);
}

if (!array_key_exists($reason, $allowedReasons)) {
    contactRespond(422, [
        'ok' => false,
        'message' => 'Please choose why you are reaching out.'
    ]);
}

if ($message === '' || mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    contactRespond(422, [
        'ok' => false,
        'message' => 'Please enter a longer message.'
    ]);
}

if (mb_strlen($about) > 180) {
    contactRespond(422, [
        'ok' => false,
        'message' => 'The company or project field is too long.'
    ]);
}

$recipientEmail = contactHeaderValue((string) contactConfig($config, 'recipient_email', ''));
$fromEmail = contactHeaderValue((string) contactConfig($config, 'from_email', ''));
$fromName = contactHeaderValue((string) contactConfig($config, 'from_name', 'Portfolio Contact'));
$subjectPrefix = contactHeaderValue((string) contactConfig($config, 'subject_prefix', 'Portfolio contact'));
$reasonLabel = $allowedReasons[$reason];
$aboutPart = $about !== '' ? ' - ' . $about : '';
$subject = $subjectPrefix . ': ' . $reasonLabel . $aboutPart;
$replyToName = contactHeaderValue($name);
$replyToEmail = contactHeaderValue($email);

if ($recipientEmail === '' || $fromEmail === '') {
    contactRespond(500, [
        'ok' => false,
        'message' => 'Contact form is not configured yet.'
    ]);
}

$body = implode("\n", [
    'New portfolio contact message',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Reason: ' . $reasonLabel,
    'About: ' . ($about !== '' ? $about : '-'),
    '',
    'Message:',
    $message,
    '',
    'Meta:',
    'IP: ' . contactClientIp(),
    'User-Agent: ' . contactCleanText((string) ($_SERVER['HTTP_USER_AGENT'] ?? '-')),
]);

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $fromName . ' <' . $fromEmail . '>',
    'Reply-To: ' . $replyToName . ' <' . $replyToEmail . '>',
    'X-Website-Form: contact',
];

$mailSent = @mail(
    $recipientEmail,
    $subject,
    $body,
    implode("\r\n", $headers),
    '-f' . $fromEmail
);

if (!$mailSent) {
    error_log('Contact form mail() failed for ' . $recipientEmail);
    contactRespond(500, [
        'ok' => false,
        'message' => 'The message could not be sent right now. Please try again later.'
    ]);
}

contactRespond(200, [
    'ok' => true,
    'message' => (string) contactConfig($config, 'success_message', 'Thanks, your message has been sent.')
]);
