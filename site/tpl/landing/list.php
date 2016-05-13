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
  .table {
    margin: auto;
    float: left;
  }
  .table th {
    background: #353535;
    color: #fff;
    border-right: 1px solid #5d5d5d;
  }
  .table td, .table th {
    padding: 5px 10px;
  }
  .table td {
    border-right: 1px solid #e8e8e8;
  }
  .table tr:nth-child(odd) {
    background: #eaeaea;
  }
  .table .preview img {
    max-height: 100px;
    max-width: 200px;
  }
</style>

<div class="subtitle">
  Create your own banners, Build, publish.
  Try Banner Creator for free Check out features
</div>

<link rel="stylesheet" href="/public/css/my_landing_page.css" type="text/css"/>
<div class="button">
  <a href="/list/create" class="link"><span class="fa fa-files-o"></span>Create New Banner</a>
</div>

<div class="banner left">
  <p><a href="http://GuaranteedSignUpsSystem.com" target="_blank"><img alt="" src="http://admin.easylandingpagecreator.com/public/uploads/64529_125x125.gif" style="width: 125px; height: 125px;" /></a></p>
  <p><a href="http://GuaranteedSignUpsSystem.com" target="_blank"><img alt="" src="http://admin.easylandingpagecreator.com/public/uploads/64527_120x600.gif" style="width: 120px; height: 600px;" /></a></p>
  <a href="http://guaranteedsignupssystem.com/"><img src="/public/images/images_new/banners/2.png" alt=""></a>
</div>

<div class="table">
  <table>
  <tr>
    <th>Title</th>
    <th>Size</th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
  </tr>
  <? foreach ($d['banners'] as $v) { ?>
    <tr>
      <td>Banner ID=<?= $v['id'] ?></td>
      <td><?= $v['size'] ?></td>
      <td class="preview">
        <? if ($v['directLink']) { ?>
          <img src="<?= $v['directLink'] ?>">
        <? } ?>
      </td>
      <td>
        <? if ($v['downloadLink']) { ?>
          <a href="<?= $v['downloadLink'] ?>">Download</a>
        <? } else { ?>
          Need to render
        <? } ?>
      </td>
      <td><a href="/cpanel/<?= $v['id'] ?>" target="_blank">Edit</a></td>
      <td><a href="/list/delete/<?= $v['id'] ?>">Delete</a></td>
    </tr>
  <? } ?>
  </table>

  <div class="ban">
    <a href="http://guaranteedsignupssystem.com/" class="link"><img src="/public/images/images_new/banners/4.png" alt=""></a>
  </div>
</div>

<div class="banner right">
  <p><img alt="Advertise here click here for pricing" src="http://admin.easylandingpagecreator.com/public/uploads/Screen Shot 2015-09-17 at 22_29_20.png" style="width: 125px; height: 132px;" /></p>
  <p><a href="http://GuaranteedSignUpsSystem.com" target="_blank"><img alt="" src="http://admin.easylandingpagecreator.com/public/uploads/64527_120x600.gif" style="width: 120px; height: 600px;" /></a></p>
  <a href="http://guaranteedsignupssystem.com/"><img src="/public/images/images_new/banners/2.png" alt=""></a>
</div>

<div class="clearfix"></div>

