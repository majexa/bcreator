<?php

$zukulBaseUrl = 'http://zukul.com/public/uploads';
$db = BcCore::zukulDb();

Dir::make(UPLOAD_PATH.'/bcImagesCache/bannerTemplate');
$r = $db->query("SELECT * FROM bannerTemplate");
$curl = new Curl;

$genImages = function ($keyword, $r) use ($zukulBaseUrl, $curl) {
  Dir::make(UPLOAD_PATH.'/bcImagesCache/'.$keyword);
  foreach ($r as $v) {
    output($zukulBaseUrl."/$keyword/".$v['filename']);
    $curl->copy($zukulBaseUrl."/$keyword/".$v['filename'], UPLOAD_PATH."/bcImagesCache/$keyword/".$v['filename']);
  }
};

// bannerImage
$genImages('bannerTemplate', BcCore::zukulDb()->select("SELECT * FROM bannerTemplate"));
$genImages('bannerButton', BcCore::zukulDb()->select("SELECT * FROM bannerButton"));
$ids = implode(', ', db()->ids('bcBannerButtonBroken'));
$genImages('bannerImage', BcCore::zukulDb()->select("SELECT * FROM bannerImage WHERE id NOT IN ($ids)"));
