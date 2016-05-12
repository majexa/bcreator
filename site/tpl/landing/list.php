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
  .grid {
    margin: auto;
  }
  .grid th {
    background: #353535;
    color: #fff;
    border-right: 1px solid #5d5d5d;
  }
  .grid td, .grid th {
    padding: 5px 10px;
  }
  .grid td {
    border-right: 1px solid #e8e8e8;
  }
  .grid tr:nth-child(odd) {
    background: #eaeaea;
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

<table class="grid">
  <tr>
    <th>Title</th>
    <th>Size</th>
    <th></th>
    <th></th>
  </tr>
  <? foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', Auth::get('id')) as $v) { ?>
    <tr>
      <td>Banner ID=<?= $v['id'] ?></td>
      <td><?= $v['size'] ?></td>
      <td><a href="/cpanel/<?= $v['id'] ?>">Edit</a></td>
      <td><a href="/list/delete/<?= $v['id'] ?>">Delete</a></td>
    </tr>
  <? } ?>
</table>


