<div class="center">
  <div class="subtitle">
    Create your own banners, Build, publish.
    Try Banner Creator for free Check out features
  </div>
  <div class="button">
    <a href="/list/create" class=" btn">Create New Banner</a>
  </div>
</div>

<div class="banners left">
  <img src="http://zukulbannercreator.net/u/banner/animated/result/48.gif?qAVm2K0affRIK7a5ddbA">
</div>
<div class="banners right">
  <img src="http://zukulbannercreator.net/u/banner/animated/result/48.gif?qAVm2K0affRIK7a5ddbA">
</div>

<div class="center">
  <? if ($d['banners']) { ?>
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
          <td>
            <p><b><?= $v['title'] ?></b></p>
            <div class="preview">
              <? if ($v['directLink']) { ?>
                <div class="imageCont">
                  <img src="<?= $v['directLink'].'?'.strtotime($v['dateRender']) ?>" class="thumb">
                  <div class="fullPreview"></div>
                </div>
              <? } ?>
            </div>
          </td>
          <td><?= $v['size'] ?></td>
          <td>
            <? if (strtotime($v['dateRender']) < strtotime($v['dateUpdate']) or !$v['downloadLink']) { ?>
              Need to render
            <? } ?>
          </td>
          <td>
            <a href="<?= $v['downloadLink'] ?>"><img src="/m/img/landing/btn/download.png" title="Download"></a>
          </td>
          <td>
            <a href="/cpanel/<?= $v['id'] ?>"><img src="/m/img/landing/btn/edit.png" title="Edit"></a>
          </td>
          <td>
            <a href="/list/delete/<?= $v['id'] ?>"><img src="/m/img/landing/btn/delete.png" title="Delete"></a>
          </td>
        </tr>
      <? } ?>
    </table>

    <script>
      document.getElements('.table .preview img').each(function(el) {
        var timeoutId = null;
        var eFullPreview = el.getParent().getElement('.fullPreview');
        el.addEvent('mouseover', function(e) {
          clearTimeout(timeoutId);
          eFullPreview.set('html', '<img src="' + el.get('src') + '">');
          eFullPreview.setStyle('display', 'block');
        });
        eFullPreview.addEvent('mouseover', function(e) {
          clearTimeout(timeoutId);
        });
        eFullPreview.addEvent('mouseout', function(e) {
          timeoutId = setTimeout(function() {
            el.getParent().getElement('.fullPreview').setStyle('display', 'none');
          }, 100);
        });
        el.addEvent('mouseout', function(e) {
          timeoutId = setTimeout(function() {
            el.getParent().getElement('.fullPreview').setStyle('display', 'none');
          }, 100);
        });
      });
      new Tips('.table img');
    </script>
  </div>
<? } else { ?>
  <p>You have no banners</p>
<? } ?>
</div>


