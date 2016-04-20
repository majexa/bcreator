<? $this->tpl('head', $d) ?>
<body>
<div class="body">
  <? if (!strstr($d['ctrlName'], 'Cpanel')) { ?>
    <div style="padding: 10px 50px;">
      <p><a href="/"><img src="/m/img/logo.png"></a></p>
      <? $this->tpl($d['tpl'], $d) ?>
    </div>
  <? }
  else { ?>
    <? $this->tpl($d['tpl'], $d) ?>
  <? } ?>
</div>
</body>
</html>
