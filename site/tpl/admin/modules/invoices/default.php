<div id="table"></div>
<script>
  new Ngn.Grid({
    id: 'invoices',
    resizeble: true,
    data: <?= Arr::jsObj($d['grid']) ?>,
    menu: [{
      title: Ngn.Locale.get('Core.add'),
      cls: 'add',
      action: function(grid) {
        new Ngn.Dialog.RequestForm({
          url: grid.options.basePath + '/json_new',
          width: 300,
          //id: 'user',
          onOkClose: function() {
            grid.reload();
          }.bind(this)
        });
      }
    }],
    toolActions: {
      edit: function(row) {
        new Ngn.Dialog.RequestForm({
          url: this.options.basePath + '/json_edit?id=' + row.id,
          width: 300,
          id: 'user',
          onOkClose: function() {
            this.reload();
          }.bind(this)
        });
      }
    }
  });
</script>
