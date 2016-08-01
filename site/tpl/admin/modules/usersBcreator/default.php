<div id="table"></div>
<script>
  new Ngn.Admin.UsersGrid.Bcreator({
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
    toolLinks: {
      editInvoices: function(row) {
        return '/admin/invoices/' + row.id
      }
    }
  });
</script>
