Ngn.sd.Slides = new Class({
  Implements: Options,

  options: {
    duration: 1500
  },

  initialize: function(elements, options) {
    this.setOptions(options);
    if (!elements.length) return;
    var currentIndex = 0, nextIndex;
    for (var i = 1; i < elements.length; i++) {
      elements[i].setStyle('display', 'none');
    }
    (function() {
      if (elements[currentIndex + 1]) {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = 0;
      }
      elements[currentIndex].setStyle('display', 'none');
      elements[nextIndex].setStyle('display', 'block');
      currentIndex = nextIndex;
      var time = Math.round(new Date().getTime() / 100);
      if (Ngn.sd.Slides.lastFrameChangeTime < time) {
        Ngn.sd.Slides.lastFrameChangeTime = time;
        if (typeof window.callPhantom === 'function') {
          window.callPhantom({
            action: 'frameChange'
          });
        }
      }
    }).periodical(this.options.duration);
  }
});

Ngn.sd.Slides.lastFrameChangeTime = 0;