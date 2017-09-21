<?php

class CtrlBcreatorList2 extends CtrlDefault {
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
    //Sflm::frontend('css')->addLib('dialog');
    //Sflm::frontend('css')->addLib('grid');
    //Sflm::frontend('css')->addLib('form');
    $this->d['list'] = db()->query("SELECT * FROM sdDocuments");
    $this->d['tpl'] = 'landing/list';
  }

  function action_json_new() {
    return new BannerSettingsCreationForm;
  }

}