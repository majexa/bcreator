<?php

class BcreatorInvoiceManager implements \Engine\IPN\IInvoiceManager {

  function createInvoice($userId, $recieptId, $amount, \DateTime $transactionTime, \DateInterval $expirationPeriod, array $paymentDetails) {
    $invoice = [
      'userId'          => $userId,
      'referenceNumber' => $recieptId,
      'amount'          => $amount,
      'dateCreate'      => Date::db(),
      'dueDate'         => Date::db(time() + 60 * 60 * 24 * 7),
      'comments'        => json_encode($paymentDetails)
    ];
    $invoice['id'] = db()->insert('invoice', $invoice);
    return $invoice;
  }

  function getUserInvoicesMaxDateTimeEnd($userId) {
    return \DateTime::createFromFormat('Y-m-d H:i:s', time() + 60 * 60 * 7, new \DateTimeZone('UTC'));
  }

  function getUserInvoicesDateTimeLeft($userId, $from = null) {
    if (!$from) {
      $from = new \DateTime();
    }
    $to = $this->getUserInvoicesMaxDateTimeEnd($userId);
    if (!$to or ($to <= $from)) {
      return new \DateInterval('P0D'); // zero-interval
    }
    return $from->diff($to);
  }
}
