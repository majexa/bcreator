<?php

file_get_contents('http://'.SITE_DOMAIN.'/cpanel/11?renderKey='.Config::getVar('sd/renderKey'));
file_get_contents('http://'.SITE_DOMAIN.'/newBanner');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/11/json_blockSettings/78');
file_get_contents('http://'.SITE_DOMAIN.'/pageBlock/11/json_blockSettings/84');
file_get_contents('http://'.SITE_DOMAIN.'/cpanel/11/json_settings');
print "done\n";