<?php

class BcreatorSignupForm extends Form {

  function __construct() {
    parent::__construct([
      [
        'title' => 'First Name',
        'name' => 'firstName',
        'required' => true,
        'autocomplete' => 'off'
      ],
      [
        'title' => 'Last Name',
        'name' => 'lastName',
        'required' => true,
        'autocomplete' => 'off'
      ],
      [
        'title' => 'E-mail',
        'name' => 'email',
        'required' => true,
        'autocomplete' => 'off'
      ],
//      [
//        'title' => 'Discount Code',
//        'name' => 'discountCode',
//        'required' => true,
//        'help' => 'Get your discount code from anyone of our partners:
//<a href="http://jeremyRush.co.uk" target="_blank">JeremyRush.co.uk</a>'
//      ],
    ], [
      'placeholders' => true,
      'submitTitle' => 'SUBMIT NOW'
    ]);
  }

  protected function _initErrors() {
//    $el = $this->getElement('discountCode');
//    $discountCode = $el->value();
//    if (!db()->selectCell("SELECT * FROM discountCode WHERE isActive = 'y' AND code=?", $discountCode)) {
//      $el->error('Discount code is wrong!');
//    }
    $el = $this->getElement('email');
    if (db()->selectCell("SELECT * FROM users WHERE email=?", $el->value())) {
      $el->error('Your email address is already registered! Try restoring password.');
    }
  }

  protected function _update(array $data) {
    $pass = Misc::randString(8, true);
    DbModelCore::create('users', [
      'email' => $data['email'],
      'name' => $data['firstName'].' '.$data['lastName'],
      'pass' => $pass,
      'active' => true
    ]);
    $host = SITE_DOMAIN;
    $title = SITE_TITLE;
    (new SendEmail)->send($data['email'], "Welcome to $title!", <<<HTML
<p>Dear member!<br>
<br>Your login details to $title:</p>
<p>Login: {$data['email']}<br>
Password: $pass</p>
<p>Stay tuned!<br>
<a href=\"http://$host/\">$title</a></p>
HTML
    );
  }

}
