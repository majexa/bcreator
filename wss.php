#!/usr/bin/php
<?php

define('LOGS_PATH', __DIR__.'/site/logs');
require '/home/user/ngn-env/ws/init.php';
$config = require __DIR__.'/site/config/vars/wss.php';
date_default_timezone_set('Europe/Moscow');

use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

$server = IoServer::factory(new HttpServer(new WsServer(new WsBase())), $config['port']);
$server->run();