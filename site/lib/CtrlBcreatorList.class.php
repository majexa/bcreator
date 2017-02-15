<?php

class CtrlBcreatorList extends CtrlBcreatorLanding {

  function checkUser() {
      if (!Auth::get('id')) {
          $this->redirect('/');
          return;
      }
  }

  function action_default() {
    self::checkUser();
    Sflm::frontend('css')->addLib('i/css/common/tips.css');
    $this->setPageTitle('My Banners');
    $this->d['banners'] = [];
    foreach (db()->select('SELECT * FROM sdDocuments WHERE userId=?d', Auth::get('id')) as $v) {
      $this->d['banners'][] = new BcBanner($v);
    }
    $this->d['innerTpl'] = 'landing/list';
    $this->d['menu'][2]['active'] = true;
  }

  function action_create() {
    self::checkUser();
    $this->setPageTitle('Create new');
    $this->d['menu'][1]['active'] = true;
    $form = new BannerSettingsCreationForm;
    if ($form->update()) {
      $this->redirect('/cpanel/'.$form->createdId);
      return;
    }
    $this->d['form'] = BcreatorCore::extendForm($form)->html();
    $this->d['innerTpl'] = 'landing/form';
  }

  function action_delete() {
    self::checkUser();
    $this->d['banner'] = Misc::checkEmpty(db()->selectRow('SELECT * FROM sdDocuments WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    //$this->d['banner']['title'] = 'ID='.$this->d['banner']['id'];
    $this->d['innerTpl'] = 'landing/delete';
  }

  function action_deleteConfirmed() {
    self::checkUser();
    $this->redirect('/list');
  }

  function action_download() {
    self::checkUser();
    $banner = new BcBanner(db()->selectRow('SELECT * FROM sdDocuments WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    Misc::checkEmpty($banner['downloadFile']);
    header('Content-Type: application/image');
    header('Content-Disposition: attachment;filename="'.basename($banner['downloadFile']).'"');
    readfile($banner['downloadFile']);
  }

}