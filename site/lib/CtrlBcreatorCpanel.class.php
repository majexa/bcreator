<?php

class CtrlBcreatorCpanel extends CtrlSdCpanel {

  protected function afterInit() {
    parent::afterInit();
    Sflm::frontend('js')->addPath('sd/js/plugins/new.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/animatedText.js');
    Sflm::frontend('js')->addPath('m/js/bc/plugins/animatedImage.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/background.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/button.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/clipart.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/fromTemplate.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/settings.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/render.js');
    Sflm::frontend('js')->addPath('sd/js/plugins/download.js');
  }

}