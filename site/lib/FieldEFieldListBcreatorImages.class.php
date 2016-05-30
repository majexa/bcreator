<?php

class FieldEFieldListBcreatorImages extends FieldEFieldList {

  protected function defineOptions() {
    return array_merge(parent::defineOptions(), [
      'fieldSetJsClass' => 'Ngn.Frm.FieldSetBcreatorImages',
      'jsOptions' => [
        //'deleteImageUrl' => '/asd/'
      ]
    ]);
  }

}