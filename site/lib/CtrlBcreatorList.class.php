<?php

class CtrlBcreatorList extends CtrlBcreatorLanding {

  function action_default() {
    if (!Auth::get('id')) {
      header('Location: /');
      return;
    }
    $this->d['innerTpl'] = 'landing/list';
  }

}