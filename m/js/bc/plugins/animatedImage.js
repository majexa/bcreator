Ngn.sd.blockTypes.push({
  title: 'Image',
  data: {
    type: 'animatedImage'
  }
});

Ngn.sd.BlockBAnimatedImage = new Class({
  Extends: Ngn.sd.BlockB,
  resizeContentEl: function(size) {
    this.el.getElements('img').each(function(el) {
      this._resizeEl(el, size);
    }.bind(this));
    this.parent(size);
  },
  updateContent: function() {
    this.parent();
    Ngn.sd.GlobalSlides.instance().add(this);
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add image', 'image'), function() {
    var data = Ngn.sd.getBlockType('animatedImage');
    data.data.position = {
      x: 0,
      y: 0
    };
    Ngn.sd.block(Ngn.sd.elBlock().inject(Ngn.sd.eLayoutContent), {
      data: data.data,
      html: ''
    }).setToTheTop().save(true);
  });
});