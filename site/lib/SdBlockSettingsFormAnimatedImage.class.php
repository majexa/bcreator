<?php

class SdBlockSettingsFormAnimatedImage extends SdBlockSettingsFormBase {

//  protected function defineOptions() {
//    return array_merge(parent::defineOptions(), [
//      'dataParams' => [
//        'class' => 'sd.AnimatedImageSettingsForm'
//      ]
//    ]);
//  }

  protected function getInitFields() {
    return [
      [
        'type' => 'fieldListBcreatorImages',
        'name' => 'image',
        'fieldsType' => 'image',
        'fieldSetJsClass' => 'Ngn.sd.FieldSetAnimatedImages',
        'jsOptions' => [
          'deleteImageUrl' => '/pageBlock/'.$this->block->bannerId.'/json_deleteImage/'.$this->block->id.'/{n}'
        ]
      ]
    ];
  }

  protected function init() {
    if (isset($this->block['data']['images'])) {
      $this->setElementsData([
        'image' => $this->block['data']['images']
      ]);
    }
    UploadTemp::extendFormOptions($this, '/pageBlock/'.$this->block->bannerId.'/json_imageMultiUpload/'.$this->block->id);
  }

}