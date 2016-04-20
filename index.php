<?php

define('NGN_PATH', dirname(dirname(__DIR__)).'/ngn');
define('PROJECT_PATH', __DIR__.'/site');
define('WEBROOT_PATH', __DIR__);

require_once NGN_PATH.'/init/core.php';
$project = Arr::getValueByKey(require dirname(NGN_PATH).'/config/projects.php', 'name', basename(__DIR__));
define('SITE_DOMAIN', $project['domain'].(isset($project['port']) ? ':'.$project['port'] : ''));

require_once PROJECT_PATH.'/config/constants/core.php';
require_once NGN_PATH.'/init/site-web.php';
if (file_exists(PROJECT_PATH.'/init.php')) require PROJECT_PATH.'/init.php';

print O::di('RouterManager')->router()->dispatch()->getOutput();