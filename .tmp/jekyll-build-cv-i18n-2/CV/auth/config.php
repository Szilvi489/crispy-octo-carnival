<?php
declare(strict_types=1);

$cvAuthConfig = [
    'base_path' => '/CV',
    'password_hash' => 'CHANGE_ME',
    'session_name' => 'cv_access',
    'session_key' => 'cv_access_granted',
];

$cvAuthLocalConfigFile = __DIR__ . '/password.local.php';

if (is_file($cvAuthLocalConfigFile)) {
    $cvAuthLocalConfig = require $cvAuthLocalConfigFile;

    if (is_array($cvAuthLocalConfig)) {
        $cvAuthConfig = array_merge($cvAuthConfig, $cvAuthLocalConfig);
    }
}

function cvAuthConfig(string $key)
{
    global $cvAuthConfig;

    return $cvAuthConfig[$key] ?? null;
}

function cvAuthBasePath(): string
{
    $basePath = (string) cvAuthConfig('base_path');
    $basePath = '/' . trim($basePath, '/');

    return $basePath === '/' ? '' : $basePath;
}

function cvAuthPath(string $path = ''): string
{
    $basePath = cvAuthBasePath();
    $suffix = trim($path, '/');

    if ($suffix === '') {
        return $basePath . '/';
    }

    return $basePath . '/' . $suffix . '/';
}

function cvAuthStartSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name((string) cvAuthConfig('session_name'));
    session_start();
}

function cvAuthIsConfigured(): bool
{
    return (string) cvAuthConfig('password_hash') !== 'CHANGE_ME';
}

function cvAuthVerifyPassword(string $password): bool
{
    $hash = (string) cvAuthConfig('password_hash');

    if (!cvAuthIsConfigured() || $password === '') {
        return false;
    }

    return password_verify($password, $hash);
}

function cvAuthHasAccess(): bool
{
    cvAuthStartSession();

    return !empty($_SESSION[(string) cvAuthConfig('session_key')]);
}

function cvAuthGrantAccess(): void
{
    cvAuthStartSession();
    session_regenerate_id(true);
    $_SESSION[(string) cvAuthConfig('session_key')] = true;
}

function cvAuthLogout(): void
{
    cvAuthStartSession();

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            (bool) $params['secure'],
            (bool) $params['httponly']
        );
    }

    session_destroy();
}

function cvAuthRedirect(string $path = ''): void
{
    header('Location: ' . cvAuthPath($path), true, 302);
    exit;
}

function cvAuthRequireAccess(): void
{
    if (cvAuthHasAccess()) {
        return;
    }

    cvAuthRedirect('login/');
}
