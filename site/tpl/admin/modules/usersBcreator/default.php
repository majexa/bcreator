<div id="table"></div>
<script>
  new Ngn.Admin.UsersGrid({
    data: <?= Arr::jsObj($d['grid']) ?>,
    tools: {
      editRenderLimits: {
        title: '<?= Locale::get('editRenderLimits', 'users') ?>',
        cls: 'settings'
      },
      editInvoices: {
        title: '<?= Locale::get('editInvoices', 'users') ?>',
        cls: 'list',
        target: '_blank'
      }
    },
    toolActions: {
      editRenderLimits: function(row) {
        new Ngn.Dialog.RequestForm({
          url: '/admin/usersBcreator/json_editRenderLimits?id=' + row.id,
          width: 300,
          id: 'userRenderLimits',
          onOkClose: function() {
            this.reload();
          }.bind(this)
        });
      }
    },
    toolLinks: {
      editInvoices: function(row) {
        return '/admin/invoices/' + row.id
      }
    }
  });
</script>
