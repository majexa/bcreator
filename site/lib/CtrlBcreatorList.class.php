<?php

class CtrlBcreatorList extends CtrlDefault {

  function action_default() {
    $this->d['list'] = db()->query("SELECT * FROM sdDocuments");
    $this->d['tpl'] = 'landing/list';
  }

}