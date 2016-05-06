<?php

require dirname(NGN_PATH).'/bc/init.php';

O::replaceInjection('DefaultRouter', 'BcreatorRouter');

Sflm::$debugUrl = 'http://'.SITE_DOMAIN;
Sflm::$debugPaths = [
  'js' => [
    //'Ngn.sd.',
  ]
];

