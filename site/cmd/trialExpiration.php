<?php

$userIds = db()->selectCol('SELECT userId FROM invoice WHERE dueDate < ?', Date::db());
if ($userIds) {
  db()->query("DELETE FROM sessions WHERE userId IN (?a)", $userIds);
  print "logged off ".count($userIds)." users\n";
}
