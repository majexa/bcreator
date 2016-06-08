<?php

class BcreatorRegistrationForm extends UserRegForm {

  protected function init() {
    BcreatorCore::extendForm($this);
  }

  protected function _update(array $data) {
    parent::_update($data);
    (new \Engine\IPN\Adapter\EngineMvc\InvoiceManager)->createInvoice( //
      $this->createdId, //
      bin2hex(openssl_random_pseudo_bytes(8)), //
      '0.0', //
      new \DateTime(), //
      new \DateInterval('P7D'), //
      [
        'module' => __CLASS__,
        'action' => 'register',
        'reason' => '7 days free trial'
      ]);
  }

}