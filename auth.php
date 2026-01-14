<?php
// Centralized auth utilities: secure session, CSRF, login guard.

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function verify_csrf(string $token): bool
{
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

function login_user(int $userId, string $username): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['last_activity'] = time();
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
}

function require_login(): void
{
    if (empty($_SESSION['user_id'])) {
        header('Location: auth.html');
        exit;
    }
}

function enforce_session_timeout(int $ttlSeconds = 3600): void
{
    if (!empty($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > $ttlSeconds) {
        logout_user();
        header('Location: login.php?session=expired');
        exit;
    }

    $_SESSION['last_activity'] = time();
}
