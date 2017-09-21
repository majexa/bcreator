<div id="table"></div>
<script>
  new Ngn.Grid({
    basePath: '/list',
    listPath: '/json_getItems',
    tools: {
      edit: 'Редактировать',
      'delete': 'Удалить'
    },
    menu: [Ngn.Grid.menu['new']],
    toolActions: {
      edit: function(row, opt) {
      }
    }
  }).reload();
</script>