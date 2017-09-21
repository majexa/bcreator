<?php

class CtrlBcreatorList extends CtrlDefault {

  function action_default() {
    $this->d['items'] = db()->query("SELECT * FROM sdDocuments WHERE userId=?d", Auth::get('id'));
    $this->d['tpl'] = 'landing/list';
  }

}