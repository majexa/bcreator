<?php

class CtrlBcreatorIndex extends CtrlBCreatorLanding {

  protected function init() {
    die2(2222222);
    parent::init();
    $this->d['innerTpl'] = 'index'.$this->req->path(1);
    foreach ($this->d['menu'] as &$v) {
      if (isset($v['name']) and $v['name'] == $this->req->param(1)) {
        $v['active'] = true;
      }
    }
  }

}