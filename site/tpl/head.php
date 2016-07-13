<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title><?= $d['pageHeadTitle'] ?></title>
  {sflm}
  <? if (strstr($d['ctrlName'], 'Default')) { ?>
    <link rel="stylesheet" type="text/css" href="/m/css/home.css" media="screen, projection"/>
  <? } ?>
  <? if (strstr($d['ctrlName'], 'Cpanel')) { ?>
    <link rel="stylesheet" type="text/css" href="/sd/css/edit.css" media="screen, projection"/>
    <link rel="stylesheet" type="text/css" href="/m/css/edit.css" media="screen, projection"/>
  <? } ?>
  <script>
    Ngn.sd.barsClass = Ngn.sd.BcreatorBars;
    Ngn.sd.isTrialUser = true;
    Locale.use('en-US');
    window.addEvent('sdAfterInit', function(bannerId) {
      new Ngn.sd.BannersBar();
    });
  </script>
</head>

