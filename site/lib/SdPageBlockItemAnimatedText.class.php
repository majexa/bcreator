<?php

class SdPageBlockItemAnimatedText extends SdPageBlockItem {

  function framesNumber() {
    if (empty($this->r['data']['images'])) return 1;
    return count($this->r['data']['font']['text']);
  }

}