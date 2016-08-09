Ngn.sd.BlockBBackground = new Class({
  Extends: Ngn.sd.BlockBImage,
  initPosition: function() {
    this.el.setStyles({
      top: '-1px',
      left: '-1px'
    });
  },
  canEdit: function() {
    return false;
  }
});

Ngn.sd.BackgroundInsertDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    id: 'background',
    title: 'Insert background',
    okText: 'Insert',
    dialogClass: 'dialog-images',
    onRequest: function() {
      this.initImages();
    },
    ok: function() {
      Ngn.sd.changeBannerBackground(Ngn.sd.selectedBackgroundUrl);
    }.bind(this)
  },
  initialize: function(options) {
    var w = Ngn.sd.data.bannerSettings.size.w.toInt();
    if (w < 200) {
      w = w * 3;
    } else if (w < 400) {
      w = w * 2;
    }
    //var h = Ngn.sd.data.bannerSettings.size.h.toInt();
    //if (h < 200) {
    //  //h = h * 2;
    //} else if (h < 400) {
    //  //h = h * 2;
    //}
    this.options.width = w + 56;
    this.options.height = 400;
    this.options.url = '/cpanel/' + Ngn.sd.bannerId + '/ajax_backgroundSelect';
    this.parent(options);
  },
  removeClass: function() {
    this.images.each(function(el) {
      el.removeClass('selected');
    });
  },
  initImages: function() {
    this.images = this.message.getElements('img');
    this.select(this.images[0]);
    this.images.each(function(el) {
      el.addEvent('click', function() {
        this.select(el);
      }.bind(this));
    }.bind(this));
  },
  select: function(el) {
    this.removeClass();
    Ngn.sd.selectedBackgroundUrl = el.get('src');
    el.addClass('selected');
  }
});

window.addEvent('sdPanelComplete', function() {
  new Ngn.Btn(Ngn.sd.fbtn('Add background', 'background'), function() {
    new Ngn.sd.BackgroundInsertDialog();
  });
});