<?php

class SdPageBlockItemAnimatedImage extends SdPageBlockItem {

  function framesNumber() {
    return count($this->r['data']['images']);
  }

}