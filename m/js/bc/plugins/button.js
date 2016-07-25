Ngn.sd.BlockBButton = new Class({
  Extends: Ngn.sd.BlockBImage,
  canEdit: function() {
    return false;
  }
});

window.addEvent('sdPanelComplete', function() {
  Ngn.sd.ButtonInsertDialog = new Class({
    Extends: Ngn.sd.ImageInsertDialog,
    options: {
      id: 'button',
      title: 'Insert button',
      url: '/cpanel/' + Ngn.sd.bannerId + '/ajax_buttonSelect'
    },
    createImageUrl: function(url) {
      return '/cpanel/' + Ngn.sd.bannerId + '/json_createButtonBlock?url=' + url
    }
  });
  new Ngn.Btn(Ngn.sd.fbtn('Add button', 'button'), function() {
    new Ngn.sd.ButtonInsertDialog();
  });
});