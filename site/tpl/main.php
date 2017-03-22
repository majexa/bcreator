<? $this->tpl('head', $d) ?>
<body>
<div class="body">
  <? if (!strstr($d['ctrlName'], 'Cpanel')) { ?>
    <div style="padding: 10px 50px;">
      This is not cpanel
      <? $this->tpl($d['tpl'], $d) ?>
    </div>
  <? }
  else { ?>
    <? $this->tpl($d['tpl'], $d) ?>
  <? } ?>
</div>
</body>
</html>
