<?php

class SdPageBlockItemAnimatedText extends SdPageBlockItem {

  function framesNumber() {
    if (empty($this->r['data']['font']) or empty($this->r['data']['font']['text'])) return 1;
    return count($this->r['data']['font']['text']);
  }

}