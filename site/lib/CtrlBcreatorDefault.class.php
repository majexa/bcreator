<?php

class CtrlBcreatorDefault extends CtrlBcreatorLanding {

  protected function getParamActionN() {
    return 0;
  }

  function action_default() {
    $this->d['tpl'] = 'landing/default';
    $this->d['menu'][0]['active'] = true;
    $this->setPageTitle('Home');
    $form = new BcreatorSignupForm;
    if ($form->update()) {
      $this->redirect('/registrationComplete');
      return;
    }
    $this->d['signUpForm'] = $form->html().'<br><p><a href="/resetPassword">Restore password</a></p>';
  }

  function action_registrationComplete() {
    $this->d['tpl'] = 'landing/basic';
    $this->setPageTitle('Registration Complete');
    $this->d['html'] = 'Congratulations! Your access details to '.SITE_TITLE.' have been sent to your email address!';
  }

  function action_json_trialDialog() {
    $leftCount = 10 - db()->selectCell("SELECT cnt FROM renderCounts WHERE userId=?d", //
        Misc::checkEmpty(Auth::get('id')));
    $this->json['cnt'] = $leftCount;
    $this->json['text'] = '<p>You have '.($leftCount ? $leftCount.' renders left' : 'no renders'). //
      ' as part of your Trial account. Are you sure you want to render?</p>'. //
      '<p><a href="/trialExpiration">Upgrade your account here</a></p>';
  }

}
