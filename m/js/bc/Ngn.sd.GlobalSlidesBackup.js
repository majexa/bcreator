Ngn.sd.GlobalSlides = new Class({

  duration: 1500,
  slideSelector: '.cont div',

  hideSlides: function(block) {
    var slides = block.el.getElements(this.slideSelector);
    if (slides.length > 1) {
      for (var i = 1; i < slides.length; i++) {
        slides[i].setStyle('display', 'none');
      }
    }
  },

  slides: [],

  cacheSlides: function() {
    for (var i = 0; i < this.blocks.length; i++) {
      this.slides.push(this.blocks[i].el.getElements(this.slideSelector));
    }
  },

  phantomFrameChange: function() {
    if (typeof window.callPhantom === 'function') {
      window.callPhantom({
        action: 'frameChange'
      });
    }
  },

  currentIndex: 0,
  nextIndex: 0,
  animationStarted: false,
  maxSlidesBlockN: 0,

  initMaxSlidesBlockN: function() {
    for (var i = 0; i < this.slides.length; i++) {
      if (this.slides[i].length > this.maxSlidesBlockN) {
        this.maxSlidesBlockN = i;
      }
    }
  },

  nextSlide: function() {
    if (this.slides[this.maxSlidesBlockN][this.currentIndex + 1]) {
      this.nextIndex = this.currentIndex + 1;
    } else {
      this.nextIndex = 0;
    }
    // hide current
    for (var i = 0; i < this.slides.length; i++) {
      if (this.slides[i].length > 1) {
        if (this.slides[i][this.currentIndex]) this.slides[i][this.currentIndex].setStyle('display', 'none');
        if (this.slides[i][this.nextIndex]) this.slides[i][this.nextIndex].setStyle('display', 'block');
      }
    }
    // show next
    this.currentIndex = this.nextIndex;
    this.phantomFrameChange();
  },

  startAnimation: function() {
    if (this.animationStarted) return;
    this.animationStarted = true;
    this.phantomFrameChange();
    this.cacheSlides();
    this.initMaxSlidesBlockN();
    this.nextSlide.periodical(this.duration, this);
  },

  blocks: [],

  /**
   * @param block Ngn.sd.BlockB
   */
  add: function(block) {
    //console.trace(block);
    this.blocks.push(block);
    this.hideSlides(block);
    this.startAnimation.delay(100, this); // Make delay to all blocks will be already added
    return this;
  }

});

Ngn.sd.GlobalSlides.instance = function() {
  if (Ngn.sd.GlobalSlides._instance) return Ngn.sd.GlobalSlides._instance;
  return Ngn.sd.GlobalSlides._instance = new Ngn.sd.GlobalSlides();
};

window.addEvent('sdAfterInit', function() {
  if (Ngn.sd.GlobalSlides._instance) delete Ngn.sd.GlobalSlides._instance;
});

Ngn.sd.GlobalSlides.lastFrameChangeTime = 0;
