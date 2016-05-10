<?php

class CtrlBcreatorResetPassword extends CtrlCommonUserLostPass {

  protected function getParamActionN() {
    return 1;
  }

  protected function init() {
    $this->d['mainTpl'] = 'landing/main';
    $this->d['tpl'] = 'landing/inner';
    $this->d['innerTpl'] = 'landing/dummy';
    $this->d['menu'] = [
      [
        'title' => 'HOME',
        'link' => '/'
      ],
      [
        'title' => 'CREATE NEW',
        'link' => '/list/create'
      ],
      [
        'title' => 'MY BANNERS',
        'link' => '/list'
      ],
      [
        'title' => 'SUPPORT',
        'link' => '/support'
      ],
      [
        'title' => 'PROFILE',
        'link' => '/profile'
      ]
    ];
  }

  function action_default() {
    parent::action_default();
    $this->d['innerTpl'] = 'landing/form';
  }

  protected function getLostPassForm() {
    return BcreatorCore::extendForm(parent::getLostPassForm());
  }

}