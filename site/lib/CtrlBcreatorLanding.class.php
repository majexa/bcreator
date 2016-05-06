<?php

class CtrlBCreatorLanding extends CtrlBase {

  protected function init() {
    $this->d['mainTpl'] = 'landing/main';
    $this->d['tpl'] = 'landing/inner';
  }

}