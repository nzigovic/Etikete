<?php
require 'db.php';
require 'auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $token = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($token)) {
        http_response_code(400);
        echo '<div class="error">Session expired. Please refresh and try again.</div>';
        exit;
    }

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo '<div class="error">Invalid email.</div>';
        exit;
    }
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        echo '<div class="error">No user found with that email.</div>';
        exit;
    }
    $code = bin2hex(random_bytes(4));
    $expires = date('Y-m-d H:i:s', time() + 3600);
    $pdo->prepare('INSERT INTO password_resets (user_id, reset_code, expires_at) VALUES (?, ?, ?)')->execute([$user['id'], $code, $expires]);
    $subject = "Password Reset Code";
    $message = "Your password reset code is: $code\nThis code expires in 1 hour.";
    $headers = "From: noreply@yourdomain.com";
    mail($email, $subject, $message, $headers);
    echo '<div class="success">Reset code sent to your email.</div>';
    exit;
}

// Basic form for manual testing
?>
<form method="post" autocomplete="off">
    <input type="email" name="email" placeholder="Email" required>
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
    <button type="submit">Send reset code</button>
</form>
