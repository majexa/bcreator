<?php

class CtrlBcreatorDefault extends CtrlBcreatorLanding {

  function action_default() {
    $this->d['tpl'] = 'landing/default';
    return;
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
    //  die2('========');
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

  function action_json_freetrial() {
    $this->json = [
      'success' => false,
      'msg' => 'Cannot create invoice. Please try again later or contact administrator.'
    ];
  }

  function action_signin() {
    $this->d['tpl'] = 'landing/signin';
  }

  protected function postAuthRedirectPath() {
    return '/profile';
  }

}
