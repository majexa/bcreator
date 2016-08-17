<?php

class BcreatorSupportForm extends Form {

  function __construct() {
    parent::__construct([
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
        'type' => 'email',
        'required' => true
      ],
      [
        'name' => 'message',
        'title' => 'Message',
        'type' => 'textarea',
        'required' => true
      ],
    ], [
      'placeholders' => true,
      'submitTitle' => 'Send'
    ]);
    if (Auth::get('id')) {
      $defaultData = UsersEditForm::splitName(Auth::get('name'));
      $defaultData['email'] = Auth::get('email');
      $this->setElementsData($defaultData);
    }
    BcreatorCore::extendForm($this);
  }

  function _update(array $data) {
    (new SendEmail())->send('andrey.yartsev.g@gmail.com', SITE_TITLE.' support', $this->getTitledText());
  }

}