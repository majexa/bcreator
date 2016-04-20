<?php

class CtrlBcreatorProfile extends CtrlBase {

  function action_default() {
    $form = new UsersEditForm(Auth::get('id'));
    if ($form->update()) {
      $this->redirect(Tt()->getPath(1).'/complete');
      return;
    }
    $this->d['form'] = $form->html();
    $this->d['tpl'] = 'common/form';
  }

  function action_complete() {
    $this->d['html'] = 'Done';
    $this->d['tpl'] = 'common/html';
  }

}