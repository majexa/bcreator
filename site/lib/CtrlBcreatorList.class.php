<?php

class CtrlBcreatorList extends CtrlBcreatorLanding {

  function action_default() {
    if (!Auth::get('id')) {
      header('Location: /');
      return;
    }
    $this->d['innerTpl'] = 'landing/list';
    $this->d['menu'][2]['active'] = true;
  }

  function action_create() {
    $this->setPageTitle('Create new');
    $this->d['menu'][1]['active'] = true;
    $form = new Form([
      [
        'title'   => 'Banner Size',
        'name'    => 'size',
        'required' => true,
        'type'    => 'select',
        'options' => CtrlSdCpanel::getSizeOptions()
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

}