<?php

class BcreatorUserManager implements \Engine\IPN\IUserManager {
  function findUserByEmail($email) {
    return DbModelCore::get('users', $email, 'email');
  }

  function findUserByUsername($username) {
    return DbModelCore::get('users', $username, 'name');
  }

  function getUserId($user) {
    return $user['id'];
  }

  function getUserEmail($user) {
    return $user['email'];
  }

  function getUserUsername($user) {
    return $user['name'];
  }

  function getUserName($user) {
    return $user['name'];
  }

  function registerUser($email, $username, $pass, $name = '') {
    $userId = DbModelCore::create('users', [
      'email' => $email,
      'name' => $username,
      'pass' => $pass,
      'active' => true
    ]);
    (new \Engine\IPN\Adapter\EngineMvc\InvoiceManager)->createInvoice( //
      $userId, //
      bin2hex(openssl_random_pseudo_bytes(8)), //
      '0.0', //
      new \DateTime(), //
      new \DateInterval('P7D'), //
      [
        'module' => __CLASS__,
        'action' => 'register',
        'reason' => '7 days free trial'
      ]);
    $host = SITE_DOMAIN;
    $title = SITE_TITLE;
    (new SendEmail)->send($email, "Welcome to $title!", <<<HTML
<p>Dear member!<br>
<br>Your login details to $title:</p>
<p>Login: $email<br>
Password: $pass</p>
<p>Stay tuned!<br>
<a href=\"http://$host/\">$title</a></p>
HTML
    );
    $user = [
      'joined'        => "'now()'",
      'firstName'     => 'One',
      'lastName'      => 'Two',
      'email'         => $email,
      'password'      => md5($pass),
      'invoiced'      => 0,
      'id' => $userId
    ];
    return $user;
  }

  function sendRegistrationDetailsEmail($user, $password, $companyBrand, $companyHost) {
    die2('not yet implemented');
  }

}
