<?php

class CtrlBcreatorSupport extends CtrlBcreatorLanding {

  function action_default() {
    $this->setPageTitle('Support');
    $form = new Form([
      [
        'name' => 'firstName',
        'title' => 'First Name',
        'required' => true,
        'help' => 'e.g. John'
      ],
      [
        'name' => 'lastName',
        'title' => 'Last Name',
        'required' => true
      ],
      [
        'name' => 'email',
        'title' => 'Email',
        'required' => true
      ],
      [
        'name' => 'message',
        'title' => 'Message',
        'type' => 'textarea',
        'required' => true
      ],
    ], [
      'placeholders' => true
    ]);
    if (Auth::get('id')) {
      $defaultData = UsersEditForm::splitName(Auth::get('name'));
      $defaultData['email'] = Auth::get('email');
      $form->setElementsData($defaultData);
    }
    $form = BcreatorCore::extendForm($form);
    $this->d['form'] = $form->html();
    $this->d['innerTpl'] = 'landing/form';
    $this->d['menu'][3]['active'] = true;
  }


}