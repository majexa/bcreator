<?php

class CtrlBCreatorLanding extends CtrlBase {

  protected function init() {
    Sflm::frontend('css')->addPath('i/css/common.css');
    Sflm::frontend('css')->addPath('i/css/common/screen.css');
    Sflm::frontend('css')->addPath('i/css/common/layout.css');
    Sflm::frontend('css')->addPath('i/css/common/layout.css');
    Sflm::frontend('css')->addPath('m/css/landing/design.css');
    Sflm::frontend('css')->addPath('m/css/landing/home.css');
    Sflm::frontend('css')->addPath('m/css/landing/form.css');
    Sflm::frontend('css')->addPath('m/css/landing/table.css');
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