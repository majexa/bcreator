<div class="profileBar">
  <div class="profileBarBg"></div>
  <div class="profileBarBody">
    <!--<div class="login">
      <div class="avatar"></div>
      <div class="name"><?= Auth::get('name') ?></div>
      <div class="email"><?= Misc::cut(Auth::get('email'), 10) ?></div>
    </div>-->
    <!--<div class="dropdown">-->
    <div style="margin-top: 23px; margin-left: 55px;">
      <a href="/?logout=1" class="logout"><i></i><span>Logout</span></a>
    </div>
  </div>
</div>
<script>
  window.addEvent('sdAfterInit', function() {
    document.getElement('.profileBar').inject(Ngn.sd.ePanel);
  });
</script>

<? $this->tpl('inner', $d, false, 1) ?>
