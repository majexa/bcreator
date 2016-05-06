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

<div class="bannersList">
  <? foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', Auth::get('id')) as $v) { ?>
    <a href="/cpanel/<?= $v['id'] ?>"><span>Banner ID=<?= $v['id'] ?><br>(<?= $v['size'] ?>)</span></a>
  <? } ?>
</div>

<div class="bootstrap-button">
  <a href="#" id="create" class="btn btn-submit">Create New</a>
</div>

<script>
  var create = function() {
    new Ngn.Dialog.RequestForm({
      url: '/newBanner',
      width: 200,
      onSubmitSuccess: function(r) {
        window.location = '/cpanel/' + r.id;
      }
    });
    return false;
  };
  create();
  //$('create').addEvent('click', create);
  <? if ($d['params'][1] == 'create') { ?>
  create();
  <? } ?>
</script>
