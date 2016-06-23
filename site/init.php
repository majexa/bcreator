<?php

//define('SITE_DOMAIN', 'zukulbannercreator.net');

require dirname(NGN_PATH).'/bc/init.php';

O::replaceInjection('DefaultRouter', 'BcreatorRouter');
$root = dirname(dirname(dirname(__DIR__)));
Lib::addPsr4Folder($root.'/Library');
Lib::addPsr4Folder($root.'/Library/Engine/etc');
Lib::addPsr2Folder($root.'/Library');
Sql::setThrowErrors(true);
Lib::required('Db'); // require to load DB_* constants
Sql::connectDatabase([
  'host' => DB_HOST,
  'username' => DB_USER,
  'password' => DB_PASS,
  'dbname' => DB_NAME
]);

//Sflm::$debugUrl = 'http://'.SITE_DOMAIN;
//Sflm::$debugPaths = [
//  'js' => [
//    'Ngn.sd.GlobalSlides',
//  ]
//];

