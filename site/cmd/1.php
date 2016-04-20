<?php

print "\n----\n";
$user = DbModelCore::get('users', 1);
$c = Misc::randString();
print 'NEW: '.$c."\n";
DbModelCore::update('users', 1, ['actCode' => $c]);
//$user = DbModelCore::get('users', 1);
print $user['actCode']."\n";