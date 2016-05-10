<!DOCTYPE HTML>
<html xml:lang="en" lang="en" dir="ltr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title><?= SITE_TITLE ?></title>
  <meta name="description"
        content="Easy Landing page creator lets you create beautiful landing - squeeze pages for your social media, email and online marketing campaigns using an easy step-by-step process. Sign up now!">
  <meta name="keywords"
        content="easy landing page creator, landing pages, landing page, instapage, unbounce, squeeze,fanpage, social media,facebook landing page, step-by-step,slpash,how to make, website design, how to build a website, landing pages, landing page design, create a web page, "/>
  <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1">
  {sflm}
  <link rel="stylesheet" href="/public/css/font-awesome.min.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/overall.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/index2.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/style.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/my-bootstrap-tab.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/lightbox.min.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/my-bootstrap-form.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/select_landing_page.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/dialog.css" type="text/css"/>
  <link rel="shortcut icon" href="/favicon.ico"/>
</head>
<body>

<div id="page">
  <div id="header" class="header full">
    <div class="block">
      <div class="logo">
        <a href="/"><img src="/public/images/images_new/logo.png" alt=""></a>
      </div>
      <div class="right">
        <div class="sign">
          <? if (Auth::get('id')) { ?>
            <div class="item"><a href="/list/create" class="link">Create New</a></div>
            <div class="item"><a href="/list" class="link">My banners</a></div>
            <div class="item"><a href="/profile" class="link">Profile</a></div>
            <div class="item">|</div>
            <div class="item"><?= Auth::get('name') ?> <span class="link">(<a href="?logout=1">Logout</a>)</span></div>
          <? } else { ?>
            <div class="item"><a href="/signin" class="link"><span class="fa fa-sign-in"></span>SIGN IN</a></div>
            <div class="item"><a href="https://www.jvzoo.com/b/0/183117/1" class="link"><span
                  class="fa fa-unlock-alt"></span>REGISTER</a></div>
          <? } ?>
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="clearfix"></div>
    </div>
  </div>

  <? $this->tpl($d['tpl'], $d) ?>

  <div class="footer full">
    <div class="block">
      <div class="left">
        <div class="logo">
          <img src="/public/images/images_new/logo.png" alt="">
        </div>
        <div class="quote">© 2016 Easy Landing Page Creator, All rights reserved</div>
        <div class="links">
          <a href="/index/privacy" class="link">Privacy Policy</a>
          <a href="/index/terms" class="link">Terms of Service</a>
          <a href="/index/support" class="link">Contact Us</a>
        </div>
      </div>
      <div class="clearfix"></div>
    </div>
    <div class="blue_back"></div>
  </div>
</div>
</body>
</html>
