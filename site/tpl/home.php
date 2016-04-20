<? if (Auth::get('id')) { ?>
  Logged in as <?= Auth::get('name') ?>, <?= Auth::get('email') ?>. <a href="?logout=1">Logout</a>
<? } ?>

<ul class="menu">
  <li><a href="/list/create">Create New</a></li>
  <li><a href="/list">My banners</a></li>
  <li><a href="/profile">Profile</a></li>
</ul>

<div class="apeform">
  <h2>Sign In</h2>
  <?= $d['signInForm'] ?>
</div>

<div class="apeform">
  <h2>Password Rcovery</h2>
  <?= $d['passwordRecoveryForm'] ?>
</div>
<div class="apeform">
  <h2>Sign Up</h2>
  <?= $d['signUpForm'] ?>
</div>
