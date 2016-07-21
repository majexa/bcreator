<?php

class CtrlBCreatorLandingOld extends CtrlBase {

  protected function init() {
    $this->d['mainTpl'] = 'landing/main';
    $this->d['tpl'] = 'landing/inner';
    $this->d['menu'] = [
      [
        'title' => 'HOME',
        'link'  => '/'
      ],
      [
        'title' => 'CREATE NEW',
        'link'  => '/list/create'
      ],
      [
        'title' => 'MY BANNERS',
        'link'  => '/list'
      ],
      [
        'title' => 'SUPPORT',
        'link'  => '/support'
      ],
      [
        'title' => 'PROFILE',
        'link'  => '/profile'
      ],
      [
        'title' => 'MARKETING',
        'name' => 'marketing',
        'link'  => '#',
        'menu' => [
          [
            'title' => 'Create a Landing Page',
            'link'  => '/index/marketing/createLandingPage',

          ],
          [
            'title' => 'Track Your Banner',
            'link'  => '/index/marketing/trackYourBanner',
          ],
          [
            'title' => 'Advertise Your Banner',
            'link'  => '/index/marketing/advertiseYourBanner',
          ],
        ]
      ]
    ];
  }

}