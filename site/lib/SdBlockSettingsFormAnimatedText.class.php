<?php

class SdBlockSettingsFormAnimatedText extends SdBlockSettingsFormFontBase {

  protected $fontFieldType = 'fontFamilyCufon';

  protected function getInitFields() {
    return array_merge(Arr::injectAfter(parent::getInitFields(), 1, [
      [
        'title' => 'Shadow',
        'type'  => 'boolCheckbox',
        'name'  => 'shadow'
      ],
    ]), [
      [
        'type' => 'fieldList',
        'name' => 'text'
      ]
    ]);
  }

}