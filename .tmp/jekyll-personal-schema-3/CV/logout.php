<?php
declare(strict_types=1);

require __DIR__ . '/auth/config.php';

cvAuthLogout();
cvAuthRedirect('login/');
