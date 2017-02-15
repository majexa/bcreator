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
<link rel="stylesheet" type="text/css" href="/i/css/common/dialog.css">
<link rel="stylesheet" type="text/css" href="/sd/css/list.css">
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
	        <img src="/m/img/landing/btn/delete.png" class="del" title="Delete" data="<?= $v['id'] ?>">
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
      $$('.del').addEvent('click', function(event) {
          var btName = $(this).getParent().getParent().getFirst().getElement('p').get('text');
          new Ngn.Dialog.Confirm({
            message: "Are you sure whant to delete banner <b>"+btName+"</b> to trash?",
            onOkClose: function () {
              document.location.href="/list/deleteConfirmed/"+$(this).get('data');
            }.bind(this)
          });
          $$('.dialog').setStyle('top', '35%');
        });
    </script>
  </div>
<? } else { ?>
  <p>You have no banners</p>
<? } ?>
  <script>
  function getTrash() {
  new Ngn.Request({
  url: '/list/getTrash',
  onComplete: function(response) {
  $$('#tablepace').set('html', response);
  }
  }).send();
  }
  $$('#trash').addEvent('click', function(event) {
    restored=false;
  new Ngn.Dialog({
    title: 'Trash',
    message: "<div id='tablepace' style='text-align: center;'></div>",
    onClose: function () {
      if(restored){
        document.location.href="/list/";
      }
    },
  });
    $$('.table').setStyle('top', '15%');
    $$('.dialog').setStyle('top', '15%');
    $$('.dialog-message').setStyle('max-height', '400px').setStyle('overflow-y', 'auto');
  getTrash();
  });

  function getCountTrash() {
    new Ngn.Request({
      url: "/list/getCountTrash",
      onComplete: function(response) {
        if(response>0){
          $$('#trash_ctn').set('html', response);
        } else {$$('#trash').setStyle('display', 'none');}
      }
    }).send();
  }

  function delTrash(id) {
    var btName = $$('#name-'+id).get('text');

    new Ngn.Dialog.Confirm({
      message: "Are you sure you want to permanently delete <b>"+btName+"</b> banner?",
      onOkClose: function () {
        new Ngn.Request({
          url: "/list/deleteConfirmedTrash/"+id,
          onComplete: function(response) {
              getTrash();
              getCountTrash();
          },
        }).send();
      }.bind(this)
    });
  };
  function restoreTrash(id) {
    var btName = $$('#name-'+id).get('text');

    new Ngn.Dialog.Confirm({
      message: "Are you sure restore banner <b>"+btName+"</b> from trash?",
      onOkClose: function () {
        new Ngn.Request({
          url: "/list/restoreTrash/"+id,
          onComplete: function(response) {
            getTrash();
            getCountTrash();
            if(response=="Ok"){
              restored=true;
            }
          },
        }).send();
      }.bind(this)
    });
  };
  </script>
</div>


