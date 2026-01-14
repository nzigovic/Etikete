<?php
require 'db.php';
require 'auth.php';

// If already logged in, send to app
if (!empty($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    $token = $_POST['csrf_token'] ?? '';

    if (!verify_csrf($token)) {
        http_response_code(400);
        echo '<div class="notification error">Session expired. Please refresh the page and try again.</div>';
        exit;
    }

    if (!$username || !$password) {
        echo '<div class="notification error">All fields are required!</div>';
        exit;
    }

    // Fetch user
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        login_user((int) $user['id'], $user['username']);

        echo '<style>
        #loginToast {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translate(-50%,-50%);
            z-index: 9999;
            min-width: 320px;
            padding: 22px 32px;
            border-radius: 18px;
            background: linear-gradient(90deg,#3a7bd5 0%,#00d2ff 100%);
            color: #fff;
            font-size: 1.15rem;
            font-weight: 600;
            box-shadow: 0 8px 32px rgba(58,123,213,0.18), 0 1.5px 8px rgba(0,210,255,0.12);
            text-align: center;
            opacity: 0;
            animation: toastIn 0.7s forwards, toastOut 0.7s 1.2s forwards;
        }
        @keyframes toastIn {
            from { opacity: 0; transform: translate(-50%,-60%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes toastOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        </style>';
        echo '<div id="loginToast">Login successful! Redirecting...</div>';
        echo '<script>setTimeout(function(){ window.location.href = "index.php"; }, 1200);</script>';
    } else {
        echo '<div class="notification error">Invalid username or password!</div>';
    }
    exit;
}

// Simple HTML form for login
?>
<form method="post" autocomplete="off">
    <input name="username" placeholder="Username" required>
    <input name="password" type="password" placeholder="Password" required>
    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
    <button type="submit">Login</button>
</form>
