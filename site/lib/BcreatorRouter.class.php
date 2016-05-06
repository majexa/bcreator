<?php

class BcreatorRouter extends SdRouter {

  protected function getFrontendName() {
    if (isset($this->req->params[0]) and $this->req->params[0] == 'cpanel') {
      return 'cpanel';
    } else {
      return 'default';
    }
  }

}