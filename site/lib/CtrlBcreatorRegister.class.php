<?php

class CtrlBcreatorRegister extends CtrlBcreatorLanding {

  function action_default() {
    $form = new BcreatorSignupForm;
    BcreatorCore::extendForm($form);
    if ($form->update()) {
      $this->redirect('/registrationComplete');
    }
    $this->d['form'] = '<legend>Register New User</legend>'. //
      '<div class="form-horizontal">'.$form->html().'</div>';
    $this->d['innerTpl'] = 'common/form';
  }

}