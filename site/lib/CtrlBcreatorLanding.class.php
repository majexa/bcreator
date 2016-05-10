<?php

class CtrlBCreatorLanding extends CtrlBase {

  protected function init() {
    $this->d['mainTpl'] = 'landing/main';
    $this->d['tpl'] = 'landing/inner';
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

}