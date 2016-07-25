
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/Ngn.Frm.FieldSetBcreatorImages.js|--*/
Ngn.Frm.FieldSetBcreatorImages = new Class({
  Extends: Ngn.Frm.FieldSet,

  createDeleteButton: function(eRow, index) {
    var fieldSet = this;
    this.createRowButton(eRow, {
      caption: this.options.deleteTitle,
      cls: 'delete'
    }, function() {
      if (!confirm('Are you sure?')) return;
      Ngn.Request.Iface.loading(true);
      new Ngn.Request.JSON({
        url: fieldSet.options.deleteImageUrl.replace('{n}', index),
        onSuccess: function() {
          Ngn.Request.Iface.loading(false);
          eRow.dispose();
          fieldSet.regenInputNames();
          fieldSet.buttons.erase(this);
          Ngn.sd.blocks[Ngn.sd.openedPropDialog.options.blockId].reload();
        }
      }).send();
    });
  }

});

/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/Ngn.sd.FieldSetAnimatedImages.js|--*/
Ngn.sd.FieldSetAnimatedImages = new Class({
  Extends: Ngn.Frm.FieldSetBcreatorImages,

  initRows: function() {
    this.parent();
    new Tips(new Element('span', {
      html: '?',
      title: 'Click to add animated image',
      'class': 'questionMark'
    }).inject(this.eAddRow, 'after'));
  }

});