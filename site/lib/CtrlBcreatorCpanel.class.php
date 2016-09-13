<?php

class CtrlBcreatorCpanel extends CtrlSdCpanel {

  protected function afterInit() {
    parent::afterInit();
    Sflm::frontend('js')->addPath('sd/js/plugins/new.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/animatedText.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/animatedImage.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/background.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/button.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/clipart.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/fromTemplate.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/settings.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/renderTrial.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/download.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/undo.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/redo.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/urhkaeys.js');

  }

  protected function editPageTitle() {
    return $this->banner['title'].' ['.str_replace(' ', '', $this->banner['size']).']';
  }

  const TEMPLATE_USER_ID = 2;

  function action_ajax_backgroundSelect() {
    $size = BcCore::getSize($this->d['bannerId']);
    foreach (db()->selectCol("SELECT image FROM dd_i_backgrounds WHERE size=?", $size['w'].'x'.$size['h']) as $v) {
      print "<img src='/".UPLOAD_DIR.'/'.$v."'>\n";
    }
  }

  function action_json_createBackgroundBlock() {
    $data = CtrlSdPageBlock::protoData('background');
    $data['data']['backgroundUrl'] = $this->req->rq('backgroundUrl');
    $data['data']['size'] = BcCore::getSize($this->d['bannerId']);
    $data['data']['subType'] = 'image';
    $data['data']['bottom'] = true;
    $data['data']['single'] = true;
    (new SdPageBlockItems($this->d['bannerId']))->create($data);
  }

  function action_ajax_buttonSelect() {
    foreach (db()->selectCol("SELECT image FROM dd_i_buttons") as $v) {
      print "<img src='/".UPLOAD_DIR.'/'.$v."'>\n";
    }
  }

  function action_ajax_clipartSelect() {
    foreach (db()->selectCol("SELECT image FROM dd_i_clipart") as $v) {
      print "<img src='/".UPLOAD_DIR.'/'.$v."'>\n";
    }
  }

  function getPathforTemplate($bannerId) {
        $hasAnimation = (new SdPageBlockItems($bannerId))->hasAnimation();
        return '/banner/'. //
        ($hasAnimation ? //
            'animated/result/'.$bannerId.'.gif' : 'static/'.$bannerId.'.png');
    }

  function action_ajax_templateSelect() {
    foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d AND size=? AND dateRender!=?', //
      self::TEMPLATE_USER_ID, $this->banner['size'], '0000-00-00 00:00:00') as $v) {
      $path = self::getPathforTemplate($v['id']);
      if (file_exists(UPLOAD_PATH.$path)) {
        print "<img src='".'/'.UPLOAD_DIR.$path."'>\n";
      }
    }
  }

}
