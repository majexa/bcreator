<legend>Password Recovery</legend>

<? if ($d['action'] == 'complete') { ?>
  <p><?= Lang::get('emailSent') ?></p>
<? } elseif ($d['action'] == 'failed') { ?>
  <p><?= Lang::get('sendError') ?></p>
<? } else { ?>
  <div class="apeform"><?= $d['form'] ?></div>
<? } ?>
