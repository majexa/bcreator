#! /usr/bin/php
<?php

// queue manager //

define('NGN_PATH', dirname(dirname(__DIR__)).'/ngn');
define('PROJECT_PATH', __DIR__.'/site');

define('WEBROOT_PATH', __DIR__);
require_once NGN_PATH.'/init/site-cli.php';
if (file_exists(PROJECT_PATH.'/init.php')) require PROJECT_PATH.'/init.php';

(new ProjectQueueWorker(isset(R::get('options')['n']) ? R::get('options')['n'] : 1))->run();
