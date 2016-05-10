<?php

class CtrlBcreatorProfile extends CtrlBcreatorLanding {

  function action_default() {
    if (!Auth::get('id')) {
      $this->redirect('/');
      return;
    }
    $form = BcreatorCore::extendForm(new UsersEditForm(Auth::get('id')));
    if ($form->update()) {
      $this->redirect();
      return;
    }
    $this->setPageTitle('Profile');
    $this->d['form'] = $form->html();
    $this->d['innerTpl'] = 'landing/form';
    $this->d['menu'][4]['active'] = true;
  }

}