
/*--|/home/user/ngn-env/projects/bcreator/m/js/bc/plugins/Ngn.sd.FieldSetAnimatedText.js|--*/
Ngn.sd.FieldSetAnimatedText = new Class({
  Extends: Ngn.Frm.FieldSet,

  initRows: function() {
    this.parent();
    new Tips(new Element('span', {
      html: '?',
      title: 'Click to add animated text',
      'class': 'questionMark'
    }).inject(this.eAddRow, 'after'));
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.El.Color.js|--*/
Ngn.Form.El.Color = new Class({
  Extends: Ngn.Form.El,

  init: function() {
    var el = this.eRow;
    var eColor = el.getElement('div.color');
    var eInput = el.getElement('input').addClass('hexInput');
    eInput.addEvent('change', function() {
      eColor.setStyle('background-color', eInput.value);
    });
    new Ngn.Rainbow(eInput, {
      eParent: eInput.getParent(),
      eColor: eColor,
      id: 'rainbow_' + eInput.get('name'),
      //styles: { // и так работает
      //  'z-index': this.options.dialog.dialog.getStyle('z-index').toInt() + 1
      //},
      imgPath: '/i/img/rainbow/small/',
      wheel: true,
      startColor: eInput.value ? new Color(eInput.value).rgb : [255, 255, 255],
      onChange: function(color) {
        eColor.setStyle('background-color', color.hex);
        eInput.value = color.hex;
        eInput.fireEvent('change', color);
      },
      onComplete: function(color) {
        eColor.setStyle('background-color', color.hex);
        eInput.value = color.hex;
        eInput.fireEvent('change', color);
      }
    });
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Rainbow.js|--*/
Ngn.Rainbows = [];

Ngn.Rainbow = new Class({
  options: {
    id: 'rainbow',
    styles: {},
    prefix: 'moor-',
    imgPath: 'images/',
    startColor: [255, 0, 0],
    wheel: false,
    onComplete: Function.from(),
    onChange: Function.from(),
    eParent: null,
    eColor: null
  },

  initialize: function(el, options) {
    this.element = $(el);
    if (!this.element) return;
    this.setOptions(options);
    if (!this.options.eParent) this.options.eParent = document.body;
    this.sliderPos = 0;
    this.pickerPos = {x: 0, y: 0};
    this.backupColor = this.options.startColor;
    this.currentColor = this.options.startColor;
    this.sets = {
      rgb: [],
      hsb: [],
      hex: []
    };
    this.pickerClick = this.sliderClick = false;
    if (!this.layout) this.doLayout();
    this.OverlayEvents();
    this.sliderEvents();
    this.backupEvent();
    if (this.options.wheel) this.wheelEvents();
    this.element.addEvent('click', function(e) {
      this.closeAll().toggle(e);
    }.bind(this));
    if (this.options.eColor) {
      this.options.eColor.addEvent('click', function(e) {
        this.closeAll().toggle(e);
      }.bind(this));
    }
    this.layout.overlay.setStyle('background-color', this.options.startColor.rgbToHex());
    //this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());
    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;

    this.manualSet(this.options.startColor);

    this.pickerPos.x = this.snippet('curPos').l + this.snippet('curSize', 'int').w;
    this.pickerPos.y = this.snippet('curPos').t + this.snippet('curSize', 'int').h;
    this.sliderPos = this.snippet('arrPos') - this.snippet('arrSize', 'int');

    if (window.khtml) this.hide();
  },

  toggle: function() {
    this[this.visible ? 'hide' : 'show']();
  },

  show: function() {
    this.rePosition();
    (function() {
      this.layout.setStyle('display', 'block');
    }).delay(100, this);
    this.visible = true;
  },

  hide: function() {
    this.layout.setStyles({'display': 'none'});
    this.visible = false;
  },

  closeAll: function() {
    Ngn.Rainbows.each(function(obj) {
      obj.hide();
    });

    return this;
  },

  manualSet: function(color, type) {
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb') {
      rgb = color;
      hsb = color.rgbToHsb();
      hex = color.rgbToHex();
    } else if (type == 'hsb') {
      hsb = color;
      rgb = color.hsbToRgb();
      hex = rgb.rgbToHex();
    } else {
      hex = color;
      rgb = color.hexToRgb(true);
      hsb = rgb.rgbToHsb();
    }

    this.setRainbow(rgb);
    this.autoSet(hsb);
  },

  autoSet: function(hsb) {
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    var oveH = this.layout.overlay.height;
    var oveW = this.layout.overlay.width;
    var sliH = this.layout.slider.height;
    var arwH = this.snippet('arrSize', 'int');
    var hue;

    var posx = Math.round(((oveW * hsb[1]) / 100) - curW);
    var posy = Math.round(-((oveH * hsb[2]) / 100) + oveH - curH);

    var c = Math.round(((sliH * hsb[0]) / 360));
    c = (c == 360) ? 0 : c;
    var position = sliH - c + this.snippet('slider') - arwH;
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();

    this.layout.cursor.setStyles({'top': posy, 'left': posx});
    this.layout.arrows.setStyle('top', position);
    this.layout.overlay.setStyle('background-color', hue);
    this.sliderPos = this.snippet('arrPos') - arwH;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;
  },

  setRainbow: function(color, type) {
    if (!type || (type != 'hsb' && type != 'hex')) type = 'rgb';
    var rgb, hsb, hex;

    if (type == 'rgb') {
      rgb = color;
      hsb = color.rgbToHsb();
      hex = color.rgbToHex();
    } else if (type == 'hsb') {
      hsb = color;
      rgb = color.hsbToRgb();
      hex = rgb.rgbToHex();
    } else {
      hex = color;
      rgb = color.hexToRgb();
      hsb = rgb.rgbToHsb();
    }
    this.sets = {
      rgb: rgb,
      hsb: hsb,
      hex: hex
    };
    if (this.pickerPos.x == null) this.autoSet(hsb);
    this.RedInput.value = rgb[0];
    this.GreenInput.value = rgb[1];
    this.BlueInput.value = rgb[2];
    this.HueInput.value = hsb[0];
    this.SatuInput.value = hsb[1];
    this.BrighInput.value = hsb[2];
    //this.hexInput.value = hex;
    this.currentColor = rgb;
    //this.chooseColor.setStyle('background-color', rgb.rgbToHex());
  },

  parseColors: function(x, y, z) {
    var s = Math.round((x * 100) / this.layout.overlay.width);
    var b = 100 - Math.round((y * 100) / this.layout.overlay.height);
    var h = 360 - Math.round((z * 360) / this.layout.slider.height) + this.snippet('slider') - this.snippet('arrSize', 'int');
    h -= this.snippet('arrSize', 'int');
    h = (h >= 360) ? 0 : (h < 0) ? 0 : h;
    s = (s > 100) ? 100 : (s < 0) ? 0 : s;
    b = (b > 100) ? 100 : (b < 0) ? 0 : b;

    return [h, s, b];
  },

  OverlayEvents: function() {
    var lim, curH, curW, inputs;
    curH = this.snippet('curSize', 'int').h;
    curW = this.snippet('curSize', 'int').w;
    //inputs = Array.from(this.arrRGB).concat(this.arrHSB, this.hexInput);
    document.addEvent('click', function() {
      this.hide(this.layout);
    }.bind(this));
    /*
    inputs.each(function(el) {
      el.addEvent('keydown', this.eventKeydown.bindWithEvent(this, el));
      el.addEvent('keyup', this.eventKeyup.bindWithEvent(this, el));
    }, this);
    */
    [this.element, this.layout].each(function(el) {
      el.addEvents({
        'click': function(e) {
          e.preventDefault();
        },
        'keyup': function(e) {
          if (e.key == 'esc' && this.visible) this.hide(this.layout);
        }.bind(this)
      }, this);
    }, this);
    lim = {
      //x: [0 - curW, this.layout.overlay.width - curW],
      //y: [0 - curH, this.layout.overlay.height - curH]
      x: [0 - curW, 80 - curW],
      y: [0 - curH, 80 - curH]
    };
    this.layout.addEvent('click', function(e) {
      e.stop();
    });
    this.layout.drag = new Drag(this.layout.cursor, {
      limit: lim,
      onBeforeStart: this.overlayDrag.bind(this),
      onStart: this.overlayDrag.bind(this),
      onDrag: this.overlayDrag.bind(this),
      snap: 0
    });

    this.layout.overlay2.addEvent('mousedown', function(e) {
      this.layout.cursor.setStyles({
        'top': e.page.y - this.layout.overlay.getTop() - curH,
        'left': e.page.x - this.layout.overlay.getLeft() - curW
      });
      this.layout.drag.start(e);
    }.bind(this));

    /*
     this.layout.overlay2.addEvent('dblclick', function(){
     this.ok();
     }.bind(this));
     this.okButton.addEvent('click', function() {
     this.ok();
     }.bind(this));
     */


    this.transp.addEvent('click', function() {
      this.hide();
      this.fireEvent('onComplete', ['transparent', this]);
    }.bind(this));
  },

  ok: function() {
    if (this.currentColor == this.options.startColor) {
      this.hide();
      this.fireEvent('onComplete', [this.sets, this]);
    } else {
      this.backupColor = this.currentColor;
      //this.layout.backup.setStyle('background-color', this.backupColor.rgbToHex());
      this.hide();
      this.fireEvent('onComplete', [this.sets, this]);
    }
  },

  overlayDrag: function() {
    var curH = this.snippet('curSize', 'int').h;
    var curW = this.snippet('curSize', 'int').w;
    this.pickerPos.x = this.snippet('curPos').l + curW;
    this.pickerPos.y = this.snippet('curPos').t + curH;
    this.setRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    this.fireEvent('onChange', [this.sets, this]);
  },

  sliderEvents: function() {
    var arwH = this.snippet('arrSize', 'int'), lim;
    lim = [0 + this.snippet('slider') - arwH, this.layout.slider.height - arwH + this.snippet('slider')];
    this.layout.sliderDrag = new Drag(this.layout.arrows, {
      limit: {y: lim},
      modifiers: {x: false},
      onBeforeStart: this.sliderDrag.bind(this),
      onStart: this.sliderDrag.bind(this),
      onDrag: this.sliderDrag.bind(this),
      snap: 0
    });

    this.layout.slider.addEvent('mousedown', function(e) {
      this.layout.arrows.setStyle('top', e.page.y - this.layout.slider.getTop() + this.snippet('slider') - arwH);
      this.layout.sliderDrag.start(e);
    }.bind(this));
  },

  sliderDrag: function() {
    var arwH = this.snippet('arrSize', 'int'), hue;

    this.sliderPos = this.snippet('arrPos') - arwH;
    this.setRainbow(this.parseColors(this.pickerPos.x, this.pickerPos.y, this.sliderPos), 'hsb');
    hue = [this.sets.hsb[0], 100, 100].hsbToRgb().rgbToHex();
    this.layout.overlay.setStyle('background-color', hue);
    this.fireEvent('onChange', [this.sets, this]);
  },

  backupEvent: function() {
    /*
    this.layout.backup.addEvent('click', function() {
      this.manualSet(this.backupColor);
      this.fireEvent('onChange', [this.sets, this]);
    }.bind(this));
    */
  },

  wheelEvents: function() {
    var arrColors = Object.append(Array.from(this.arrRGB), this.arrHSB);
    arrColors.each(function(el) {
      el.addEvents({
        'mousewheel': function() {
          this.eventKeys(el);
        }.bind(this),
        'keydown': function() {
          this.eventKeys(el);
        }.bind(this)
      });
    }, this);

    [this.layout.arrows, this.layout.slider].each(function(el) {
      el.addEvents({
        'mousewheel': function() {
          this.eventKeys([this.arrHSB[0], 'slider']);
        }.bind(this),
        'keydown': function() {
          this.eventKeys([this.arrHSB[0], 'slider']);
        }.bind(this)
      });
    }, this);
  },

  eventKeys: function(e, el, id) {
    var wheel, type;
    id = (!id) ? el.id : this.arrHSB[0];

    if (e.type == 'keydown') {
      if (e.key == 'up') wheel = 1; else if (e.key == 'down') wheel = -1; else return;
    } else if (e.type == Element.Events.mousewheel.base) wheel = (e.wheel > 0) ? 1 : -1;

    if (this.arrRGB.contains(el)) type = 'rgb'; else if (this.arrHSB.contains(el)) type = 'hsb'; else type = 'hsb';

    if (type == 'rgb') {
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = (el.value.toInt() || 0) + wheel;
      value = (value > 255) ? 255 : (value < 0) ? 0 : value;

      switch (el.className) {
        case prefix + 'rInput':
          pass = [value, rgb[1], rgb[2]];
          break;
        case prefix + 'gInput':
          pass = [rgb[0], value, rgb[2]];
          break;
        case prefix + 'bInput':
          pass = [rgb[0], rgb[1], value];
          break;
        default :
          pass = rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      var rgb = this.sets.rgb, hsb = this.sets.hsb, prefix = this.options.prefix, pass;
      var value = (el.value.toInt() || 0) + wheel;

      if (el.className.test(/(HueInput)/)) value = (value > 359) ? 0 : (value < 0) ? 0 : value; else value = (value > 100) ? 100 : (value < 0) ? 0 : value;

      switch (el.className) {
        case prefix + 'HueInput':
          pass = [value, hsb[1], hsb[2]];
          break;
        case prefix + 'SatuInput':
          pass = [hsb[0], value, hsb[2]];
          break;
        case prefix + 'BrighInput':
          pass = [hsb[0], hsb[1], value];
          break;
        default :
          pass = hsb;
      }

      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    }
    e.stop();
  },

  eventKeydown: function(e, el) {
    var n = e.code, k = e.key;
    if ((!el.className.test(/hexInput/) && !(n >= 48 && n <= 57)) && (k != 'backspace' && k != 'tab' && k != 'delete' && k != 'left' && k != 'right'))
      e.stop();
  },

  eventKeyup: function(e, el) {
    var n = e.code, k = e.key, pass, prefix, chr = el.value.charAt(0);
    if (el.value == null) return;
    if (el.className.test(/hexInput/)) {
      if (chr != "#" && el.value.length != 6) return;
      if (chr == '#' && el.value.length != 7) return;
    } else {
      if (!(n >= 48 && n <= 57) && (!['backspace', 'tab', 'delete', 'left', 'right'].contains(k)) && el.value.length > 3) return;
    }

    prefix = this.options.prefix;

    if (el.className.test(/(rInput|gInput|bInput)/)) {
      if (el.value < 0 || el.value > 255) return;
      switch (el.className) {
        case prefix + 'rInput':
          pass = [el.value, this.sets.rgb[1], this.sets.rgb[2]];
          break;
        case prefix + 'gInput':
          pass = [this.sets.rgb[0], el.value, this.sets.rgb[2]];
          break;
        case prefix + 'bInput':
          pass = [this.sets.rgb[0], this.sets.rgb[1], el.value];
          break;
        default :
          pass = this.sets.rgb;
      }
      this.manualSet(pass);
      this.fireEvent('onChange', [this.sets, this]);
    } else if (!el.className.test(/hexInput/)) {
      if (el.className.test(/HueInput/) && el.value < 0 || el.value > 360) return; else if (el.className.test(/HueInput/) && el.value == 360) el.value = 0; else if (el.className.test(/(SatuInput|BrighInput)/) && el.value < 0 || el.value > 100) return;
      switch (el.className) {
        case prefix + 'HueInput':
          pass = [el.value, this.sets.hsb[1], this.sets.hsb[2]];
          break;
        case prefix + 'SatuInput':
          pass = [this.sets.hsb[0], el.value, this.sets.hsb[2]];
          break;
        case prefix + 'BrighInput':
          pass = [this.sets.hsb[0], this.sets.hsb[1], el.value];
          break;
        default :
          pass = this.sets.hsb;
      }
      this.manualSet(pass, 'hsb');
      this.fireEvent('onChange', [this.sets, this]);
    } else {
      pass = el.value.hexToRgb(true);
      if (isNaN(pass[0]) || isNaN(pass[1]) || isNaN(pass[2])) return;
      if (pass != null) {
        this.manualSet(pass);
        this.fireEvent('onChange', [this.sets, this]);
      }
    }
  },

  doLayout: function() {
    var id = this.options.id, prefix = this.options.prefix;
    var idPrefix = id + ' .' + prefix;

    this.layout = new Element('div', {
      'styles': Object.merge({ 'display': 'block', 'position': 'absolute', zIndex: 10}, this.options.styles),
      'id': id
    }).inject(this.options.eParent);

    Ngn.Rainbows.push(this);

    var box = new Element('div', {
      'styles': {'position': 'relative'},
      'class': prefix + 'box'
    }).inject(this.layout);

    var div = new Element('div', {
      'styles': {'position': 'absolute', 'overflow': 'hidden'},
      'class': prefix + 'overlayBox'
    }).inject(box);

    var ar = new Element('div', {
      'styles': {
        'position': 'absolute'
        //,'zIndex': 1
      },
      'class': prefix + 'arrows'
    }).inject(box);
    ar.width = ar.getStyle('width').toInt();
    ar.height = ar.getStyle('height').toInt();

    var ov = new Element('img', {
      'styles': {
        'background-color': '#fff',
        'position': 'relative'
        //,'zIndex': 2
      },
      'src': this.options.imgPath + 'moor_woverlay.png',
      'class': prefix + 'overlay'
    }).inject(div);

    var ov2 = new Element('img', {
      'styles': {'position': 'absolute', 'top': 0, 'left': 0/*, 'zIndex': 2*/},
      'src': this.options.imgPath + 'moor_boverlay.png',
      'class': prefix + 'overlay'
    }).inject(div);

    if (window.ie6) {
      div.setStyle('overflow', '');
      var src = ov.src;
      ov.src = this.options.imgPath + 'blank.gif';
      ov.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
      src = ov2.src;
      ov2.src = this.options.imgPath + 'blank.gif';
      ov2.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + src + "', sizingMethod='scale')";
    }
    ov.width = ov2.width = div.getStyle('width').toInt();
    ov.height = ov2.height = div.getStyle('height').toInt();

    var cr = new Element('div', {
      'styles': {'overflow': 'hidden', 'position': 'absolute'/*, 'zIndex': 2*/},
      'class': prefix + 'cursor'
    }).inject(div);
    cr.width = cr.getStyle('width').toInt();
    cr.height = cr.getStyle('height').toInt();

    var sl = new Element('img', {
      'styles': {'position': 'absolute'/*, 'z-index': 2, marginLeft: '1px'*/},
      'src': this.options.imgPath + 'moor_slider.png',
      'class': prefix + 'slider'
    }).inject(box);
    this.layout.slider = document.getElement('#' + idPrefix + 'slider');
    sl.width = sl.getStyle('width').toInt();
    sl.height = sl.getStyle('height').toInt();

    new Element('div', {
      'styles': {'position': 'absolute'},
      'class': prefix + 'colorBox'
    }).inject(box);

    /*
     new Element('div', {
      'styles': {
      //'zIndex': 2,
      'position': 'absolute'
      },
      'class': prefix + 'chooseColor'
    }).inject(box);

    this.layout.backup = new Element('div', {
      'styles': {
        //'zIndex': 2,
        'position': 'absolute', 'cursor': 'pointer'},
      'class': prefix + 'currentColor'
    }).inject(box);
    */

    var R = new Element('label').inject(box).setStyle('position', 'absolute');
    var G = R.clone().inject(box).addClass(prefix + 'gLabel').appendText('G: ');
    var B = R.clone().inject(box).addClass(prefix + 'bLabel').appendText('B: ');
    R.appendText('R: ').addClass(prefix + 'rLabel');

    var inputR = new Element('input');
    var inputG = inputR.clone().inject(G).addClass(prefix + 'gInput');
    var inputB = inputR.clone().inject(B).addClass(prefix + 'bInput');
    inputR.inject(R).addClass(prefix + 'rInput');

    var HU = new Element('label').inject(box).setStyle('position', 'absolute');
    var SA = HU.clone().inject(box).addClass(prefix + 'SatuLabel').appendText('S: ');
    var BR = HU.clone().inject(box).addClass(prefix + 'BrighLabel').appendText('B: ');
    HU.appendText('H: ').addClass(prefix + 'HueLabel');

    var inputHU = new Element('input');
    var inputSA = inputHU.clone().inject(SA).addClass(prefix + 'SatuInput');
    var inputBR = inputHU.clone().inject(BR).addClass(prefix + 'BrighInput');
    inputHU.inject(HU).addClass(prefix + 'HueInput');
    SA.appendText(' %');
    BR.appendText(' %');
    new Element('span', {'styles': {'position': 'absolute'}, 'class': prefix + 'ballino'}).set('html', " &deg;").inject(HU, 'after');

    //var hex = new Element('label').inject(box).setStyle('position', 'absolute').addClass(prefix + 'hexLabel').appendText('#hex: ').adopt(new Element('input').addClass(prefix + 'hexInput'));

    /*
    var ok = new Element('input', {
      'styles': {'position': 'absolute'},
      'type': 'button',
      'value': 'OK',
      'class': prefix + 'okButton'
    }).inject(box);
    */

    var transp = new Element('a', {'style': {'position': 'absolute'}, 'href': '#', 'class': prefix + 'transp'}).inject(box);

    this.rePosition();

    var overlays = $$('#' + idPrefix + 'overlay');
    this.layout.overlay = overlays[0];

    this.layout.overlay2 = overlays[1];
    this.layout.cursor = document.getElement('#' + idPrefix + 'cursor');
    this.layout.arrows = document.getElement('#' + idPrefix + 'arrows');
    this.chooseColor = document.getElement('#' + idPrefix + 'chooseColor');
    //this.layout.backup = document.getElement('#' + idPrefix + 'currentColor');
    this.RedInput = document.getElement('#' + idPrefix + 'rInput');
    this.GreenInput = document.getElement('#' + idPrefix + 'gInput');
    this.BlueInput = document.getElement('#' + idPrefix + 'bInput');
    this.HueInput = document.getElement('#' + idPrefix + 'HueInput');
    this.SatuInput = document.getElement('#' + idPrefix + 'SatuInput');
    this.BrighInput = document.getElement('#' + idPrefix + 'BrighInput');
    //this.hexInput = document.getElement('#' + idPrefix + 'hexInput');

    this.arrRGB = [this.RedInput, this.GreenInput, this.BlueInput];
    this.arrHSB = [this.HueInput, this.SatuInput, this.BrighInput];
    //this.okButton = document.getElement('#' + idPrefix + 'okButton');
    this.transp = box.getElement('.' + prefix + 'transp');

    if (!window.khtml) this.hide();
  },
  rePosition: function() {
    return;
    var coords = this.element.getCoordinates();
    this.layout.setStyles({
      'left': coords.left,
      'top': coords.top + coords.height + 1
    });
  },

  snippet: function(mode, type) {
    var size;
    type = (type) ? type : 'none';
    switch (mode) {
      case 'arrPos':
        var t = this.layout.arrows.getStyle('top').toInt();
        size = t;
        break;
      case 'arrSize':
        var h = this.layout.arrows.height;
        h = (type == 'int') ? (h / 2).toInt() : h;
        size = h;
        break;
      case 'curPos':
        var l = this.layout.cursor.getStyle('left').toInt();
        var t = this.layout.cursor.getStyle('top').toInt();
        size = {'l': l, 't': t};
        break;
      case 'slider':
        var t = this.layout.slider.getStyle('marginTop').toInt();
        size = t;
        break;
      default :
        var h = this.layout.cursor.height;
        var w = this.layout.cursor.width;
        h = (type == 'int') ? (h / 2).toInt() : h;
        w = (type == 'int') ? (w / 2).toInt() : w;
        size = {w: w, h: h};
    }
    ;
    return size;
  }
});

Ngn.Rainbow.implement(new Options);
Ngn.Rainbow.implement(new Events);

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.El.DialogSelect.js|--*/
Ngn.Form.El.DialogSelect = new Class({
  Extends: Ngn.Form.El,
  options: {
    selectTitle: Locale.get('Core.change'),
    selectClass: ''
  },
  baseName: 'defualt',
  getInitField: function() {
    return this.eRow.getElement('input') || this.eRow.getElement('select');
  },
  getSelectDialogEl: function() {
    return new Element('a', {
      'class': 'pseudoLink dgray' + (this.options.selectClass ? ' ' + this.options.selectClass : ''),
      html: this.options.selectTitle
    }).inject(this.eInitField, 'after');
  },
  makeHiddenField: function() {
    this.eInput = new Element('input', { type: 'hidden', name: this.eInitField.get('name') }).inject(this.eInitField, 'after');
  },
  init: function() {
    this.eInitField = this.getInitField();
    this.value = this.eInitField.get('value');
    this.makeHiddenField();
    this.eSelectDialog = this.getSelectDialogEl();
    new Element('div', {'class': 'rightFading'}).inject(this.eSelectDialog);
    this.eInitField.dispose();
    this.initControlDefault();
    this.setValue(this.value);
  },
  setValue: function(value) {
    this.setVisibleValue(value);
    this._setValue(value);
  },
  setVisibleValue: function(value) {
    this.eSelectDialog.set('html', value || 'not defined');
  },
  _setValue: function(value) {
    if (!value) return;
    this.value = value;
    this.eInput.set('value', value);
  },
  initControl: function() {
    this.eSelectDialog.addEvent('click', function() {
      var cls = this.getDialogClass();
      if (!cls) throw new Error('class not found');
      new cls(Object.merge({
        value: this.value
      }, this.getDialogOptions()));
    }.bind(this));
  },
  initControlDefault: function() {
    this.initControl();
  },
  getDialogClass: function() {
    throw new Error('Create abstract method getDialogClass()');
  },
  getDialogOptions: function() {
    return {
      onChangeValue: function(value) {
        this.setValue(value);
        if (this.form && this.form.options.dialog) {
          this.form.options.dialog.fireEvent('change' + this.baseName.capitalize(), value);
        }
      }.bind(this)
    };
  }
});
/*--|/home/user/ngn-env/bc/sd/js/Ngn.Form.El.DialogSelect.Sd.js|--*/
Ngn.Form.El.DialogSelect.Sd = new Class({
  Extends: Ngn.Form.El.DialogSelect,

  getSelectDialogEl: function() {
    var eSelectDialog = new Element('div', {
      'class': 'dialogSelect' + (this.options.selectClass ? ' ' + this.options.selectClass : ''),
      title: this.options.selectTitle
    }).inject(this.eInitField, 'after');
    new Element('div', {'class': 'rightFading'}).inject(eSelectDialog);
    return eSelectDialog;
  }

});

/*--|/home/user/ngn-env/bc/sd/js/Ngn.Form.El.FontFamilyCufon.js|--*/
Ngn.Form.El.FontFamilyCufon = new Class({
  Extends: Ngn.Form.El.DialogSelect.Sd,
  baseName: 'font',
  options: {
    selectClass: 'font'
  },
  init: function() {
    this.parent();
    this.value ? Ngn.sd.loadFont(this.value, this.initControl.bind(this)) : this.initControl();
  },
  initControlDefault: function() {
  },
  setValue: function(font) {
    this.parent(font);
    Cufon.set('fontFamily', font).replace(this.eSelectDialog);
  },
  getDialogClass: function() {
    return Ngn.sd.FontSelectDialog;
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.ElSelectDialog.js|--*/
Ngn.ElSelectDialog = new Class({
  Extends: Ngn.Dialog,
  options: {
    dialogClass: 'dialog selectDialog',
    noPadding: false
  },
  okClose: function() {
    //this.formEl.setVisibleValue(this.getValue());
    this.fireEvent('changeValue', this.getValue());
    this.parent();
  },
  getValue: function() {
    throw new Error('Abstract');
  }
});
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.SelectDialog.js|--*/
Ngn.sd.SelectDialog = new Class({
  Extends: Ngn.ElSelectDialog,
  options: {
    footer: false,
    width: 580,
    height: 300,
    savePosition: true,
    closeOnSelect: true,
    onChangeFont: function() {
    }
  },
  setOptions: function(opts) {
    this.parent(Object.merge(opts || {}, {id: this.name + 'Select'}));
  },
  eSelected: null,
  init: function() {
    var obj = this;
    this.message.getElements('div.item').each(function(el) {
      if (obj.options.value && el.get('data-name') == obj.options.value) {
        obj._select(el);
      }
      el.addEvent('click', function() {
        obj.select(this);
      });
    });
    if (obj.eSelected) (function() {
      new Fx.Scroll(obj.message).toElement(obj.eSelected)
    }).delay(500);
  },
  _select: function(el) {
    if (this.eSelected) this.eSelected.removeClass('selected');
    this.eSelected = el.addClass('selected');
    this.fireEvent('changeValue', el.get('data-name'));
  },
  select: function(el) {
    this._select(el);
    if (this.options.closeOnSelect) this.close();
  }
});

/*--|/home/user/ngn-env/ngn/more/scripts/js/common/tpl.php| (with request data)--*/
Ngn.toObj('Ngn.tpls.fontSelect', '<div class="selectItems">\n    <div class="item" data-name="Aero_Matics_Stencil_Regular">\n    Aero_Matics_Stencil_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Ancient_Kyiv">\n    Ancient_Kyiv    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Archive">\n    Archive    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Attentica_4f_Ultralight">\n    Attentica_4f_Ultralight    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Avdira">\n    Avdira    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azamat">\n    Azamat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans">\n    Azoft_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold">\n    Azoft_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Bold_Italic">\n    Azoft_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Azoft_Sans_Italic">\n    Azoft_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bad_Script">\n    Bad_Script    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bardelin">\n    Bardelin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Barkentina">\n    Barkentina    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender">\n    Bender    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black">\n    Bender_Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Black_Italic">\n    Bender_Black_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold">\n    Bender_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Bold_Italic">\n    Bender_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Italic">\n    Bender_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light">\n    Bender_Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bender_Light_Italic">\n    Bender_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boblic">\n    Boblic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bombarda">\n    Bombarda    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Boom_Boom">\n    Boom_Boom    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Bradobrei">\n    Bradobrei    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella">\n    Brava_Novella    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brava_Novella_Italic">\n    Brava_Novella_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Brush">\n    Brush    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Regular">\n    Corki_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Rounded">\n    Corki_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan">\n    Corki_Tuscan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Corki_Tuscan_Rounded">\n    Corki_Tuscan_Rounded    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Danger">\n    Danger    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Days">\n    Days    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decolz">\n    Decolz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Decree_Art_Two">\n    Decree_Art_Two    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Derby">\n    Derby    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Deuz_Ex">\n    Deuz_Ex    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Don_Quixote">\n    Don_Quixote    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans">\n    Droid_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Droid_Sans_Bold">\n    Droid_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="FatC">\n    FatC    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Font_Awesome">\n    Font_Awesome    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Free_Font_Pro">\n    Free_Font_Pro    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat">\n    Fregat    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold">\n    Fregat_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Bold_Italic">\n    Fregat_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Fregat_Italic">\n    Fregat_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Glidesketch">\n    Glidesketch    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Gogol">\n    Gogol    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web">\n    Graublau_Web    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Graublau_Web_Bold">\n    Graublau_Web_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Medium">\n    Hagin_Caps_Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hagin_Caps_Thin">\n    Hagin_Caps_Thin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo">\n    Hattori_Hanzo    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Hattori_Hanzo_Italic">\n    Hattori_Hanzo_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Helgoland">\n    Helgoland    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Intruder">\n    Intruder    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold">\n    Iwona_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Bold_Italic">\n    Iwona_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold">\n    Iwona_Condensed_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Bold_Italic">\n    Iwona_Condensed_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Italic">\n    Iwona_Condensed_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Heavy_Regular">\n    Iwona_Condensed_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Italic">\n    Iwona_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Italic">\n    Iwona_Condensed_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Light_Regular">\n    Iwona_Condensed_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Medium_Regular">\n    Iwona_Condensed_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condensed_Regular">\n    Iwona_Condensed_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Condesed_Medium_Italic">\n    Iwona_Condesed_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Italic">\n    Iwona_Heavy_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Heavy_Regular">\n    Iwona_Heavy_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Italic">\n    Iwona_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Italic">\n    Iwona_Light_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Light_Regular">\n    Iwona_Light_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Italic">\n    Iwona_Medium_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Medium_Regular">\n    Iwona_Medium_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Iwona_Regular">\n    Iwona_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="John_Daniels">\n    John_Daniels    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Juan">\n    Juan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Bold_RU">\n    Kelson_Sans_Bold_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Light_RU">\n    Kelson_Sans_Light_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kelson_Sans_Regular_RU">\n    Kelson_Sans_Regular_RU    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Bold">\n    Kotyhoroshko_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Kotyhoroshko_Regular">\n    Kotyhoroshko_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lloyd">\n    Lloyd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lobster">\n    Lobster    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Audrey_BG">\n    Lovely_Audrey_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Grace_BG">\n    Lovely_Grace_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lovely_Sofia_BG">\n    Lovely_Sofia_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed">\n    Lytiga_Pro_Condensed    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Condensed_Italic">\n    Lytiga_Pro_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended">\n    Lytiga_Pro_Extended    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Extended_Italic">\n    Lytiga_Pro_Extended_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Italic">\n    Lytiga_Pro_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Lytiga_Pro_Regular">\n    Lytiga_Pro_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="MS_Reshetka">\n    MS_Reshetka    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Bold">\n    Marta_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Italic">\n    Marta_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Marta_Regular">\n    Marta_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs">\n    Mikodacs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Mikodacs_PCS">\n    Mikodacs_PCS    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Multima_Bold">\n    Multima_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Museo_Sans_500">\n    Museo_Sans_500    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Neonic">\n    Neonic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nikodecs">\n    Nikodecs    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG">\n    Nioki_BG    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Bold">\n    Nioki_BG_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Nioki_BG_Italic">\n    Nioki_BG_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Now_Grotesk">\n    Now_Grotesk    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Bold">\n    Old_Standard_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Italic">\n    Old_Standard_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Old_Standard_Regular">\n    Old_Standard_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Oranienbaum">\n    Oranienbaum    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus">\n    Orpheus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Bold">\n    Orpheus_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Orpheus_Italic">\n    Orpheus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold">\n    Palemonas_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Bold_Italic">\n    Palemonas_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Italic">\n    Palemonas_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Palemonas_Regular">\n    Palemonas_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama">\n    Perforama    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Perforama_Italic">\n    Perforama_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pharmadin">\n    Pharmadin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Philosopher">\n    Philosopher    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Bold">\n    Pixar_One_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Display">\n    Pixar_One_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_One_Regular">\n    Pixar_One_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Bold">\n    Pixar_Two_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Display">\n    Pixar_Two_Display    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Pixar_Two_Regular">\n    Pixar_Two_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans">\n    Resavska_BG_Sans    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold">\n    Resavska_BG_Sans_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Bold_Italic">\n    Resavska_BG_Sans_Bold_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Resavska_BG_Sans_Italic">\n    Resavska_BG_Sans_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Retropecan">\n    Retropecan    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Black">\n    SkolaSans-Black    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BlackItalic">\n    SkolaSans-BlackItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Bold">\n    SkolaSans-Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-BoldItalic">\n    SkolaSans-BoldItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Light">\n    SkolaSans-Light    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-LightItalic">\n    SkolaSans-LightItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Medium">\n    SkolaSans-Medium    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-MediumItalic">\n    SkolaSans-MediumItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-Regular">\n    SkolaSans-Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="SkolaSans-RegularItalic">\n    SkolaSans-RegularItalic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Skoropys_XVII">\n    Skoropys_XVII    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sports_World_Regular">\n    Sports_World_Regular    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Stiff_Staff">\n    Stiff_Staff    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Sumkin">\n    Sumkin    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus">\n    Supremus    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Condensed_Italic">\n    Supremus_Condensed_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Supremus_Italic">\n    Supremus_Italic    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Tot_Shrift_Bold">\n    Tot_Shrift_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Underdog">\n    Underdog    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Venus_Rising">\n    Venus_Rising    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Zion_Train_Pro_Stencil_Bold">\n    Zion_Train_Pro_Stencil_Bold    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="Znikomit_No25">\n    Znikomit_No25    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arial">\n    arial    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbd">\n    arialbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="arialbi">\n    arialbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="ariali">\n    ariali    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgia">\n    georgia    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiab">\n    georgiab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiai">\n    georgiai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="georgiaz">\n    georgiaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="impact">\n    impact    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahoma">\n    tahoma    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="tahomabd">\n    tahomabd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="times">\n    times    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbd">\n    timesbd    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesbi">\n    timesbi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="timesi">\n    timesi    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdana">\n    verdana    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanab">\n    verdanab    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanai">\n    verdanai    <div class="font">AaCcDd</div>\n  </div>\n    <div class="item" data-name="verdanaz">\n    verdanaz    <div class="font">AaCcDd</div>\n  </div>\n    <div class="clear"></div>\n  <script>\n  </script>\n</div>');
/*--|/home/user/ngn-env/bc/sd/js/Ngn.sd.FontSelectDialog.js|--*/
// @requiresBefore s2/js/common/tpl?name=fontSelect&controller=/font/ajax_browse
Ngn.sd.FontSelectDialog = new Class({
  Extends: Ngn.sd.SelectDialog,
  name: 'font',
  options: {
    width: 600,
    message: Ngn.tpls.fontSelect,
    title: 'Choose Font...',
    value: 'Arial'
  },
  init: function() {
    this.parent();
    this.message.addClass('hLoader');
    var els = this.message.getElements('div.item');
    var loaded = 0;
    els.each(function(el) {
      Ngn.sd.loadFont(el.get('data-name'), function() {
        loaded++;
        Cufon.set('fontFamily', el.get('data-name')).replace(el.getElement('.font'));
        if (loaded == els.length) this.message.removeClass('hLoader');
      }.bind(this));
    }.bind(this));
  }
});
