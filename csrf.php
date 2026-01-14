<?php
require 'auth.php';

header('Content-Type: text/plain; charset=utf-8');
echo csrf_token();
