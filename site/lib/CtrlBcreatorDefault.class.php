<?php

class CtrlBcreatorDefault extends CtrlBcreatorLanding {

  function action_default() {
    $this->d['tpl'] = 'landing/default';
    $this->d['menu'][0]['active'] = true;
    $this->setPageTitle('Home');
    $signUpForm = new BcreatorSignupForm;
    $this->d['signUpForm'] = $signUpForm->html();
  }

  function action_json_freeTrial() {
    $signUpForm = new BcreatorSignupForm;
    if ($signUpForm->update()) {
      $this->json = [
        'msg' => 'Congratulations! Your access details to ELPC have been sent to your email address!'
      ];
      return;
    }
    $this->json['msg'] = $signUpForm->lastError;
    return $signUpForm;
  }

}
