
/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.FieldSet.Html.js|--*/
Ngn.FieldSet.Html = new Class({
  Extends: Ngn.FieldSet,

  getContainer: function() {
    return this.eContainerInit;
  },

  initialize: function(container, options) {
    this.eContainerInit = $(container);
    this.parent(this.eContainerInit.getParent(), options);
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.FieldSet.js|--*/
Ngn.Frm.fieldSets = [];

Ngn.Frm.FieldSet = new Class({
  Extends: Ngn.FieldSet.Html,
  form: null, // Ngn.Form

  initialize: function(form, container, options) {
    this.form = form;
    Ngn.Frm.fieldSets.include(this);
    this.parent(container, options);
    this.initVirtualElement(this.eContainer);
  },

  initInput: function(eInput) {
    this.form.initActiveEl(eInput);
  },

  afterAddRow: function(eNewRow) {
    this.form.addElements(eNewRow);
  }

});

Ngn.Frm.FieldSet.implement(Ngn.Frm.virtualElement);
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
