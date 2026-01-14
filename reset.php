<?php
require 'db.php';
require 'auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $code = trim($_POST['code'] ?? '');
    $password = $_POST['password'] ?? '';
    $token = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($token)) {
        http_response_code(400);
        echo '<div class="error">Session expired. Please refresh and try again.</div>';
        exit;
    }

    if (!$email || !$code || !$password) {
        echo '<div class="error">All fields required.</div>';
        exit;
    }
    if (strlen($password) < 8) {
        echo '<div class="error">Password must be at least 8 characters.</div>';
        exit;
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        echo '<div class="error">No user found with that email.</div>';
        exit;
    }
    $stmt = $pdo->prepare('SELECT * FROM password_resets WHERE user_id = ? AND reset_code = ? AND expires_at > NOW() AND used = 0 ORDER BY id DESC LIMIT 1');
    $stmt->execute([$user['id'], $code]);
    $reset = $stmt->fetch();
    if (!$reset) {
        echo '<div class="error">Invalid or expired code.</div>';
        exit;
    }
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$password_hash, $user['id']]);
    $pdo->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')->execute([$reset['id']]);
    echo '<div class="success">Password reset successful. You can now log in.</div>';
    exit;
}

// Basic form for manual testing
?>
<form method="post" autocomplete="off">
    <input type="email" name="email" placeholder="Email" required>
    <input name="code" placeholder="Reset code" required>
    <input type="password" name="password" placeholder="New password" required>
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
    <button type="submit">Reset password</button>
</form>
