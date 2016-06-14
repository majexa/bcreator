<?php

class SdPageBlockItemAnimatedText extends SdPageBlockItem {

  function framesNumber() {
    return count($this->r['data']['font']['text']);
  }

}