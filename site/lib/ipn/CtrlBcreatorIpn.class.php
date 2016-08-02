<?php

class CtrlBcreatorIpn extends CtrlBcreatorLanding {

  function action_trialExpiration() {
    $this->d['innerTpl'] = 'landing/ipn/trialExpiration';
  }

  function action_handleDummyInvoice() {
    $userId = Misc::checkEmpty(Auth::get('id'));
    $invoice['id'] = db()->insert('invoice', [
      'userId'          => $userId,
      'referenceNumber' => 'dummy',
      'amount'          => 1,
      'dateCreate'      => Date::db(),
      'dueDate'         => Date::db(time() + 60 * 60 * 24 * 30),
      'comments'        => json_encode(['action' => 'dummy'])
    ]);
    $this->redirect('/ipn/dummyInvoiceSuccess');
  }

  function action_dummyInvoiceSuccess() {
    $this->d['innerTpl'] = 'landing/ipn/success';
  }

  function action_handleInvoice() {
    $this->hasOutput = false;
    //
    $secretKey = 'asdasd';
    $ctransaction = 'SALE';
    $cverify = 'F19A5426';
    //
    $request = [
      'caffitid'            => '0',
      'ccustcc'             => 'GB',
      'ccustemail'          => 'demo@mailinator.com',
      'ccustname'           => 'demo',
      'ccuststate'          => '',
      'cproditem'           => '0',
      'cprodtitle'          => 'Demo Transaction',
      'cprodtype'           => 'RECURRING',
      'ctransaction'        => $ctransaction,
      'ctransaffiliate'     => '0',
      'ctransamount'        => '0.0',
      'ctranspaymentmethod' => 'PYPL',
      'ctransreceipt'       => '0000000000000000',
      'ctranstime'          => '1467813286',//(string)time(),
      'ctransvendor'        => '69721',
      'cupsellreceipt'      => '',
      'cvendthru'           => '',
      'cverify'             => $cverify,
    ];
    $this->ajaxOutput = (new \Engine\IPN\PaymentManager(new BcreatorUserManager, //
      new BcreatorInvoiceManager, //
      new BcreatorInvoiceLogger, //
      'zukulBannerCreator', //
      SITE_DOMAIN //
    ))->process( //
      $request, //
      new \Engine\IPN\Adapter\PaymentSystem\JVZoo($secretKey) //
    ) ? 'success' : 'failed';
  }

}