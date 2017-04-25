<?php

class CtrlBcreatorList extends CtrlDefault {
  use CrudItemsCtrl;

  protected function _items() {
    $items = new DbItems('sdDocuments');
    $items->hasPagination = true;
    return $items;
  }

  protected function id() {
    return $this->req->params(2);
  }

  protected function getGrid() {
    return new GridData(new Fields([[
      'name' => 'title',
      'title' => 'Title'
    ]]), $this->items());
  }

  function action_default() {
    $this->d['list'] = db()->query("SELECT * FROM sdDocuments");
    $this->d['tpl'] = 'landing/list';
  }

}