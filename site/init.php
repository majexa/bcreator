<?php

//define('SITE_DOMAIN', 'zukulbannercreator.net');

require dirname(NGN_PATH).'/bc/init.php';

O::replaceInjection('DefaultRouter', 'BcreatorRouter');

Lib::addPsr4Folder('/home/user/toaster/Library');
Lib::addPsr4Folder('/home/user/toaster/Library/Engine/etc');
Lib::addPsr2Folder('/home/user/toaster/Library');

//Sflm::$debugUrl = 'http://'.SITE_DOMAIN;
//Sflm::$debugPaths = [
//  'js' => [
//    //'Ngn.sd.',
//  ]
//];

