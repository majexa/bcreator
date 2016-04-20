<?php

class CtrlBcreatorCpanel extends CtrlSdCpanel {

  protected function afterInit() {
    parent::afterInit();
    foreach ([
      'new',
      'text',
      'image',
      'new',
      'background',
      'button',
      'clipart',
      'fromTemplate',
      'settings',
      'render'
    ] as $plugin) {
      Sflm::frontend('js')->addPath('sd/js/plugins/'.$plugin.'.js');
    }
  }

}