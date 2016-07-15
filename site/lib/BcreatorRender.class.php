<?php

class BcreatorRender extends BcRender {

  function render() {
    $path = parent::render();
    $userId = Auth::get('id');
    db()->query(<<<SQL
INSERT INTO renderCounts (userId, cnt)
VALUES (?d, 1)
ON DUPLICATE KEY UPDATE cnt=cnt+1
SQL
      , $userId, $userId);
    return $path;
  }

}