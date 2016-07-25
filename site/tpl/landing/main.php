<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title><?= $d['pageHeadTitle'] ?></title>
  <meta name="description"
        content="Easy Landing page creator lets you create beautiful landing - squeeze pages for your social media, email and online marketing campaigns using an easy step-by-step process. Sign up now!">
  <meta name="keywords"
        content="easy landing page creator, landing pages, landing page, instapage, unbounce, squeeze,fanpage, social media,facebook landing page, step-by-step,slpash,how to make, website design, how to build a website, landing pages, landing page design, create a web page, "/>
  <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1">
  {sflm}
  <style>
  </style>
</head>

<body>

<div class="container<?= ($d['ctrlName'] == 'bcreatorDefault' and $d['action'] == 'default') ? ' home' : '' ?>">
  <div class="span-24 last head">
    <div class="cont">
      <a href="/" class="logo"><img src="/m/img/landing/logo.png"></a>
    </div>
    <div class="auth">
      <? if (!Auth::get('id')) { ?>
        <a href="/signin">SIGN IN</a>
        &nbsp;|&nbsp;
        <a href="/register">REGISTER</a>
      <? } else { ?>
        <a href="?logout=1" class="link">SIGN OUT</a>
      <? } ?>
    </div>
    <? if (Auth::get('id')) { ?>
    <div class="menu">
      <ul>
        <? foreach ($d['menu'] as $i => $v) { ?>
          <li id="m<?= $i + 1 ?>"<?= $v['active'] ? ' class="active"' : '' ?>>
            <a href="<?= $v['link'] ?>"><?= $v['title'] ?></a>
            <? if ($v['menu']) { ?>
              <ul>
                <? foreach ($v['menu'] as $ii => $vv) { ?>
                <li>
                  <a href="<?= $vv['link'] ?>"><?= $vv['title'] ?></a>
                </li>
                <? } ?>
              </ul>
            <? } ?>
          </li>
        <? } ?>
      </ul>
    </div>
    <? } ?>
  </div>
  <div class="span-24 last content">
    <? $this->tpl($d['tpl'], $d) ?>
  </div>
  <div class="span-24 last footer">
    <div class="cont">
      <p>
        <a href="">Privacy Policy</a> |
        <a href="">Terms of Service</a> |
        <a href="">Contact Us</a>
      </p>
      <p>
        &copy; 2016 Banner Creator, All rights reserved
      </p>
    </div>
  </div>
</div>
</body>
</html>

