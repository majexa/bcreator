<?php

class CtrlBcreatorRegister extends CtrlBcreatorLanding {

  function action_default() {
    $form = new BcreatorSignupForm;
    BcreatorCore::extendForm($form);
    if ($form->update()) {
      $this->redirect('/registrationComplete');
    }
    $this->setPageTitle('Register New User');
    $this->d['form'] = $form->html();
    $this->d['innerTpl'] = 'landing/form';
  }

}