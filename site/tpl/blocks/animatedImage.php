<? if ($d['data']['images']) { ?>
  <? foreach ($d['data']['images'] as $url) { ?>
    <div><img src="<?= $url ?>?<?= md5($d['dateUpdate']) ?>"></div>
  <? } ?>
<? } ?>
