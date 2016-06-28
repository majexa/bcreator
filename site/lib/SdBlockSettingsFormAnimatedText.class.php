<?php

class SdBlockSettingsFormAnimatedText extends SdBlockSettingsFormFontBase {

  protected $fontFieldType = 'fontFamilyCufon';

  protected function getInitFields() {
    return array_merge([
      [
        'type' => 'fieldList',
        'name' => 'text',
        'fieldSetJsClass' => 'Ngn.sd.FieldSetAnimatedText',
        'placeholder' => 'Write your text here'
      ]
    ], array_merge(Arr::injectAfter(parent::getInitFields(), 1, [
      [
        'title' => 'Shadow',
        'type'  => 'boolCheckbox',
        'name'  => 'shadow'
      ],
    ])));
  }

}