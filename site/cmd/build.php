<?php

$currentBuildMode = BUILD_MODE;
ProjectConfig::updateConstant('more', 'BUILD_MODE', true);
print `php cmd.php cc`;

$links = [
  'http://'.SITE_DOMAIN.'/cpanel/111?adminKey='.Config::getVar('adminKey'),
  'http://'.SITE_DOMAIN.'/newBanner',
  'http://'.SITE_DOMAIN.'/support',
  'http://'.SITE_DOMAIN.'/pageBlock/111/json_blockSettings/348',
  'http://'.SITE_DOMAIN.'/pageBlock/111/json_blockSettings/349',
  'http://'.SITE_DOMAIN.'/cpanel/111/json_settings?adminKey='.Config::getVar('adminKey'),
  'http://'.SITE_DOMAIN.'/admin/usersBcreator?adminKey='.Config::getVar('adminKey'),
  'http://'.SITE_DOMAIN.'/admin/ddItemsFilter/backgrounds/editContent?adminKey='.Config::getVar('adminKey'),
];
$curl = new Curl;
foreach ($links as $link) {
  $curl->check200AndThrow($link);
}

if ($currentBuildMode === false) {
  ProjectConfig::updateConstant('more', 'BUILD_MODE', false);
  foreach ($links as $link) {
    $curl->check200AndThrow($link);
  }
}
output('build complete');
