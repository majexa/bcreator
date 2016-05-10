<?php

class CtrlBcreatorSignin extends CtrlBcreatorLanding {

  function action_default() {
    if (Auth::get('id')) {
      $this->redirect('/profile');
      return;
    }
    $form = BcreatorCore::extendForm(new AuthForm);
    if ($form->isSubmittedAndValid()) {
      $this->redirect('/profile');
    }
    $this->d['form'] = $form->html();
    $this->d['innerTpl'] = 'landing/form';
  }

}