<? $this->tpl('head', $d) ?>
<body>
<div class="body">
  <? if (!strstr($d['ctrlName'], 'Cpanel')) { ?>
    <div style="padding: 10px 50px;">
      Banner Creator Tool
      <? $this->tpl('auth/login') ?>
      <? if (Auth::get('id')) { ?>
        <a href="/list">Мои баннеры</a>
      <? } ?>
      <? $this->tpl($d['tpl'], $d) ?>
    </div>
  <? }
  else { ?>
    <? $this->tpl($d['tpl'], $d) ?>
  <? } ?>
</div>
</body>
</html>
