<?php

class CtrlBcreatorList extends CtrlBcreatorLanding {

  function action_default() {
    if (!Auth::get('id')) {
      header('Location: /');
      return;
    }
    $this->d['banners'] = [];
    foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', Auth::get('id')) as $v) {
      $this->d['banners'][] = new BcBanner($v);
    }
    $this->d['innerTpl'] = 'landing/list';
    $this->d['menu'][2]['active'] = true;
  }

  function action_create() {
    $this->setPageTitle('Create new');
    $this->d['menu'][1]['active'] = true;
    $form = new Form([
      [
        'title'    => 'Banner Size',
        'name'     => 'size',
        'required' => true,
        'type'     => 'select',
        'options'  => CtrlSdCpanel::getSizeOptions()
      ]
    ], [
      'title'       => 'Create banner...',
      'submitTitle' => 'Create'
    ]);
    if ($form->isSubmittedAndValid()) {
      $id = BcCore::createBanner($form->getData()['size']);
      $this->redirect('/cpanel/'.$id);
      return;
    }
    $this->d['form'] = BcreatorCore::extendForm($form)->html();
    $this->d['innerTpl'] = 'landing/form';
  }

  function action_delete() {
    $this->d['banner'] = Misc::checkEmpty(db()->selectRow('SELECT * FROM bcBanners WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    $this->d['banner']['title'] = 'ID='.$this->d['banner']['id'];
    $this->d['innerTpl'] = 'landing/delete';
  }

  function action_deleteConfirmed() {
    db()->query('DELETE FROM bcBanners WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id'));
    $this->redirect('/list');
  }

  function action_download() {
    $banner = new BcBanner(db()->selectRow('SELECT * FROM bcBanners WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    Misc::checkEmpty($banner['downloadFile']);
    header('Content-Type: application/image');
    header('Content-Disposition: attachment;filename="'.basename($banner['downloadFile']).'"');
    readfile($banner['downloadFile']);
  }

}