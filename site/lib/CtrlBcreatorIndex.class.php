<?php

class CtrlBcreatorIndex extends CtrlBcreatorLanding {

  protected function init() {
    parent::init();
    $this->d['innerTpl'] = 'index'.$this->req->path(1);

    foreach ($this->d['menu'] as &$v) {
      if (isset($v['name']) and $v['name'] == $this->req->param(1)) {
        $v['active'] = true;
      }
    }
  }

}