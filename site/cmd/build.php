<?php

$currentBuildMode = BUILD_MODE;
ProjectConfig::updateConstant('more', 'BUILD_MODE', true);
print `php cmd.php cc`;

file_get_contents('http://'.SITE_DOMAIN.'/cpanel/12?adminKey='.Config::getVar('adminKey'));
file_get_contents('http://'.SITE_DOMAIN.'/newBanner');
file_get_contents('http://'.SITE_DOMAIN.'/support');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/111/json_blockSettings/348');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/111/json_blockSettings/349');
file_get_contents('http://'.SITE_DOMAIN.'/cpanel/11/json_settings');
file_get_contents('http://'.SITE_DOMAIN.'/admin/usersBcreator?adminKey='.Config::getVar('adminKey'));
file_get_contents('http://'.SITE_DOMAIN.'/admin/ddItemsFilter/backgrounds/editContent?adminKey='.Config::getVar('adminKey'));

if ($currentBuildMode === false) ProjectConfig::updateConstant('more', 'BUILD_MODE', false);
output('build complete');