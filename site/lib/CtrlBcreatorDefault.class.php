<?php

class CtrlBcreatorDefault extends CtrlDefault {

  function action_default() {
    $signInForm = new Form([
      [
        'title' => 'E-mail',
        'name' => 'authLogin',
        'type' => 'email'
      ],
      [
        'title' => 'Password',
        'name' => 'authPass',
        'type' => 'password'
      ],
    ], [
      'id' => 'auth'
    ]);

    if ($signInForm->isSubmitted()) {
      die2('========');
    }
    $this->d['signInForm'] = $signInForm->html();
    //
    $this->d['passwordRecoveryForm'] = CtrlCommonUserLostPass::getLoasPassForm()->html();
    $signUpForm = new BcreatorSignupForm;
    if ($signUpForm->update()) {
      $this->redirect('/list/create');
      return;
    }
    $this->d['signUpForm'] = $signUpForm->html();
    $this->d['tpl'] = 'home';
  }

  protected function postAuthRedirectPath() {
    return '/profile';
  }

}
