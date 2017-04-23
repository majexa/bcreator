<?php

class TestPages extends ProjectTestCase {

  protected $domain;

  function test() {
    $projects = require NGN_ENV_PATH.'/config/projects.php';
    $this->domain = Arr::getSubValue($projects, 'name', PROJECT_KEY, 'domain');
    $this->checkPage('/');
    $this->checkPage('/list');
    $this->checkPage('/admin');
  }

  function checkPage($url) {
    $base = 'http://'.$this->domain;
    $url = $base.$url;
    $r = O::get('Curl')->get($url, true);
    $this->assertTrue((bool)strstr($r[0], '200 OK'), "$url is not available. Page contents:\n===============\n{$r[1]}\n===============");
    //$this->assertFalse((bool)strstr($r[1], '<b>Warning</b>'), "$url has warning");
    $this->assertFalse((bool)strstr($r[1], '<b>Fatal error</b>'), "$url has fatal error\n".$r[1]);
  }

}