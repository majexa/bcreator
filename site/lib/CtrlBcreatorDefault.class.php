<?php

class CtrlBcreatorDefault extends CtrlBcreatorLanding {

  protected function getParamActionN() {
    return 0;
  }

  const HOMEPAGE_USER_ID = 3;

  function action_default() {
    $this->d['tpl'] = 'landing/home';
    $this->d['menu'][0]['active'] = true;
    $this->d['banners'] = [];
    foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', self::HOMEPAGE_USER_ID) as $v) {
      $banner = new BcBanner($v);
      list($banner->r['w'], $banner->r['h']) = getimagesize($banner['downloadFile']);
      if ($banner->r['h'] > 250) {
        //$banner->r['w'] = round($banner->r['w'] * 150 / $banner->r['h']);
      }
      $this->d['banners'][] = $banner->r;
    }
    $this->setPageTitle('Home');
  }

  function action_registrationComplete() {
    $this->d['tpl'] = 'landing/basic';
    $this->setPageTitle('Registration Complete');
    $this->d['html'] = 'Congratulations! Your access details to '.SITE_TITLE.' have been sent to your email address!';
  }

  function action_json_trialDialog() {
    if ($rendersLimit = db()->selectCell('SELECT rLimit FROM renderLimits WHERE userId=?d', Auth::get('id'))) {
    } else {
      $rendersLimit = BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT;
    }
    $leftCount = $rendersLimit - //
      db()->selectCell("SELECT cnt FROM renderCounts WHERE userId=?d", //
        Misc::checkEmpty(Auth::get('id')));
    $this->json['cnt'] = $leftCount;
    $this->json['text'] = '<p>You have '.($leftCount ? $leftCount.' renders left' : 'no renders'). //
      ' as part of your Trial account. Are you sure you want to render?</p>'. //
      '<p><a href="/ipn/trialExpiration">Upgrade your account here</a></p>';
  }

}
