<?php

class BcreatorRouter extends SdRouter {

  protected function getFrontendName() {
    if (isset($this->req->params[0]) and ($this->req->params[0] == 'cpanel' or $this->req->params[0] == 'pageBlock')) {
      return 'cpanel';
    } else {
      return 'default';
    }
  }

}