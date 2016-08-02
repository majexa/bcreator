<?php

class InvoiceForm extends Form {

  protected $id, $userId;

  function __construct($userId, $id = null) {
    $this->id = $id;
    $this->userId = $userId;
    parent::__construct([
      [
        'type' => 'staticText',
        'text' => 'For user <b>' . DbModelCore::get('users', $userId)['name'] . '</b>'
      ],
      [
        'title' => 'Amount',
        'required' => true,
        'name' => 'amount',
        'type' => 'float'
      ],
      [
        'title' => 'Action',
        'name' => 'invoiceAction',
        'type' => 'select',
        'default' => 'manual',
        'required' => true,
        'options' => [
          'register' => 'Payment on user registration',
          'manual' => 'Manual creation by admin'
        ]
      ],
      [
        'title' => 'Reason',
        'name' => 'reason',
      ]
    ], [
      'title' => 'Invoice '.($this->id ? 'edit' : 'creation')
    ]);
    if ($this->id) {
      $r = db()->selectRow("SELECT * FROM invoice WHERE id=?d", $this->id);
      $comments = json_decode($r['comments'], true);
      $r['invoiceAction'] = $comments['action'];
      $r['reason'] = $comments['reason'];
      $this->setElementsData($r);
    }
  }

  protected function _update(array $data) {
    $data['dateCreate'] = $data['dateUpdate'] = Date::db();
    if ($this->id) $data['id'] = $this->id;
    $data['userId'] = $this->userId;
    $data['comments']['action'] = $data['invoiceAction'];
    $data['comments']['reason'] = $data['reason'];
    $data['referenceNumber'] = '';
    unset($data['reason']);
    unset($data['invoiceAction']);
    $data['comments'] = json_encode($data['comments']);
    $data['dueDate'] = Date::db(time() + 60 * 60 * 24 * 30);
    db()->insert('invoice', $data, Db::modeUpdateOnDuplicateKey);
  }

}