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
    Sflm::frontend('js')->addPath('sd/js/plugins/download.js');
  }

  const TEMPLATE_USER_ID = 2;

  function action_ajax_buttonSelect() {
    foreach (BcCore::zukulDb()->select("SELECT * FROM bannerButton") as $v) {
      print "<img src='/u/bcImagesCache/bannerButton/{$v['filename']}'>\n";
    }
  }

  function action_ajax_clipartSelect() {
    foreach (glob(UPLOAD_PATH.'/bcImagesCache/bannerImage/*') as $file) {
      print '<img src="/u/bcImagesCache/bannerImage/'.basename($file).'">';
    }
  }

  function action_ajax_templateSelect() {
    foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d AND size=? AND dateRender!=?', //
      self::TEMPLATE_USER_ID, $this->banner['size'], '0000-00-00 00:00:00') as $v) {
      $path = BcCore::getPath($v['id']);
      if (file_exists(UPLOAD_PATH.$path)) {
        print "<img src='".'/'.UPLOAD_DIR.$path."'>\n";
      }
    }
  }

}
