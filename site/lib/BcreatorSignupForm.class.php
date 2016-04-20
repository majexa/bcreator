<?php

class BcreatorSignupForm extends Form {

  function __construct() {
    parent::__construct([
      [
        'title' => 'First Name',
        'name' => 'firstName',
        'required' => true
      ],
      [
        'title' => 'Last Name',
        'name' => 'lastName',
        'required' => true
      ],
      [
        'title' => 'E-mail',
        'name' => 'email',
        'required' => true
      ],
      [
        'title' => 'Discount Code',
        'name' => 'discountCode',
        'required' => true,
        'help' => 'Get your discount code from anyone of our partners:
<a href="http://jeremyRush.co.uk" target="_blank">JeremyRush.co.uk</a>'
      ],
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
    $data['pass'] = Misc::randString(8, true);
    $userId = DbModelCore::create('users', [
      'email' => $data['email'],
      'name' => $data['firstName'].' '.$data['lastName']
    ]);
    $host = SITE_DOMAIN;
    $title = SITE_TITLE;
    (new SendEmail)->send($data['email'], "Welcome to $title!", <<<HTML
<p>Dear member!<br>
<br>Your login details to Landing Page Creator:</p>
<p>Login: {$data['email']}<br>
Password: {$data['pass']}</p>
<p>Stay tuned!<br>
<a href=\"http://$host/\">$title</a></p>
HTML
 );
    Auth::loginById($userId);
  }

}
