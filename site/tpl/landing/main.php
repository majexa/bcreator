<!DOCTYPE HTML>
<html xml:lang="en" lang="en" dir="ltr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title><?= $d['pageHeadTitle'] ?></title>
  <meta name="description"
        content="Easy Landing page creator lets you create beautiful landing - squeeze pages for your social media, email and online marketing campaigns using an easy step-by-step process. Sign up now!">
  <meta name="keywords"
        content="easy landing page creator, landing pages, landing page, instapage, unbounce, squeeze,fanpage, social media,facebook landing page, step-by-step,slpash,how to make, website design, how to build a website, landing pages, landing page design, create a web page, "/>
  <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1">

  <link href="/public/css/colorbox.css" rel="stylesheet" type="text/css"/>
  <link rel="stylesheet" href="/public/css/owl.carousel.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/font-awesome.min.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/overall.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/style.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/index2.css" type="text/css"/>
  <link href="/public/css/magnific-popup.css" rel="stylesheet" type="text/css"/>
  <link href="/public/css/bepopup.css" rel="stylesheet" type="text/css"/>
  <link rel="stylesheet" href="/public/css/my-bootstrap-form.css" type="text/css"/>
  <link rel="stylesheet" href="/public/css/select_landing_page.css" type="text/css"/>

  <!--
  <script type="text/javascript" src="/public/js/jquery-1.12.1.min.js"></script>
  <script type="text/javascript" src="/public/js/jquery.validate.js"></script>
  <script type="text/javascript" src="/public/js/magnific-popup.js"></script>
  <script type="text/javascript" src="/public/js/jquery.bpopup.min.js"></script>
  <script type="text/javascript" src="/public/js/jquery.colorbox.js"></script>
  <script type="text/javascript" src="/public/js/script.js"></script>
  -->

  {sflm}
  <link href="/m/css/landing/dialog.css" rel="stylesheet" type="text/css"/>
  <link href="/m/css/landing/form.css" rel="stylesheet" type="text/css"/>

  <script>
    (function(i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r;
      i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments)
      }, i[r].l = 1 * new Date();
      a = s.createElement(o), m = s.getElementsByTagName(o)[0];
      a.async = 1;
      a.src = g;
      m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-45506333-1', 'easylandingpagecreator.com');
    ga('send', 'pageview');
  </script>
  <link rel="shortcut icon" href="/favicon.ico"/>
</head>
<body>
<div id="container">
  <div id="header" class="header full">
    <div class="block">
      <div class="logo">
        <a href="/"><img src="/public/images/images_new/logo.png" alt=""></a>
      </div>

      <div id="access" class="right">
        <? if (!Auth::get('id')) { ?>
          <div class="sign">
            <div class="item"><a href="/signin" class="link"><span class="fa fa-sign-in"></span>SIGN IN</a></div>
            <div class="item"><a href="/register" class="link"><span
                  class="fa fa-unlock-alt"></span>REGISTER</a></div>
          </div>
        <? } else { ?>
          <style>
            .header .right .menu > ul > li {
              position: relative;
            }
            .header .right .menu > ul > li div {
              padding-top: 15px;
              position: absolute;
              top: 30px;
              left: 0;
              display: none;
            }
            .header .right .menu > ul > li:hover div {
              display: block;
            }
            .header .right .menu ul ul {
              background: #fff;
              border: 1px solid #cccccc;
              border-radius: 4px;
            }
            .header .right .menu ul ul li:first-child {
              border-top: none;
            }
            .header .right .menu ul ul li {
              white-space: nowrap;
              display: block;
              float: none;
            }
          </style>
          <div class="menu">
            <ul class="list">
              <? foreach ($d['menu'] as $i => $v) { ?>
                <li id="m<?= $i + 1 ?>"<?= $v['active'] ? ' class="active"' : '' ?>>
                  <a href="<?= $v['link'] ?>"><?= $v['title'] ?></a>
                  <? if ($v['menu']) { ?>
                    <div>
                    <ul>
                      <? foreach ($v['menu'] as $vv) { ?>
                        <li><a href="<?= $vv['link'] ?>"><?= $vv['title'] ?></a></li>
                      <? } ?>
                    </ul>
                    </div>
                  <? } ?>
                </li>
              <? } ?>
            </ul>
          </div>

          <div class="mobile_menu">
            <div class="icon">
              <a href="" class="link"><img src="/public/images/images_new/icons/menu.png" alt=""></a>
            </div>

            <ul class="list">
              <ul class="list">
                <? foreach ($d['menu'] as $i => $v) { ?>
                  <li id="m<?= $i + 1 ?>"<?= $v['active'] ? ' class="active"' : '' ?>>
                    <a href="<?= $v['link'] ?>"><?= $v['title'] ?></a>
                  </li>
                <? } ?>
              </ul>
              <li class="signup_item"><a href="?logout=1" class="link">SIGN OUT</a></li>
            </ul>
          </div>

          <div class="signup">
            <a href="?logout=1" class="link">SIGN OUT</a>
          </div>
        <? } ?>

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
          <a href="/support" class="link">Contact Us</a>
        </div>
      </div>

      <!--div class="menu">
          <div class="col">
              <div class="title">SITEMAP</div>
              <div class="links">
                  <div class="item"><a href="/">Home</a></div>
                  <div class="item"><a href="/creator/create/">Create New</a></div>
                  <div class="item"><a href="/creator/pages/">My Pages</a></div>
                  <div class="item"><a href="/profile">Profile</a></div>
              </div>
          </div>

          <div class="col">
              <div class="title">SUPPORT</div>
              <div class="links">
                  <div class="item"><a href="">Faqs</a></div>
                  <div class="item"><a href="">Contact Us</a></div>
                  <div class="item"><a href="">Call Now</a></div>
                  <div class="item"><a href="/index/privacy">Privacy Policy</a></div>
              </div>
          </div>

          <div class="col">
              <div class="title">COMPANY</div>
              <div class="links">
                  <div class="item"><a href="">About Us</a></div>
                  <div class="item"><a href="">Benefits</a></div>
                  <div class="item"><a href="">Careers</a></div>
                  <div class="item"><a href="">Event</a></div>
              </div>
          </div>

          <div class="clearfix"></div>
      </div-->


      <div class="clearfix"></div>

      <!--div class="bottom">
          © Copyright 2016 EasyLandingPagecreator.com & EasyLandingPagecreator.co.uk
      </div-->
    </div>

    <div class="blue_back"></div>
  </div>

</div>
</body>
</html>
