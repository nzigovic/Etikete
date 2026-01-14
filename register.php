<?php
require 'db.php';
require 'auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $token = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($token)) {
        http_response_code(400);
        echo '<div class="notification error">Session expired. Please refresh the page and try again.</div>';
        exit;
    }

    // Basic validation
    if (!$username || !$email || !$password) {
        echo '<div class="notification error">All fields are required.</div>';
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo '<div class="notification error">Invalid email address.</div>';
        exit;
    }
    if (strlen($password) < 8) {
        echo '<div class="notification error">Password must be at least 8 characters.</div>';
        exit;
    }

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    try {
        $stmt->execute([$username, $email, $password_hash]);
        echo '<div class="notification success">Registration successful! You can now log in.</div>';
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo '<div class="notification error">Username or email already exists.</div>';
        } else {
            echo '<div class="notification error">Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
    }
} else {
    // Simple HTML form for registration
    ?>
    <form method="post" id="registerForm" autocomplete="off">
        <input name="username" placeholder="Username" required>
        <input name="email" type="email" placeholder="Email" required>
        <input name="password" type="password" placeholder="Password" required>
        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
        <button type="submit">Register</button>
        <div id="registerNotification"></div>
    </form>
    <script>
    document.getElementById('registerForm').onsubmit = async function(e) {
        e.preventDefault();
        const form = e.target;
        const data = new FormData(form);
        const res = await fetch('register.php', {
            method: 'POST',
            body: data
        });
        const html = await res.text();
        document.getElementById('registerNotification').innerHTML = html;
        setTimeout(() => {
            document.getElementById('registerNotification').innerHTML = '';
        }, 4000);
    };
    </script>
    <?php
}
