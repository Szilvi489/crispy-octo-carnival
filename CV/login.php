<?php
declare(strict_types=1);

require __DIR__ . '/auth/config.php';

cvAuthStartSession();

if (cvAuthHasAccess()) {
    cvAuthRedirect('');
}

$errorMessage = '';
$isConfigured = cvAuthIsConfigured();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = trim((string) ($_POST['password'] ?? ''));

    if (!$isConfigured) {
        $errorMessage = 'Password protection is not configured yet.';
    } elseif ($password === '') {
        $errorMessage = 'Please enter the password.';
    } elseif (!cvAuthVerifyPassword($password)) {
        $errorMessage = 'Incorrect password.';
    } else {
        cvAuthGrantAccess();
        cvAuthRedirect('');
    }
}
?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CV Access</title>
    <meta name="robots" content="noindex,nofollow">
    <link rel="stylesheet" href="/assets/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Aldrich&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&display=swap">
    <link rel="stylesheet" href="/CV/login.css">
</head>
<body class="cv-login-page">
    <main class="cv-login-shell">
        <aside
            class="cv-login-screen-note"
            aria-label="For the full visual experience, view this CV on a larger screen."
        >
            <svg class="cv-login-screen-note-svg" viewBox="0 0 120 120" role="presentation" aria-hidden="true">
                <defs>
                    <path
                        id="cv-login-screen-note-path"
                        d="M 60,60 m -43,0 a 43,43 0 1,1 86,0 a 43,43 0 1,1 -86,0"
                    />
                </defs>
                <circle class="cv-login-screen-note-ring" cx="60" cy="60" r="47"></circle>
                <circle class="cv-login-screen-note-core" cx="60" cy="60" r="33"></circle>
                <text class="cv-login-screen-note-text">
                    <textPath href="#cv-login-screen-note-path">
                        BEST VIEWED ON A LARGER SCREEN FOR THE FULL VISUAL EXPERIENCE
                    </textPath>
                </text>
            </svg>
        </aside>
        <section class="cv-login-card" aria-labelledby="cv-login-title">
            <p class="cv-login-eyebrow">Protected CV</p>
            <h1 id="cv-login-title">Enter Password</h1>
            <p class="cv-login-copy">This CV is shared privately. Enter the password to continue.</p>

            <?php if ($errorMessage !== ''): ?>
                <p class="cv-login-alert" role="alert"><?= htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8') ?></p>
            <?php endif; ?>

            <form class="cv-login-form" method="post" action="<?= htmlspecialchars(cvAuthPath('login/'), ENT_QUOTES, 'UTF-8') ?>">
                <label class="cv-login-label" for="password">Password</label>
                <input
                    class="cv-login-input"
                    type="password"
                    id="password"
                    name="password"
                    autocomplete="current-password"
                    required
                >
                <button class="cv-login-button" type="submit">Open CV</button>
            </form>

            <p class="cv-login-help">If you do not have the password, contact me directly.</p>
        </section>
    </main>
</body>
</html>
