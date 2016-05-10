<legend>My banners</legend>

<style>
  .bannersList {
    padding-bottom: 20px;
  }
  .bannersList a {
    text-align: center;
    color: #555;
    font-size: 11px;
    display: inline-block;
    border: 1px solid #ccc;
    background: #fff;
    width: 100px;
    height: 100px;
    margin: 0 10px 10px 0;
  }
  .bannersList a:hover {
    border-color: #555;
  }
  .bannersList span {
    display: block;
    margin-top: 40px;
  }
  .dialog {
    background: #fff;
  }
</style>

<link rel="stylesheet" href="/public/css/my_landing_page.css" type="text/css"/>
<div class="button">
  <a href="/list/create" class="link"><span class="fa fa-files-o"></span>Create New Banner</a>
</div>

<div class="bannersList">
  <? foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', Auth::get('id')) as $v) { ?>
    <a href="/cpanel/<?= $v['id'] ?>"><span>Banner ID=<?= $v['id'] ?><br>(<?= $v['size'] ?>)</span></a>
  <? } ?>
</div>

