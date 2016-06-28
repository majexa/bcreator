Ngn.sd.FieldSetAnimatedImages = new Class({
  Extends: Ngn.Frm.FieldSet,

  initRows: function() {
    this.parent();
    new Tips(new Element('span', {
      html: '?',
      title: 'Click to add animated image',
      'class': 'questionMark'
    }).inject(this.eAddRow, 'after'));
  }

});