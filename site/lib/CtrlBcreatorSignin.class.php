<?php

class CtrlBcreatorSignin extends CtrlBcreatorLanding {

  function action_default() {
//    if (Auth::get('id')) {
//      $this->redirect('/profile');
//      return;
//    }
    $this->d['tpl'] = 'landing/signin';
  }

}