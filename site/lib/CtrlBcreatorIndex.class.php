<?php

class CtrlBcreatorIndex extends CtrlBcreatorLanding {

  protected function init() {
    parent::init();
    $this->d['innerTpl'] = 'index/'.$this->req->param(1);
  }

}