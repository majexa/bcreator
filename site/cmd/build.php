<?php

$currentBuildMode = BUILD_MODE;
ProjectConfig::updateConstant('more', 'BUILD_MODE', true);
print `php cmd.php cc`;
file_get_contents('http://'.SITE_DOMAIN.'/cpanel/11?renderKey='.Config::getVar('sd/renderKey'));
file_get_contents('http://'.SITE_DOMAIN.'/newBanner');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/11/json_blockSettings/78');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/11/json_blockSettings/84');
file_get_contents('http://'.SITE_DOMAIN.'/cpanel/11/json_settings');
if ($currentBuildMode === false) ProjectConfig::updateConstant('more', 'BUILD_MODE', false);
output('build complete');