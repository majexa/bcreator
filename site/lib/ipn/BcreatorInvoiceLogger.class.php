<?php

class BcreatorInvoiceLogger implements \Engine\IPN\ILogger {
  function log($message, $context = []) {
    LogWriter::str('invoice', $message);
  }

  function getLastMessage() {
    return 'Last Message';
  }
}