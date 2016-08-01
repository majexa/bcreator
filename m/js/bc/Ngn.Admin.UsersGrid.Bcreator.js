Ngn.Admin.UsersGrid.Bcreator = new Class({
  Extends: Ngn.Admin.UsersGrid,

  setOptions: function(options) {
    this.parent(options);
    this.options.toolActions.list = function(row) {

    };
    this.options.toolActions.settings = function(row) {
      new Ngn.Dialog.RequestForm({
        url: '/admin/usersBcreator/json_editRenderLimits?id=' + row.id,
        width: 300,
        id: 'userRenderLimits',
        onOkClose: function() {
          this.reload();
        }.bind(this)
      });
    }
  }

});