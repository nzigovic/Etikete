<?php
require 'auth.php';

logout_user();

header('Location: auth.html?loggedout=1');
exit;
