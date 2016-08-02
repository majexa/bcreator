<?php

class CtrlAdminInvoices extends CtrlAdmin {

  protected function getParamActionN() {
    return 3;
  }

  protected $invoiceUserId;

  protected function init() {
    $this->invoiceUserId = $this->req->param(2);
    $this->setPageTitle('of user <b>'.DbModelCore::get('users', $this->invoiceUserId)['name']).'</b>';
  }

  protected function items() {
    if (isset($this->items)) return $this->items;
    $this->items = new DbItems('invoice', [
      'paginationOptions' => [
        'n' => 20
      ]
    ]);
    $this->items->addF('userId', $this->invoiceUserId);
    $this->items->hasPagination = true;
    return $this->items;
  }

  protected function getHead() {
    return ['Amount', 'Created', 'Due date', 'Comments'];
  }

  protected function renderComments($comments) {
    $comments = json_decode($comments, true);
    $r = '';
    foreach ($comments as $k => $v) {
      if (!$v) continue;
      $r .= "<b>$k:</b> $v<br>";
    }
    return $r;
  }

  protected function getData($item) {
    return [
      $item['amount'],
      $item['dateCreate'],
      $item['dueDate'],
      $this->renderComments($item['comments'])
    ];
  }

  function getGrid() {
    $items = $this->items()->getItems();
    return [
      'pagination' => $this->items()->getPagination(),
      'head'       => $this->getHead(),
      'body'       => array_map(function ($item) {
        return [
          'id'    => $item['id'],
          'tools' => [
            'delete' => Locale::get('delete'),
            'edit' => Locale::get('edit')
          ],
          'data'  => $this->getData($item)
        ];
      }, $items)
    ];
  }

  function action_default() {
    $this->d['grid'] = $this->getGrid();
  }

  function action_json_getItems() {
    $this->json['grid'] = $this->getGrid();
  }

  function action_json_edit() {
    return new InvoiceForm($this->userId, $this->req->rq('id'));
  }

  function action_json_new() {
    return new InvoiceForm($this->userId);
  }


}

CtrlAdminInvoices::$properties['title'] = Locale::get('invoices', 'admin');