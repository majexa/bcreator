Ngn.sd.BcreatorLayersBar = new Class({
  Extends: Ngn.sd.LayersBar,
  getTitle: function(item) {
    if (item.data.type == 'animatedText') {

      return '<span class="ico">' + '<img src="/sd/img/font.png"></span>' + //
      '<span class="text">' + (item.data.font.text && item.data.font.text[0] ? item.data.font.text[0] : 'empty') + '</span>';
    }
    else if (item.data.type == 'animatedImage') {
      return '<span class="ico">' + //
      (item.data.images && item.data.images[0] ? ('<img src="' + item.data.images[0] + '">') : '') + //
      '</span>Image';
    }
    return this.parent(item);
  }
});
