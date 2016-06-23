
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.js|--*/
/**
 * Класс `Ngn.Form` в паре с серверным PHP классом `Form` образует свзяку для работы с HTML-формами
 *
 * ###Основные задачи###
 *
 *  - Инициализацию динамически сгенерированого на сервере JavaScript'а
 *  - Валидацию полей
 *  - Сабмит
 *  - Интерфейс колонок, свёртываемых блоков, прикрепленных файлов
 *  - Активацию/дезактивацию полей
 *  - Инициализацию загрузчика файлов
 */
Ngn.Form = new Class({
  Implements: [Options, Events, Class.Occlude],

  options: {
    equalElementHeights: false, // [boolean] Уравнивать высоты элементов формы
    dialog: null, // [null|Ngn.Dialog] Диалог, из которого была создана форма
    focusFirst: false, // [boolean] Делать фокус на первом элементе
    ajaxSubmit: false, // [boolean] Сабмитить форму ajax-ом
    disableInit: false // [boolean] Не производить инициализацию в формы в конструкторе
  },

  els: {},

  initialize: function(eForm, options) {
    this.eForm = eForm;
    this.eOutsideContainer = new Element('div', {styles: {'display': 'none'}}).inject(this.eForm, 'after');
    if (this.eForm.get('data-init')) throw new Error('This form already initialized');
    this.eForm.set('data-init', true);
    if ((options && !options.forceOcclude) && this.occlude(this.eForm.get('id'), this.eForm)) return this.occluded;
    Ngn.Form.forms[this.eForm.get('id')] = this;
    this.id = this.eForm.get('id');
    this.setOptions(options);
    if (!this.options.disableInit) this.init();
  },

  init: function() {
    // core
    this.initDynamicJs();
    this.initInlineJs();
    this.initValidation();
    this.initSubmit();
    // more
    this.initVisibilityConditions();
    this.initHeaderToggle();
    this.initFileNav();
    this.initActive();
    this.initCols();
    this.initImagePreview();
    if (this.options.focusFirst) {
      var focused = false;
      var eFirstAdvice = this.eForm.getElement('.static-advice');
      if (eFirstAdvice) {
        var eInput = eFirstAdvice.getParent('.element').getElement('input');
        if (eInput) {
          focused = true;
          eInput.focus();
        }
      }
      if (!focused) {
        var f = this.eForm.getElement(Ngn.Frm.textSelector);
        if (f) f.focus();
      }
    }
    // Если у первого элемента есть плейсхолдер, значит и у всех остальных. Инициализируем кроссбрауузерные плейсхолдеры (для IE9)
    var eFirstTextInput = this.eForm.getElement(Ngn.Frm.textSelector);
    if (eFirstTextInput && eFirstTextInput.get('placeholder')) new Ngn.PlaceholderSupport();
    this.eForm.getElements('input[type=text],input[type=password]').each(function(el) {
      el.addEvent('keypress', function(e) {
        if (e.key == 'enter') this.submit();
      }.bind(this));
    }.bind(this));
  },

  initValidation: function() {
    var opts = {};
    opts.evaluateOnSubmit = false;
    if (this.options.dialog) {
      opts.scrollToErrorsOnSubmit = false;
      // opts.scrollElement = this.options.dialog.message;
    }
    this.validator = new Ngn.Form.Validator(this, opts);
  },

  initDynamicJs: function() {
    var js = $(this.eForm.get('id') + 'js');
    if (js) {
      Asset.javascript(js.get('html'), {
        onLoad: function() {
          var func = eval('Ngn.Frm.init.' + this.eForm.get('id'));
          if (func) func();
          this.fireEvent('jsComplete');
        }.bind(this)
      });
    }
  },

  initInlineJs: function() {
    var js = $(this.eForm.get('id') + 'jsInline');
    if (js) {
      try {
        eval(js.get('html'));
      } catch (e) {
        throw new Error('Error in code: ' + js.get('html') + "\nerror:" + e.toString());
      }
    }
  },

  initImagePreview: function() {
    this.eForm.getElements('.elImagePreview').each(function(el) {
      var eFileNav = el.getElement('.fileNav');
      if (!eFileNav) return;
      eFileNav.inject(el.getElement('.label'), 'top');
    });
    Ngn.Milkbox.add(this.eForm.getElements('a.lightbox'));
  },

  initActive: function() {
    this.eForm.getElements(Ngn.Frm.textSelector).each(function(el) {
      this.initActiveEl(el);
    }.bind(this));
  },

  initActiveEl: function(el) {
    el.addEvent('focus', function() {
      this.addClass('active');
    });
    el.addEvent('blur', function() {
      this.removeClass('active');
    });
  },

  initCols: function() {
    var cols = this.eForm.getElements('.type_col');
    for (var i = 0; i < cols.length; i++) {
      var children = cols[i].getChildren();
      var eColBody = new Element('div', {'class': 'colBody'}).inject(cols[i]);
      for (var j = 0; j < children.length; j++)
        children[j].inject(eColBody);
    }
  },

  disable: function(flag) {
    if (this.options.ajaxSubmit) {
      Ngn.Frm.disable(this.eForm, flag);
    } else {
      var eSubmit = this.eForm.getElement('input[type=submit]');
      if (eSubmit) {
        eSubmit.addClass('disabled');
        eSubmit.set('disabled', flag);
      }
    }
  },

  submit: function() {
    if (this.submiting) return false;
    if (!this.validator.validate()) return false;
    this.fireEvent('submit');
    this.disable(true);
    this.submiting = true;
    if (this.uploadType == 'html5') {
      this.submitHtml5();
    } else if (this.uploadType == 'default' && !this.options.ajaxSubmit) {
      this.eForm.submit();
    } else {
      this.submitAjax();
    }
    return true;
  },

  initSubmit: function() {
    this.eForm.addEvent('submit', function(e) {
      e.preventDefault();
      this.submit();
    }.bind(this));
  },

  uploadType: 'default',
  uploadOptions: null,

  initUpload: function(opt) {
    if (!this.hasFilesFields()) return;
    if (!opt || !opt.url) throw Error("$options['uploadOptions']['url'] of php Form object must be defined. Use UploadTemp::extendFormOptions to add this option to Form object");
    this.uploadOptions = opt;
    if ('FormData' in window) this.initHtml5Upload();
    if (this.uploadType == 'default') {
      this.uploadType = 'iframe';
      this.initIframeRequest();
    }
  },

  uploads: [],

  submitHtml5: function() {
    this.uploads.each(function(upload) {
      upload.send(false);
    }.bind(this));
  },

  initHtml5Upload: function() {
    if (!this.hasFilesFields()) return;
    this.uploadType = 'html5';
    this.eForm.getElements('input[type=file]').each(function(eInput) {
      if (eInput.retrieve('uploadInitialized')) return;
      eInput.store('uploadInitialized', true);
      var cls = eInput.get('multiple') ? 'multiUpload' : 'upload';
      var eInputValidator = new Element('input', {
        type: 'hidden'
        //name: eInput.get('name') + '_helper'
      }).inject(eInput, 'after');
      var fileSaved = eInput.getParent('.element').getElement('.fileSaved');
      if (!fileSaved) eInputValidator.addClass(eInput.hasClass('required') ? 'validate-' + cls + '-required' : 'validate-' + cls);
      if (eInput.get('data-file')) eInputValidator.set('value', 1);
      var name = eInput.get('name');
      this.oneFileCompleteEventFired = false;
      var uploadOptions = {
        url: this.uploadOptions.url.replace('{fn}', name),
        loadedFiles: this.uploadOptions.loadedFiles,
        fileEvents: {
          change: function() {
            eInputValidator.set('value', 1);
          },
          empty: function() {
            eInputValidator.set('value', '');
          }
        },
        onComplete: function(r) {
          if (this.allUploadsIsEmpty() && this.oneFileCompleteEventFired) {
            return;
          }
          this.oneFileCompleteEventFired = true;
          if (this.hasUploadsInProgress()) return;
          this.submitedAndUploaded(r);
        }.bind(this)
      };
      if (!eInput.get('multiple')) {
        this.addUpload(new Ngn.Form.Upload.Single(this, eInput, uploadOptions));
      } else {
        uploadOptions.url += '&multiple=1';
        this.addUpload(new Ngn.Form.Upload.Multi(this, eInput, uploadOptions));
      }
    }.bind(this));
  },

  submitedAndUploaded: function() {
    this.submitAjax();
  },


  /**
   * @property upload Ngn.Form.Upload
   */
  addUpload: function(upload) {
    this.uploads.push(upload);
  },

  allUploadsIsEmpty: function() {
    for (var i = 0; i < this.uploads.length; i++) {
      if (this.uploads[i].file) return false;
    }
    return true;
  },

  hasUploadsInProgress: function() {
    for (var i = 0; i < this.uploads.length; i++) {
      if (this.uploads[i].inProgress) return true;
    }
    return false;
  },

  hasFilesFields: function() {
    return this.eForm.getElements('input[type=file]').length != 0;
  },

  initHeaderToggle: function() {
    var htBtns = this.eForm.getElements('.type_headerToggle .toggleBtn');
    var ht = [];
    if (htBtns) {
      for (var i = 0; i < htBtns.length; i++)
        ht.push(new Ngn.Frm.HeaderToggle(htBtns[i]));
    }
    if (this.options.equalElementHeights) {
      this.setEqualHeights();
      for (i = 0; i < ht.length; i++)
        ht[i].addEvent('toggle', function(open) {
          if (open) this.setEqualHeights();
        }.bind(this));
    }
  },

  visibilityConditions: [],

  setEqualHeights: function() {
    this.eForm.getElements('.hgrp').each(function(eHgrp) {
      Ngn.equalItemHeights(eHgrp.getElements('.element').filter(function(el) {
        return !el.hasClass('subElement');
      }));
    });
  },

  initVisibilityConditions: function() {
    var vc = this.eForm.getElement('.visibilityConditions');
    if (!vc) return;
    vc = JSON.decode(vc.get('html'));
    for (var i = 0; i < vc.length; i++) {
      var cls = eval('Ngn.Frm.VisibilityCondition.' + Ngn.String.ucfirst(vc[i][3]));
      this.visibilityConditions[vc[i][0]] = new cls(this.eForm, vc[i][0], vc[i][1], vc[i][2]);
    }
  },

  resetVisibilityConditionOfFieldSection: function(eInput) {
    var eHgrp = eInput.getParent().getParent('.hgrp');
    if (!eHgrp) return;
    var headerName = eHgrp.get('class').replace(/.* hgrp_(\w+) .*/, '$1');
    if (headerName && this.visibilityConditions[headerName])
      (function() {
        this.visibilityConditions[headerName].fx.show();
      }).delay(500, this);
  },

  initValues: {},

  initAutoGrow: function() {
    this.eForm.getElements('textarea').each(function(el) {
      new AutoGrow(el);
    });
  },

  initIframeRequest: function() {
    this.iframeRequest = new Ngn.IframeFormRequest.JSON(this.eForm);
    return this.iframeRequest;
  },

  addElements: function(eRow) {
    eRow.getElements('.element').each(function(el) {
      Ngn.Form.ElInit.factory(this, Ngn.Form.getElType(el));
    }.bind(this));
    this.initHtml5Upload();
  },

  initFileNav: function() {
    this.eForm.getElements('.fileNav').each(function(eFileNav) {
      Ngn.Btn.addAjaxAction(eFileNav.getElement('.delete'), 'delete', function() {
        eFileNav.dispose();
      });
    });
  },

  submitAjax: function() {
    this.options.ajaxSubmit ? this._submitAjax() : this._submit();
  },

  _submitAjax: function() {
    new Ngn.Request.JSON({
      url: this.options.ajaxSubmitUrl || this.eForm.get('action'),
      onComplete: function(r) {
        this.disable(false);
        this.submiting = false;
        if (r && r.form) {
          this.fireEvent('failed', r);
          return;
        }
        this.fireEvent('complete', r);
      }.bind(this)
    }).post(Ngn.Frm.toObj(this.eForm));
  },

  _submit: function() {
    this.eForm.submit();
  }

});


Ngn.Form.factories = {};
Ngn.Form.registerFactory = function(id, func) {
  Ngn.Form.factories[id] = func;
};

Ngn.Form.factory = function(eForm, opts) {
  eForm = document.id(eForm, true);
  if (Ngn.Form.factories[eForm.get('id')]) {
    return Ngn.Form.factories[eForm.get('id')](eForm, opts);
  }
  var name = 'Ngn.' + (eForm.get('data-class') || 'Form');
  var cls = eval(name);
  if (!cls) throw new Error('class ' + name + ' not found');
  return new cls(eForm, opts);
};

Ngn.Form.forms = {};
Ngn.Form.elOptions = {};

Ngn.Form.ElInit = new Class({

  initialize: function(form, type) {
    this.form = form;
    this.type = type;
    this.init();
  },

  init: function() {
    var els = this.form.eForm.getElements('.type_' + this.type);
    if (!els.length) throw new Error('No ".type_' + this.type + '" elements was found. Maybe use FieldEAbstract::_html() instead of html()');
    els.each(function(eRow) {
      if (!eRow.get('data-typejs')) return;
      var clsName = 'Ngn.Form.El.' + Ngn.String.ucfirst(this.type)
      var cls = eval(clsName);
      if (cls === undefined) throw new Error('Class "' + clsName + '" is not defined');
      if (eRow.retrieve('initialized')) return;
      new cls(this.type, this.form, eRow);
      eRow.store('initialized', true);
    }.bind(this));
  }

});

// ------------------- Form Elements Framework ----------------------

Ngn.Form.ElInit.factory = function(form, type) {
  var cls = eval('Ngn.Form.ElInit.' + Ngn.String.ucfirst(type));
  if (cls) return new cls(form, type);
  return new Ngn.Form.ElInit(form, type);
};

Ngn.Form.getElType = function(el) {
  return el.get('class').replace(/.*type_(\w+).*/, '$1');
};

Ngn.Form.elN = 0;
Ngn.Form.El = new Class({
  options: {},
  initialize: function(type, form, eRow) {
    this.type = type;
    this.form = form;
    Ngn.Form.elN++;
    this.eRow = eRow;
    this.eRow.n = Ngn.Form.elN;
    this.name = eRow.get('data-name');
    this.form.els[this.name] = this;
    if (Ngn.Form.elOptions[this.name]) this.options = Ngn.Form.elOptions[this.name];
    this.init();
  },
  fireFormElEvent: function(event, value) {
    this.form.fireEvent('el' + Ngn.String.ucfirst(this.name) + Ngn.String.ucfirst(event), value);
  },
  init: function() {
  }
});

// ------------------- Form Elements Framework End -------------------

Ngn.Form.Validator = new Class({
  Extends: Form.Validator.Inline,

  options: {
    showError: function(errorElement) {
      errorElement.setStyle('display', 'block');
    },
    hideError: function(errorElement) {
      errorElement.setStyle('display', 'none');
    },
    ignoreHidden: false,
    evaluateFieldsOnBlur: false
  },

  initialize: function(form, options) {
    if (!options) options = {};
    options.scrollElement = document.body;
    this.parent(form.eForm, options);
    this.addEvents({
      elementFail: function(eInput, name) {
        this.resetVisibilityConditionOfFieldSection(eInput);
      }.bind(form),
      elementPass: function(eInput, name) {
        this.resetVisibilityConditionOfFieldSection(eInput);
      }.bind(form)
    });
    // при инициализации формы происходит фокус на первое поле. так что сообщение об ошибке пропадает
    // так что добавляем задержку для инициализации этой фичи
    (function() {
      // Добавляем событие для элементов, имеющих статические ошибки (созданные жестко в html)
      this.element.getElements('.static-advice').each(function(eAdvice) {
        eAdvice.getParent('.element').getElement('input').addEvent('focus', function() {
          eAdvice.dispose();
        });
      });
    }).delay(2000, this);
    // убираем все эдвайсы при фокусе на поле
    this.getFields().each(function(field) {
      field.addEvent('focus', this.reset.bind(this));
    }.bind(this));
  },

  lastAdvices: {},

  makeAdvice: function(className, field, error, warn) {
    var advice;
    var errorMsg = (warn) ? this.warningPrefix : this.errorPrefix;
    errorMsg += (this.options.useTitles) ? field.title || error : error;
    var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
    var adviceWrapper = this.getAdvice(className, field);
    if (!adviceWrapper) {
      advice = new Element('div', {
        html: errorMsg
      }).addClass('advice').addClass(cssClass);
      adviceWrapper = new Element('div', {
        styles: {display: 'none'},
        id: 'advice-' + className.split(':')[0] + '-' + this.getFieldId(field)
      }).addClass('advice-wrapper').grab(advice);
      adviceWrapper.grab(new Element('div', {'class': 'corner'}), 'top').setStyle('z-index', 300);
      field.store('$moo:advice-' + className, adviceWrapper);
    } else {
      advice = adviceWrapper.getElement('.advice');
      advice.set('html', errorMsg);
    }
    this.lastAdvices[field.get('name')] = className;
    return adviceWrapper;
  },

  showNewAdvice: function(className, field, error) {
    var advice = this.getAdvice(className, field);
    if (!advice) {
      advice = this.makeAdvice(className, field, error);
      this.insertAdvice(advice, field);
    }
    this.showAdvice(className, field);
    field.addEvent('keypress', function() {
      this.hideAdvice(className, field);
    }.bind(this));
    field.addEvent('change', function() {
      this.hideAdvice(className, field);
    }.bind(this));
    field.focus();
  },

  hideLastAdvice: function(field) {
    if (!this.lastAdvices[field.get('name')]) return;
    this.hideAdvice(this.lastAdvices[field.get('name')], field);
  },

  insertAdvice: function(advice, field) {
    advice.inject(field.getParent('.field-wrapper'), 'after');
  },

  rewatchFields: function() {
    this.watchFields(this.getFields());
  },

  getScrollFx: function() {
    var par = this.options.scrollElement || document.id(this).getParent();
    return new Fx.Scroll(par, this.options.scrollFxOptions);
  }

});

Form.Validator.add('IsEmpty', {
  errorMsg: false,
  test: function(element) {
    if (element.type == 'select-one' || element.type == 'select') {
      return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
    } else if (element.type == 'file') {
      return element.get('data-file') == null;
    } else {
      return ((element.get('value') == null) || (element.get('value').length == 0));
    }
  }
});

Ngn.getReadableFileSizeString = function(fileSizeInBytes) {
  var i = -1;
  var byteUnits = [' Кб', ' Мб', ' Гб'];
  do {
    fileSizeInBytes = fileSizeInBytes / 1024;
    i++;
  } while (fileSizeInBytes > 1024);
  return Math.max(fileSizeInBytes, 0.1).toFixed(0) + byteUnits[i];
};

Form.Validator.addAllThese([['should-be-changed', {
  errorMsg: 'значение этого поля должно быть изменено',
  test: function(element) {
    if (Ngn.Form.forms[element.getParent('form').get('id')].initValues[element.get('name')] == element.get('value'))
      return false; else
      return true;
  }
}], ['validate-num-min', {
  errorMsg: 'слишком маленькое число',
  test: function(element, props) {
    if (!element.get('value')) return true;
    var strict = typeOf(element.get('data-strict')) != 'null';
    if (typeOf(element.get('data-min')) != 'null') {
      var value = parseFloat(element.get('value').replace(/\s/g, ''));
      element.set('value', value);
      var min = parseFloat(element.get('data-min'));
      return strict ? value > min : value >= min;
    }
  }
}], ['validate-num-max', {
  errorMsg: 'слишком большое число',
  test: function(element, props) {
    if (!element.get('value')) return true;
    var strict = typeOf(element.get('data-strict')) != 'null';
    if (typeOf(element.get('data-max')) != 'null') {
      var value = parseFloat(element.get('value').replace(/\s/g, ''));
      element.set('value', value);
      var max = parseFloat(element.get('data-max'));
      return strict ? value < max : value <= max;
    }
  }
}], ['validate-name', {
  errorMsg: 'должно содержать только латинские символы, тире, подчеркивание и не начинаться с цифры',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.match(/^[a-z][a-z0-9-_]*$/i)) return true; else return false;
  }
}], ['validate-fullName', {
  errorMsg: 'неправильный формат имени',
  test: function(element) {
    //return true;
    if (!element.value) return true;
    if (element.value.match(/^\S+\s+\S+\s+\S+.*$/i)) return true; else return false;
  }
}], ['validate-domain', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.match(/^[a-z][a-z0-9-.]*[a-z]$/i)) return true; else return false;
  }
}], ['validate-phone', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    element.value = element.value.trim();
    element.value = element.value.replace(/[\s\-\(\)]/g, '');
    element.value = element.value.replace(/^8(.*)/g, '+7$1');
    return /^\+\d{11}$/g.test(element.value);
  }
}], ['validate-procent', {
  errorMsg: 'введите число от 0 до 100',
  test: function(element) {
    if (!element.value) return true;
    element.value = parseInt(element.value);
    return (element.value >= 0 && element.value <= 100);
  }
}], ['validate-skype', {
  errorMsg: 'неправильный формат',
  test: function(element) {
    if (!element.value) return true;
    if (element.value.length > 32 || element.value.length < 6) return false;
    if (element.value.match(/^[a-z][a-z0-9._]*$/i)) return true; else return false;
  }
}], ['required-wisiwig', {
  errorMsg: 'поле обязательно для заполнения',
  test: function(element) {
    return !!Ngn.clearParagraphs(tinyMCE.get(element.get('id')).getContent());
  }
}], ['validate-request', {
  errorMsg: 'Дождитесь загрузки',
  test: function(element) {
    return element.get('value') == 'complete' ? true : false;
  }
}], ['validate-upload-required', {
  errorMsg: 'Файл не выбран',
  test: function(element) {
    return element.get('value') ? true : false;
  }
}], ['validate-multiUpload-required', {
  errorMsg: 'Файлы не выбраны',
  test: function(element) {
    return element.get('value') ? true : false;
  }
}], ['maxFileSizeExceeded', {
  errorMsg: 'Превышен максимальный размер файла ' + Ngn.getReadableFileSizeString(Ngn.fileSizeMax),
  test: function() {
    return false;
  }
}]]);

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.elementExtras.js|--*/
Element.implement({
  values: function() {
    var r = {};
    this.getElements('input').each(function(el) {
      if (el.get('type') == 'radio') {
        if (el.get('checked')) {
          r = el.get('value');
        }
      } else if (el.get('type') == 'checkbox') {
        if (el.get('checked')) {
          r[el.get('name')] = el.get('value');
        }
      } else {
        r[el.get('name')] = el.get('value');
      }
    });
    return r;
  },
  getSizeWithMarginBorder: function() {
    var s = this.getSize();
    return {
      x: parseInt(this.getStyle('margin-left')) + parseInt(this.getStyle('margin-right')) + parseInt(this.getStyle('border-left-width')) + parseInt(this.getStyle('border-right-width')) + s.x,
      y: parseInt(this.getStyle('margin-top')) + parseInt(this.getStyle('margin-bottom')) + parseInt(this.getStyle('border-top-width')) + parseInt(this.getStyle('border-bottom-width')) + s.y
    };
  },
  getSizeWithMargin: function() {
    var s = this.getSize();
    return {
      x: parseInt(this.getStyle('margin-left')) + parseInt(this.getStyle('margin-right')) + s.x,
      y: parseInt(this.getStyle('margin-top')) + parseInt(this.getStyle('margin-bottom')) + s.y
    };
  },
  getSizeWithoutBorders: function() {
    var s = this.getSize();
    return {
      x: s.x - parseInt(this.getStyle('border-left-width')) - parseInt(this.getStyle('border-right-width')),
      y: s.y - parseInt(this.getStyle('border-top-width')) - parseInt(this.getStyle('border-bottom-width'))
    };
  },
  getSizeWithoutPadding: function() {
    var s = this.getSize();
    return {
      x: s.x - parseInt(this.getStyle('padding-left')) - parseInt(this.getStyle('padding-right')),
      y: s.y - parseInt(this.getStyle('padding-top')) - parseInt(this.getStyle('padding-bottom'))
    };
  },
  setSize: function(s) {
    if (!s.x && !s.y) throw new Error('No sizes defined');
    if (s.x) this.setStyle('width', s.x + 'px');
    if (s.y) this.setStyle('height', s.y + 'px');
    this.fireEvent('resize');
  },
  setValue: function(v) {
    this.set('value', v);
    this.fireEvent('change');
  },
  getPadding: function() {
    return {
      x: parseInt(this.getStyle('padding-left')) + parseInt(this.getStyle('padding-right')),
      y: parseInt(this.getStyle('padding-top')) + parseInt(this.getStyle('padding-bottom'))
    };
  },
  storeAppend: function(k, v) {
    var r = this.retrieve(k);
    this.store(k, r ? r.append(v) : r = [v]);
  },
  setTip: function(title) {
    if (!Ngn.tips) Ngn.initTips(this);
    if (this.retrieve('tip:native')) {
      Ngn.tips.hide(this);
      this.store('tip:title', title);
    } else {
      Ngn.tips.attach(this);
    }
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.js|--*/
Ngn.Frm = {};
Ngn.Frm.init = {}; // объект для хранения динамических функций иниыиализации
Ngn.Frm.html = {};
Ngn.Frm.selector = 'input,select,textarea';
Ngn.Frm.textSelector = 'input[type=text],input[type=password],textarea';

Ngn.Frm.getValueByName = function(name, parent) {
  return Ngn.Frm.getValue(Ngn.Frm.getElements(name, parent));
};

Ngn.Frm.emptify = function(eInput) {
  if (eInput.get('type') == 'checkbox') eInput.set('checked', false); else eInput.get('value', '');
};

/**
 * @param Element|array of Element
 * @returns {*}
 */
Ngn.Frm.getValue = function(el) {
  if (el.length === undefined) {
    var elements = el.getElements(Ngn.Frm.selector);
  } else {
    var elements = el;
  }
  var r = null;
  var res = [];
  var i = 0;
  elements.each(function(el) {
    var type = el.get('type');
    if (type == 'checkbox') {
      if (el.get('checked')) res[i] = el.get('value');
      i++;
    } else if (type == 'radio') {
      if (el.get('checked'))
        r = el.get('value');
    } else {
      r = el.get('value');
    }
  });
  if (res.length != 0) r = res;
  return r;
};

Ngn.Frm.getValues = function(el) {
  if (el.length === undefined) {
    var elements = el.getElements(Ngn.Frm.selector);
  } else {
    var elements = el;
  }
  var r = [];
  elements.each(function(el) {
    var type = el.get('type');
    if (type == 'radio' || type == 'checkbox') {
      if (el.get('checked'))
        r.push(el.get('value'));
    } else {
      r = [el.get('value')];
    }
  });
  return r;
};

Ngn.Frm.getElements = function(name, parent) {
  var elements = [];
  var n = 0;
  var _name;
  parent = parent || document;
  parent.getElements(Ngn.Frm.selector).each(function(el) {
    _name = el.get('name');
    if (!_name) return;
    if (_name.replace('[]', '') != name) return;
    elements[n] = el;
    n++;
  });
  return elements;
};

Ngn.Frm.virtualElements = [];
Ngn.Frm.disable = function(eForm, flag) {
  eForm.getElements(Ngn.Frm.selector).each(function(el) {
    el.set('disabled', flag);
  });
  // console.debug(Ngn.Frm.virtualElements);
  for (var i = 0; i < Ngn.Frm.virtualElements.length; i++) {
    // var o = Ngn.Frm.virtualElements[i];
    // console.debug([o, o.getForm()]);
    // if (o.getForm() && o.getForm().get('id') != eForm.get('id')) return;
    // o.toggleDisabled(!flag);
  }
};

// формат callback ф-ии должен быть следующим:
// function (fieldValue, args) {}
Ngn.Frm.addEvent = function(event, name, callback, args) {
  var elements = Ngn.Frm.getElements(name);
  elements.each(function(el) {
    el.addEvent(event, function(e) {
      callback.run([Ngn.Frm.getValue(elements), args], el);
    });
  });
}

Ngn.enumm = function(arr, tpl, glue) {
  if (glue == undefined) glue = '';
  for (var i = 0; i < arr.length; i++)
    arr[i] = tpl.replace('{v}', arr[i]);
  return arr.join(glue);
};

Ngn.Frm.getPureName = function($bracketName) {
  return $bracketName.replace(/(\w)\[.*/, '$1');
};

Ngn.Frm.getBracketNameKeys = function(name) {
  var m;
  m = name.match(/([^[]*)\[/);
  if (!m) return [name];
  var keys = [];
  keys.append([m[1]]);
  var re = /\[([^\]]*)\]/g;
  while (m = re.exec(name)) {
    keys.append([m[1]]);
  }
  return keys;
};

Ngn.Frm.fillEmptyObject = function(object, keys) {
  for (var i = 0; i < keys.length - 1; i++) {
    var p = 'object' + (Ngn.enumm(keys.slice(0, i + 1), "['{v}']"));
    eval('if (' + p + ' == undefined) ' + p + ' = {}');
  }
};

Ngn.Frm.setValueByBracketName = function(o, name, value) {
  var _name = name.replace('[]', '');
  if (!(o instanceof Object)) throw new Error('o is not object');
  var keys = Ngn.Frm.getBracketNameKeys(_name);
  Ngn.Frm.fillEmptyObject(o, keys);
  var p = 'o';
  for (var i = 0; i < keys.length; i++) p += "['" + keys[i] + "']";
  if (name.contains('[]')) {
    eval(p + ' = (' + p + ' != undefined) ? ' + p + '.concat(value) : [value]');
  } else {
    //eval(p+' = $defined('+p+') ? [].concat('+p+', value) : value');
    eval(p + ' = value');
  }
  return o;
};

Ngn.Frm.objTo = function(eContainer, obj) {
  for (var i in obj) {
    eContainer.getElement('input[name=' + i + ']').set('value', obj[i]);
  }
};

Ngn.Frm.toObj = function(eContainer, except) {
  var rv = {};
  except = except || [];
  eContainer = $(eContainer);
  var typeMatch = 'text' + (!except.contains('hidden') ? '|hidden' : '') + (!except.contains('password') ? '|password' : '');
  var elements = eContainer.getElements(Ngn.Frm.selector);
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    if (!el.name) continue;
    var pushValue = undefined;
    if (el.get('tag') == 'textarea' && el.get('aria-hidden')) {
      // Значит из этой texarea был сделан tinyMce
      pushValue = tinyMCE.get(el.get('id')).getContent();
      //} else if ((el.get('tag') == 'input' && el.type.match(new RegExp('^' + typeMatch + '$', 'i'))) || el.get('tag') == 'textarea' || (el.get('type').match(/^checkbox|radio$/i) && el.get('checked'))) {
    } else if ((el.get('tag') == 'input' && el.type.match(new RegExp('^' + typeMatch + '$', 'i'))) || el.get('tag') == 'textarea' || (el.get('type').match(/^radio$/i) && el.get('checked'))) {
      pushValue = el.value;
    } else if ((el.get('type').match(/^checkbox$/i) && el.get('checked'))) {
      var pushValue = [];
      eContainer.getElement('.name_'+el.name).getElements('input').each(function(checkbox){
        if(checkbox.get('checked'))  pushValue.push(checkbox.value);
      });
    } else if (el.get('tag') == 'select') {
      if (el.multiple) {
        var pushValue = [];
        for (var j = 0; j < el.options.length; j++)
          if (el.options[j].selected)
            pushValue.push(el.options[j].value);
        if (pushValue.length == 0) pushValue = undefined;
      } else {
        pushValue = el.options[el.selectedIndex].value;
      }
    }
    if (pushValue != undefined) {
      Ngn.Frm.setValueByBracketName(rv, el.name, pushValue);
    }
  }
  return rv;
};

Ngn.Frm.initTranslateField = function(eMasterField, eTranslatedField) {
  var eMasterField = $(eMasterField);
  var eTranslatedField = $(eTranslatedField);
  //if (!eMasterField || !eTranslatedField) return;
  var translatedValueExists = eTranslatedField.get('value') ? true : false;
  var translatedFieldEdited = false;
  var translateField = function() {
    if (translatedValueExists || translatedFieldEdited) return;
    eTranslatedField.set('value', translate(trim(eMasterField.get('value'))));
  };
  eMasterField.addEvent('keyup', translateField);
  eMasterField.addEvent('blur', translateField);
  eMasterField.addEvent('click', translateField);
  eTranslatedField.addEvent('keyup', function(e) {
    translatedFieldEdited = true;
  });
};

Ngn.Frm.initCopySelectValue = function(eSelectField, eSlaveField, param) {
  if (param == undefined) param = 'value';
  var eSelectField = $(eSelectField);
  var eSlaveField = $(eSlaveField);
  eSlaveField.addEvent('keyup', function() {
    eSlaveField.store('edited', true);
  });
  eSelectField.addEvent('change', function() {
    if (eSlaveField.retrieve('edited')) return;
    eSlaveField.set('value', eSelectField.options[eSelectField.selectedIndex].get(param));
    eSlaveField.fireEvent('blur');
  });
};

Ngn.Frm.initCopySelectTitle = function(eSelectField, eSlaveField) {
  Ngn.Frm.initCopySelectValue(eSelectField, eSlaveField, 'text');
};

Ngn.Frm.storable = function(eInput) {
  if (!eInput.get('id')) throw new Error('ID param mast be defined');
  var store = function() {
    Ngn.Storage.set(eInput.get('id'), eInput.get('value'));
  };
  var restore = function() {
    eInput.set('value', Ngn.Storage.get(eInput.get('id')));
  };
  restore();
  eInput.addEvent('keypress', function() {
    (function() {
      store();
    }).delay(100);
  });
  eInput.addEvent('blur', function() {
    store();
  });
}

// @requiresBefore i/js/ngn/core/Ngn.elementExtras.js
Ngn.Frm.virtualElement = {
  // abstract toggleDisabled: function(flag) {},
  parentForm: null,
  initVirtualElement: function(el) {
    var eForm = el.getParent('form');
    if (!eForm) return;
    eForm.storeAppend('virtualElements', this);
  },
  getForm: function() {
  }
};

Ngn.Frm.maxLength = function(eForm, defaultMaxLength) {
  eForm.getElements('textarea').each(function(eInput){
    var eLabel = eInput.getParent('.element').getElement('.label');
    var maxlength = eInput.get('maxlength');
    if (!eLabel || !maxlength) return;
    var init = function() {
      eRemained.set('html',
        ' (осталось ' + (maxlength-eInput.get('value').length) + ' знаков из ' + maxlength + ')'
      );
    };
    if (maxlength >= defaultMaxLength) return;
    var eRemained = new Element('small', {
      'class': 'remained gray'
    }).inject(eLabel, 'bottom');
    eInput.addEvent('keyup', init);
    init();
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Storage.js|--*/
Ngn.Storage = {
  get: function(key) {
    if (localStorage) {
      var v = localStorage.getItem(key);
    } else {
      var v = Cookie.read(key);
    }
    if (v == 'false') return false; else if (v == 'true') return true; else return v;
  },
  set: function(key, value) {
    if (localStorage) {
      localStorage.setItem(key, value)
    } else {
      Cookie.write(key, value);
    }
  },
  remove: function(key) {
    localStorage.removeItem(key);
  },
  bget: function(key, value) {
    return !!this.get(key);
  }
};

Ngn.Storage.int = {

  get: function(key) {
    return parseInt(Ngn.Storage.get(key));
  }

};

Ngn.Storage.json = {
  get: function(key) {
    try {
      if (localStorage) {
        var r = Ngn.LocalStorage.json.get(key);
      } else {
        var r = JSON.decode(Cookie.read(key));
      }
    } catch (e) {
      var r = {};
    }
    return r;
  },
  set: function(key, data) {
    if (localStorage)
      Ngn.LocalStorage.json.set(key, data); else
      Cookie.write(key, JSON.encode(data));
  }
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.LocalStorage.js|--*/
Ngn.LocalStorage = {

  clean: function() {
    if (!localStorage) return;
    try {
      for (var k in localStorage) {
        localStorage.removeItem(k);
      }
    } catch (e) {
      for (var i = 0; i < localStorage.length; i++)
        localStorage.removeItem(localStorage[i]);
    }
  },

  remove: function(key) {
    if (!localStorage) return false;
    localStorage.removeItem(key);
  }

};

Ngn.LocalStorage.json = {

  get: function(key) {
    if (!localStorage) return false;
    return JSON.decode(localStorage.getItem(key));
  },

  set: function(key, data) {
    localStorage.setItem(key, JSON.encode(data));
  }

};

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.PlaceholderSupport.js|--*/
Ngn.PlaceholderSupport = new Class({

  initialize : function(els){
    if(('placeholder' in document.createElement('input'))) return;
    var self = this;
    this.elements = (typeOf(els) === 'string') ? $$(els) : els;
    if(typeOf(this.elements) === 'null' || typeOf(this.elements[0]) === 'null') {
      this.elements = $$('input[placeholder],textarea[placeholder]');
    }
    this.elements.each(function(input){
      var textColor = input.getStyle('color');
      var lighterTextColor = self.lightenDarkenColor(textColor,80);
      if(input.getProperty('value') === '') {
        input.setProperty('value',input.getProperty('placeholder'));
        input.setStyle('color',lighterTextColor);
      }
      input.addEvents({
        focus: function(){
          if(input.getProperty('value') === input.getProperty('placeholder')) {
            input.setProperty('value','');
            input.setStyle('color',textColor);
          }
        },
        blur: function(){
          if(input.getProperty('value') === '') {
            input.setProperty('value',input.getProperty('placeholder'));
            input.setStyle('color',lighterTextColor);
          }
        }
      });
    });
  },

  lightenDarkenColor: function(col,amt) {
     var usePound = false;
    if ( col[0] == "#" ) {
        col = col.slice(1);
        usePound = true;
    }
    var num = parseInt(col,16);
    var r = (num >> 16) + amt;
    if ( r > 255 ) r = 255;
    else if  (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if ( b > 255 ) b = 255;
    else if  (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if ( g > 255 ) g = 255;
    else if  ( g < 0 ) g = 0;
    var rStr = (r.toString(16).length < 2)?'0'+r.toString(16):r.toString(16);
    var gStr = (g.toString(16).length < 2)?'0'+g.toString(16):g.toString(16);
    var bStr = (b.toString(16).length < 2)?'0'+b.toString(16):b.toString(16);
    return (usePound?"#":"") + rStr + gStr + bStr;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Milkbox.js|--*/
(function() {

  var milkbox_singleton = null;

  Ngn.Milkbox = new Class({
    Implements: [Options, Events],

    options: { //set all the options here
      overlayOpacity: 0.7,
      marginTop: 10,
      initialWidth: 250,
      initialHeight: 250,
      fileboxBorderWidth: '0px',
      fileboxBorderColor: '#000000',
      fileboxPadding: '0px',
      resizeDuration: .5,
      resizeTransition: 'sine:in:out', /*function (ex. Transitions.Sine.easeIn) or string (ex. 'bounce:out')*/
      autoPlay: false,
      autoPlayDelay: 7,
      removeTitle: true,
      autoSize: true,
      autoSizeMaxHeight: 0,//only if autoSize==true
      centered: false,
      imageOfText: 'из',
      onXmlGalleries: function() {
      },
      onClosed: function() {
      },
      onFileReady: function() {
      }
    },

    initialize: function(options) {
      if (milkbox_singleton) return milkbox_singleton;
      milkbox_singleton = this;

      this.setOptions(options);
      this.autoPlayBkup = { autoPlayDelay: this.options.autoPlayDelay, autoPlay: this.options.autoPlay };
      this.fullOptionsBkup = {};
      this.galleries = [];
      this.formElements = [];
      this.activated;
      this.busy = false;
      this.paused = false;
      this.closed = true;
      this.intId;
      this.loadCheckerId;
      this.externalGalleries = [];
      this.singlePageLinkId = 0;

      this.currentIndex;
      this.currentGallery;
      this.fileReady;
      this.loadedImages = [];
      this.currentFile;
      this.options_bkup;

      this.display;

      this.getPageGalleries();
      if (this.galleries.length != 0) {
        this.prepare(true);
      }
    },

    prepare: function(checkForm) {
      // if(checkForm){ this.checkFormElements(); }
      this.prepareHTML();
      this.prepareEventListeners();
      this.activated = true;
    },

    //utility
    open: function(gallery, index) {
      var i;

      if (!this.activated) {
        this.prepare(true);
      }

      var g = (instanceOf(gallery, Ngn.MilkboxGallery)) ? gallery : this.getGallery(gallery);
      if (!g) return false;

      // [i_a] when 'index' is not an number, it may be a element reference or string: resolve such indexes too
      if (typeOf(index) !== 'number') {
        i = g.get_index_of(index);
        if (i !== -1) {
          index = i;
        }
      }

      i = parseInt(index, 10);
      if (isNaN(i)) {
        i = 0;
      }

      this.closed = false;
      var item = g.get_item(i);
      if (!item) return false;

      this.currentGallery = g;
      this.currentIndex = i;

      this.hideFormElements();

      this.display.set_mode(this.currentGallery.type);
      this.display.appear();


      if (this.options.autoPlay || g.options.autoplay) {
        this.startAutoPlay(true);
      }

      this.loadFile(item, this.getPreloads());
      return true;
    },

    //utility
    close: function(hideDisplay) {
      if (hideDisplay) {
        this.display.disappear();
      }
      this.showFormElements();
      this.pauseAutoPlay();
      this.stopLoadingCheck();
      this.currentGallery = null;
      this.currentIndex = null;
      this.currentFile = null;
      this.busy = false;
      this.paused = false;
      this.fileReady = false;
      this.closed = true;

      this.fireEvent('close');
    },

    startAutoPlay: function(opening) {
      var d = this.currentGallery.options.autoplay_delay || this.options.autoPlayDelay;
      if (d < this.options.resizeDuration * 2) {
        d = this.options.resizeDuration * 2
      }
      ;

      var f = function() {
        this.removeEvent('fileReady', f);
        this.intId = this.navAux.periodical(d * 1000, this, [null, 'next']);
      }

      if (opening) {
        this.addEvent('fileReady', f);
      } else {
        this.intId = this.navAux.periodical(d * 1000, this, [null, 'next']);
      }

      this.paused = false;
    },

    pauseAutoPlay: function() {
      if (this.intId) {
        clearInterval(this.intId);
        this.intId = null;
      }

      this.paused = true;
    },

    //utility
    //list:Array of objects or an object > [ { gallery:'gall1', autoplay:true, delay:6 } ]
    //to permanently define autoplay options for any gallery 
    setAutoPlay: function(list) {
      var l = (typeOf(list) == 'object') ? [list] : list;
      l.each(function(item) {
        var g = this.getGallery(item.gallery);
        if (!g) {
          return;
        }
        var a = (item.autoplay == true) ? item.autoplay : false;
        var d = (item.delay && a) ? item.delay : this.options.autoPlayDelay;
        g.setOptions({ autoplay: a, autoplay_delay: d }).refresh();
      }, this);
    },


    //utility  
    //{href:'file1.jpg',size:'width:900,height:100', title:'text'}
    //show a file on the fly without gallery functionalities
    openWithFile: function(file, options) {
      if (!this.activated) {
        this.prepare();
      }

      if (options) {
        this.refreshDisplay(options, true);//set custom options
      }

      var g = new Ngn.MilkboxGallery([file], { remove_title: this.options.removeTitle });
      this.open(g, 0);
    },

    getPreloads: function() {
      var items = this.currentGallery.items;
      var index = this.currentIndex;
      if (items.length == 1) return null;

      var next = (index != items.length - 1) ? items[index + 1] : items[0];
      var prev = (index != 0) ? items[index - 1] : items[items.length - 1];
      var preloads = (prev == next) ? [prev] : [prev, next]; //if gallery.length == 2, then prev == next
      return preloads;
    },

    //LOADING
    loadFile: function(fileObj, preloads) {

      this.fileReady = false;
      this.display.clear_content();
      this.display.hide_bottom();

      if (this.checkFileType(fileObj, 'swf')) {
        this.loadSwf(fileObj);
      } else if (this.checkFileType(fileObj, 'html')) {
        this.loadHtml(fileObj);
      } else {//filetype:image
        this.loadImage(fileObj);
      }

      if (!this.checkFileType(fileObj, 'swf')) this.startLoadingCheck();
      if (preloads) {
        this.preloadFiles(preloads);
      }
    },

    //to prevent the loader to show if the file is cached
    startLoadingCheck: function() {
      var t = 0;
      if (!this.loadCheckerId) {
        this.loadCheckerId = (function() {
          t += 1;
          if (t > 5) {
            if (this.loadCheckerId) {
              // only show the loader when the timer has not been cleared yet!
              this.display.show_loader();
            }
            this.stopLoadingCheck();
          }
        }).periodical(100, this);
      }//end if
    },

    stopLoadingCheck: function() {
      clearInterval(this.loadCheckerId);
    },

    preloadFiles: function(preloads) {
      preloads.each(function(fileObj, index) {
        if (!this.checkFileType(fileObj, "swf") && !this.checkFileType(fileObj, "html")) {
          this.preloadImage(fileObj.href);
        }
      }, this);
    },

    preloadImage: function(file) {
      if (!this.loadedImages.contains(file)) {
        var imageAsset = new Asset.image(file, {
          onLoad: function() {
            this.loadedImages.push(file);
          }.bind(this)
        });
      }
    },

    loadImage: function(fileObj) {
      var file = fileObj.href;
      var imageAsset = new Asset.image(file, {
        onLoad: function(img) {
          if (!this.loadedImages.contains(file)) {
            this.loadedImages.push(file);
          }
          ;//see next/prev events
          this.loadComplete(img, fileObj.caption);
        }.bind(this)
      });
    },

    loadSwf: function(fileObj) {
      var swfObj = new Swiff(fileObj.href, {
        width: fileObj.size.width,
        height: fileObj.size.height,
        vars: fileObj.vars,
        params: { wMode: 'opaque', swLiveConnect: 'false' }
      });

      this.loadComplete($(swfObj), fileObj.caption);
    },

    loadHtml: function(fileObj) {

      var query = (fileObj.vars ? '?' + Object.toQueryString(fileObj.vars) : '');

      var iFrame = new Element('iframe', {
        'src': fileObj.href + query,
        'frameborder': 0,//for IE...
        styles: {
          'border': 'none'
        }
      });

      if (fileObj.size) {
        iFrame.set({
          'width': fileObj.size.width,
          'height': fileObj.size.height
        });
      }

      this.loadComplete(iFrame, fileObj.caption);
    },//loadHtml


    //LOAD COMPLETE ********//
    loadComplete: function(file, caption) {

      if (this.closed) return;//if an onload event were still running

      this.fileReady = true;//the file is loaded and ready to be showed (see next_prev_aux())
      this.stopLoadingCheck();
      this.currentFile = file;
      var timer;
      timer = (function() {
        if (this.display.ready) {
          if (this.currentGallery.items != null) {
            this.display.show_file(file, caption, this.currentIndex + 1, this.currentGallery.items.length);
          }
          clearInterval(timer);
        }//end if
      }).periodical(100, this);

      this.fireEvent('fileReady');
    },//end loadComplete

    checkFileType: function(file, type) {
      var href = (typeOf(file) != 'string') ? file.href : file;
      var regexp = new RegExp("\.(" + type + ")$", "i");
      return href.split('?')[0].test(regexp);
    },

    //GALLERIES
    getPageGalleries: function() {
      var names = [];
      var links = $$('a[data-milkbox]');

      //check names
      links.each(function(link) {
        var name = link.get('data-milkbox');
        if (name == 'single') {
          this.galleries.push(new Ngn.MilkboxGallery(link, {name: 'single' + this.singlePageLinkId++, remove_title: this.options.removeTitle }));
        } else if (!names.contains(name)) {
          names.push(name);
        }
      }, this);

      names.each(function(name) {
        this.galleries.push(new Ngn.MilkboxGallery($$('a[data-milkbox=' + name + ']'), { name: name, remove_title: this.options.removeTitle }));
      }, this);

      //set default autoplay // override with setAutoPlay
      if (this.options.autoPlay) {
        this.galleries.each(function(g) {
          g.setOptions({autoplay: this.options.autoPlay, autoplay_delay: this.options.autoPlayDelay});
        });
      }

    },//getPageGalleries

    reloadPageGalleries: function() {
      //reload page galleries
      this.removePageGalleryEvents();

      this.galleries = this.galleries.filter(function(gallery) {
        if (!gallery.external) gallery.clear();
        return gallery.external;
      });

      this.getPageGalleries();
      this.addPageGalleriesEvents();

      if (!this.activated) {
        this.prepare(true);
      }
    },//end reloadPageGalleries

    //list: optional. Can be a single string/object or an array of strings/objects
    resetExternalGalleries: function(list) {
      this.galleries = this.galleries.filter(function(gallery) {
        if (gallery.external) gallery.clear();
        return !gallery.external;
      });

      if (!list) return;
      var array = (typeOf(list) == 'array') ? list : [list];
      array.each(function(data) {
        this.addGalleries(data);
      }, this);
    },

    //utility
    addGalleries: function(data) {
      if (!this.activated) {
        this.prepare(true);
      }
      if (typeOf(data) == 'string' && data.split('?')[0].test(/\.(xml)$/i)) {
        this.loadXml(data);
      } else {//array or object
        this.setObjectGalleries(data);
      }
      if (!this.activated) {
        this.prepare(true);
      }
    },

    loadXml: function(xmlfile) {
      var r = new Request({
        method: 'get',
        autoCancel: true,
        url: xmlfile,
        onRequest: function() {
          //placeholder
        }.bind(this),
        onSuccess: function(text, xml) {
          var t = text.replace(/(<a.+)\/>/gi, "$1></a>");
          this.setXmlGalleries(new Element('div', { html: t }));
        }.bind(this),
        onFailure: function(transport) {
          alert('Milkbox :: loadXml: XML file path error or local Ajax test: please test xml galleries on-line');
        }
      }).send();
    },

    setXmlGalleries: function(container) {
      var c = container;
      var xml_galleries = c.getElements('.gallery');
      var links;
      var aplist = [];
      xml_galleries.each(function(xml_gallery, i) {

        var options = {
          name: xml_gallery.getProperty('name'),
          autoplay: Boolean(xml_gallery.getProperty('autoplay')),
          autoplay_delay: Number(xml_gallery.getProperty('autoplay_delay'))
        }

        var links = xml_gallery.getChildren('a').map(function(tag) {
          return { href: tag.href, size: tag.get('data-milkbox-size'), title: tag.get('title') }
        }, this);

        this.galleries.push(new Ngn.MilkboxGallery(links, options));
      }, this);

      this.fireEvent('xmlGalleries');
    },//end setXmlGalleries

    //[{ name:'gall1', autoplay:true, autoplay_delay:7, files:[{href:'file1.jpg',size:'width:900,height:100', title:'text'},{href:'file2.html',size:'w:800,h:200', title:'text'}] },{...},{...}]  
    setObjectGalleries: function(data) {
      var array = (typeOf(data) == 'array') ? data : [data];
      array.each(function(newobj) {
        var options = {
          name: newobj.name,
          autoplay: newobj.autoplay,
          autoplay_delay: newobj.autoplay_delay
        }
        this.galleries.push(new Ngn.MilkboxGallery(newobj.files, options));
      }, this);
    },

    //utility
    getGallery: function(name) {
      var g = this.galleries.filter(function(gallery) {
        return gallery.name == name;
      }, this);
      return g[0] || null;
    },

    //HTML
    prepareHTML: function() {
      this.display = new Ngn.MilkboxDisplay({
        initialWidth: this.options.initialWidth,
        initialHeight: this.options.initialHeight,
        overlayOpacity: this.options.overlayOpacity,
        marginTop: this.options.marginTop,
        fileboxBorderWidth: this.options.fileboxBorderWidth,
        fileboxBorderColor: this.options.fileboxBorderColor,
        fileboxPadding: this.options.fileboxPadding,
        resizeDuration: this.options.resizeDuration,
        resizeTransition: this.options.resizeTransition,
        centered: this.options.centered,
        autoSize: this.options.autoSize,
        autoSizeMaxHeight: this.options.autoSizeMaxHeight,
        imageOfText: this.options.imageOfText
      });
    },

    refreshDisplay: function(options, keepBackup) {
      if (!this.activated) return;

      var options_bkup = this.display.options;//save original options
      var new_options = Object.merge({}, options_bkup, options);
      if (this.display) {
        this.display.clear()
      }
      this.display = new Ngn.MilkboxDisplay(new_options);
      this.addDisplayEvents();

      if (keepBackup) {
        this.options_bkup = options_bkup;//restored in close();
      } else {
        this.options_bkup = null;
      }
    },

    checkFormElements: function() {
      this.formElements = $$('select, textarea');
      if (this.formElements.length == 0) return;
      this.formElements = this.formElements.map(function(elem) {
        elem.store('visibility', elem.getStyle('visibility'));
        elem.store('display', elem.getStyle('display'));
        return elem;
      });
    },

    hideFormElements: function() {
      if (this.formElements.length == 0) return;
      this.formElements.each(function(elem) {
        elem.setStyle('display', 'none');
      });
    },

    showFormElements: function() {
      if (this.formElements.length == 0) return;
      this.formElements.each(function(elem) {
        elem.setStyle('visibility', elem.retrieve('visibility'));
        elem.setStyle('display', elem.retrieve('display'));
      })
    },

    //EVENTS
    addPageGalleriesEvents: function() {
      var pageGalleries = this.galleries.filter(function(gallery) {
        return !gallery.external
      });
      pageGalleries.each(function(gallery) {
        gallery.items.each(function(item) {
          item.element.addEvent('click', function(e) {
            e.preventDefault();
            this.open(gallery.name, gallery.get_index_of(item));
          }.bind(this));
        }, this);
      }, this);
    },

    removePageGalleryEvents: function() {
      var pageGalleries = this.galleries.filter(function(gallery) {
        return !gallery.external
      });
      pageGalleries.each(function(gallery) {
        gallery.items.each(function(item) {
          item.element.removeEvents('click');
        });
      });
    },

    addDisplayEvents: function() {
      this.display.addEvent('nextClick', function() {
        this.navAux(true, 'next');
      }.bind(this));
      this.display.addEvent('prevClick', function() {
        this.navAux(true, 'prev');
      }.bind(this));
      this.display.addEvent('playPauseClick', function() {
        if (this.paused) {
          this.startAutoPlay();
        } else {
          this.pauseAutoPlay();
        }
        this.display.set_paused(this.paused);
      }.bind(this));
      this.display.addEvent('disappear', function() {
        if (this.options_bkup) {
          this.refreshDisplay(this.options_bkup);
        }
        this.close(false);
      }.bind(this));
      this.display.addEvent('resizeComplete', function() {
        this.busy = false; // see navAux
      }.bind(this));
    },

    prepareEventListeners: function() {
      this.addPageGalleriesEvents();
      this.addDisplayEvents();
      //reset overlay height and position onResize
      window.addEvent('resize', function() {
        if (this.display.ready) {
          this.display.resetOverlaySize();
        }
      }.bind(this));
      //keyboard next/prev/close
      window.document.addEvent('keydown', function(e) {
        if (this.busy == true || this.closed) {
          return;
        }
        if (e.key == 'right' || e.key == 'left' || e.key == 'space') {
          e.preventDefault();
        }
        if (this.display.mode != 'single') {
          if (e.key == 'right' || e.key == 'space') {
            this.navAux(e, 'next');
          } else if (e.key == 'left') {
            this.navAux(e, 'prev');
          }
        }
        if (e.key == 'esc') {
          this.display.disappear();
        }
      }.bind(this));
    },

    navAux: function(e, direction) {
      if (e) {//called from a button/key event
        this.pauseAutoPlay();
      } else {//called from autoplay
        if (this.busy || !this.fileReady) {
          return;
        }//prevent autoplay()
      }
      this.busy = true; //for keyboard and autoplay
      var i, _i;
      if (direction == "next") {
        i = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex += 1 : this.currentIndex = 0;
        _i = (this.currentIndex != this.currentGallery.items.length - 1) ? this.currentIndex + 1 : 0;
      } else {
        i = (this.currentIndex != 0) ? this.currentIndex -= 1 : this.currentIndex = this.currentGallery.items.length - 1;
        _i = (this.currentIndex != 0) ? this.currentIndex - 1 : this.currentGallery.items.length - 1;
      }
      this.loadFile(this.currentGallery.get_item(i), [this.currentGallery.get_item(_i)]);
    }
  });

})();

Ngn.MilkboxDisplay = new Class({

  Implements: [Options, Events],

  options: {
    initialWidth: 100,
    initialHeight: 100,
    overlayOpacity: 1,
    marginTop: 0,
    fileboxBorderWidth: '0px',
    fileboxBorderColor: '#000000',
    fileboxPadding: '0px',
    resizeDuration: .5,
    resizeTransition: 'sine:in:out',
    centered: false,
    autoSize: false,
    autoSizeMaxHeight: 0,
    imageOfText: 'of',
    onNextClick: function() {
    },
    onPrevClick: function() {
    },
    onPlayPause: function() {
    },
    onDisappear: function() {
    },
    onResizeComplete: function() {
    }
  },

  initialize: function(options) {
    this.setOptions(options);

    this.overlay;
    this.mainbox;
    this.filebox;
    this.bottom;
    this.controls;
    this.caption;
    this.close;
    this.next;
    this.prev;
    this.playpause;
    this.paused = false;
    this.count;

    this.mode = 'standard';
    this.ready = false;//after overlay and mainbox become visible == true

    this.overlay_show_fx;
    this.overlay_hide_fx;

    this.mainbox_show_fx;
    this.mainbox_hide_fx;
    this.mainbox_resize_fx;

    this.current_file = null;

    this.build_html();
    this.prepare_effects();
    this.prepare_events();

  },//end init

  build_html: function() {
    this.overlay = new Element('div', {
      'id': 'mbox-overlay',
      'styles': {
        'visibility': 'visible',
        'position': 'fixed',
        'display': 'none',
        'left': 0,
        'width': '100%',
        'opacity': 0,
        'height': 0,
        'overflow': 'hidden',
        'margin': 0,
        'padding': 0
      }
    }).inject($(document.body));

    this.mainbox = new Element('div', {
      'id': 'mbox-mainbox',
      'styles': {
        'position': (this.options.centered) ? 'fixed' : 'absolute',
        'overflow': 'hidden',
        'display': 'none',
        'z-index': 50001,//overlay z-index (see css) + 1
        'width': this.options.initialWidth,
        'height': this.options.initialHeight,
        'opacity': 0,
        'margin': 0,
        'left': '50%',
        'marginLeft': -(this.options.initialWidth / 2),
        'marginTop': (this.options.centered) ? -(this.options.initialHeight / 2) : '',
        'top': (this.options.centered) ? '50%' : ''
      }
    }).inject($(document.body));

    this.filebox = new Element('div', {
      'id': 'mbox-filebox',
      'styles': {
        'border-style': 'solid',
        'border-width': this.options.fileboxBorderWidth,
        'border-color': this.options.fileboxBorderColor,
        'padding': this.options.fileboxPadding,
        'opacity': 0
      }
    }).inject(this.mainbox);

    this.bottom = new Element('div#mbox-bottom').setStyle('visibility', 'hidden').inject(this.mainbox);
    this.controls = new Element('div#mbox-controls');
    this.caption = new Element('div#mbox-caption', {'html': 'test'}).setStyle('display', 'none');

    this.bottom.adopt(new Element('div.mbox-reset'), this.controls, this.caption, new Element('div.mbox-reset'));

    this.close = new Element('div#mbox-close');
    this.next = new Element('div#mbox-next');
    this.prev = new Element('div#mbox-prev');
    this.playpause = new Element('div#mbox-playpause');
    this.count = new Element('div#mbox-count');

    $$(this.next, this.prev, this.close, this.playpause).setStyles({
      'outline': 'none',
      'cursor': 'pointer'
    });

    this.controls.adopt(new Element('div.mbox-reset'), this.close, this.next, this.prev, this.playpause, new Element('div.mbox-reset'), this.count);
  },

  prepare_effects: function() {
    this.overlay_show_fx = new Fx.Tween(this.overlay, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.element.setStyles({
          'top': -window.getScroll().y,
          'height': window.getScrollSize().y + window.getScroll().y,
          'display': 'block'
        });
      },
      onComplete: function() {
        this.mainbox_show_fx.start(1);
      }.bind(this)
    });

    this.overlay_hide_fx = new Fx.Tween(this.overlay, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
      },
      onComplete: function() {
        this.overlay.setStyle('display', 'none');
        this.fireEvent('disappear');
      }.bind(this)
    });

    this.mainbox_show_fx = new Fx.Tween(this.mainbox, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.mainbox.setStyle('display', 'block');
      }.bind(this),
      onComplete: function() {
        this.ready = true;
      }.bind(this)
    });

    this.mainbox_hide_fx = new Fx.Tween(this.mainbox, {
      duration: 'short',
      link: 'cancel',
      property: 'opacity',
      onStart: function() {
        this.ready = false;
      }.bind(this),
      onComplete: function() {
        this.overlay.setStyle('display', 'none');
      }.bind(this)
    });


    this.mainbox_resize_fx = new Fx.Morph(this.mainbox, {
      duration: this.options.resizeDuration * 1000,
      transition: this.options.resizeTransition,
      link: 'cancel',
      onStart: function() {
        this.filebox.setStyle('opacity', 0)
      }.bind(this),
      onComplete: function() {
        this.show_bottom();
        this.filebox.setStyle('height', this.current_file.height + 'px');
        this.filebox.grab(this.current_file).tween('opacity', 1);
        this.fireEvent('resizeComplete');
      }.bind(this)
    });

    this.filebox.set('tween', { duration: 'short', link: 'chain' });
  }, // end prepare_effects

  prepare_events: function() {
    $$(this.overlay, this.close).addEvent('click', function() {
      this.disappear();
    }.bind(this));
    this.prev.addEvent('click', function() {
      this.fireEvent('prevClick')
    }.bind(this));
    this.next.addEvent('click', function() {
      this.fireEvent('nextClick')
    }.bind(this));
    this.playpause.addEvent('click', function() {
      this.fireEvent('playPauseClick')
    }.bind(this));
  },

  show_file: function(file, caption, index, length) {
    this.hide_loader();
    if (file.match && file.match('img') && (this.options.autoSize || this.options.centered)) {
      var file = this.get_resized_image(file);
    }
    var file_size = { w: file.width.toInt(), h: file.height.toInt() };
    if (!file_size.w || !file_size.h) {
      alert('Milkbox error: you must pass size values if the file is swf or html or a free file (openWithFile)');
      return;
    } // data-milkbox-size not passed
    file_size = Object.map(file_size, function(value) {
      return value.toInt();
    });

    this.caption.innerHTML = (caption) ? caption : '';
    this.update_count(index, length);
    var filebox_addsize = this.filebox.getStyle('border-width').toInt() * 2 + this.filebox.getStyle('padding').toInt() * 2;
    var final_w = file_size.w + filebox_addsize;
    // so now I can predict the caption height
    var caption_adds = this.caption.getStyles('paddingRight', 'marginRight');
    this.caption.setStyle('width', final_w - caption_adds.paddingRight.toInt() - caption_adds.marginRight.toInt());
    $$(this.bottom, this.controls).setStyle('height', Math.max(this.caption.getDimensions().height, this.controls.getComputedSize().totalHeight));
    var mainbox_size = this.mainbox.getComputedSize();
    var final_h = file_size.h + filebox_addsize + this.bottom.getComputedSize().totalHeight;
    var target_size = {
      w: final_w,
      h: final_h,
      total_w: final_w + mainbox_size.totalWidth - mainbox_size.width,
      total_h: final_h + mainbox_size.totalHeight - mainbox_size.height
    }
    this.current_file = file;
    this.resize_to(target_size);
  }, // show_file

  // image: <img>, maxsize:{ w,h }
  get_resized_image: function(image) {
    var max_size, ratio, check;
    var i_size = { w: image.get('width').toInt(), h: image.get('height').toInt() };
    //cut out some pixels to make it better
    var w_size = window.getSize();
    max_size = {
      w: w_size.x - 60,
      h: w_size.y - 68 - this.options.marginTop * 2
    };
    var max_dim = Math.max(max_size.h, max_size.w);
    if (max_dim == max_size.w) {
      ratio = max_dim / i_size.w;
      check = 'h';
    } else {
      ratio = max_dim / i_size.h;
      check = 'w';
    }
    ratio = (ratio <= 1) ? ratio : 1;
    i_size = Object.map(i_size, function(value) {
      return Math.floor(value * ratio);
    });
    ratio = (max_size[check] / i_size[check] <= 1) ? max_size[check] / i_size[check] : 1;
    i_size = Object.map(i_size, function(value) {
      return Math.floor(value * ratio);
    });
    if (this.options.autoSizeMaxHeight > 0) {
      ratio = (this.options.autoSizeMaxHeight / i_size.height < 1) ? this.options.autoSizeMaxHeight / i_size.height : 1;
      i_size = Object.map(i_size, function(value) {
        return Math.floor(value * ratio);
      });
    }
    image.set({ 'width': i_size.w, 'height': i_size.h });
    return image;
  }, // get_resized_image

  resize_to: function(target_size) {
    this.mainbox_resize_fx.start({
      'width': target_size.w,
      'height': target_size.h,
      'marginLeft': -(target_size.total_w / 2).round(),
      'marginTop': (this.options.centered) ? -(target_size.total_h / 2).round() : ''
    });
  },

  show_loader: function() {
    this.mainbox.addClass('mbox-loading');
  },

  hide_loader: function() {
    this.mainbox.removeClass('mbox-loading');
  },

  clear_content: function() {
    this.filebox.empty();
    this.caption.empty();
    this.count.empty();
    $$(this.bottom, this.controls).setStyle('height', '');
  },

  hide_bottom: function() {
    this.caption.setStyle('display', 'none');
    this.bottom.setStyle('visibility', 'hidden');
  },

  show_bottom: function() {
    this.caption.setStyle('display', 'block');
    this.bottom.setStyle('visibility', 'visible');
  },

  appear: function() {
    if (!this.options.centered) {
      this.mainbox.setStyle('top', window.getScroll().y + this.options.marginTop);
    }
    this.overlay_show_fx.start(this.options.overlayOpacity);
  },

  disappear: function() {
    this.cancel_effects();
    this.current_file = null;
    this.ready = false;
    this.mode = 'standard';
    $$(this.prev, this.next, this.playpause, this.count).setStyle('display', 'none');
    this.playpause.setStyle('backgroundPosition', '0 0');
    this.count.empty();
    this.caption.setStyle('display', 'none').empty();
    this.bottom.setStyle('visibility', 'hidden');
    // TODO anche opacity a 0 se si usa un tween per il file
    this.filebox.setStyle('height', '').empty();
    this.mainbox.setStyles({
      'opacity': 0,
      'display': 'none',
      'width': this.options.initialWidth,
      'height': this.options.initialHeight,
      'marginLeft': -(this.options.initialWidth / 2),
      'marginTop': (this.options.centered) ? -(this.options.initialHeight / 2) : '',
      'top': (this.options.centered) ? '50%' : ''
    });
    this.filebox.setStyle('opacity', 0);
    this.overlay_hide_fx.start(0);
    // this.fireEvent('disappear');
  },// end disappear

  cancel_effects: function() {
    [this.mainbox_resize_fx, this.mainbox_hide_fx, this.mainbox_show_fx, this.overlay_hide_fx, this.overlay_show_fx
    ].each(function(fx) {
        fx.cancel();
      });
  },

  set_mode: function(gallery_type) {
    this.mode = gallery_type;
    var close_w = this.close.getComputedSize().width;
    var prev_w = this.prev.getComputedSize().width;
    var next_w = this.next.getComputedSize().width;
    var playpause_w = this.playpause.getComputedSize().width;
    var offset = this.mainbox.getStyle('border-right-width').toInt();//for design purposes
    switch (gallery_type) {
      case 'autoplay':
        $$(this.playpause, this.close, this.next, this.prev, this.count).setStyle('display', 'block');
        this.controls.setStyle('width', close_w + prev_w + next_w + playpause_w + offset);
        break;
      case 'single':
        $$(this.playpause, this.next, this.prev, this.count).setStyle('display', 'none');
        this.controls.setStyle('width', close_w + offset);
        break;
      case 'standard':
        $$(this.close, this.next, this.prev, this.count).setStyle('display', 'block');
        this.playpause.setStyle('display', 'none');
        this.controls.setStyle('width', close_w + prev_w + next_w + offset);
        break;
      default:
        return;
    }
    this.caption.setStyle('margin-right', this.controls.getComputedSize().totalWidth);
  }, // end set_mode

  set_paused: function(paused) {
    this.paused = paused;
    var pos = (this.paused) ? '0 -66px' : '';
    this.playpause.setStyle('background-position', pos);
  },

  update_count: function(index, length) {
    this.count.set('text', index + ' ' + this.options.imageOfText + ' ' + length);
  },

  resetOverlaySize: function() {
    if (this.overlay.getStyle('opacity') == 0) {
      return;
    }
    // resize only if visible
    var h = window.getSize().y;
    this.overlay.setStyles({ 'height': h });
  },

  clear: function() {
    this.overlay.destroy();
    this.mainbox.destroy();
  }

});
Ngn.MilkboxGallery = new Class({

  Implements: [Options, Events],

  options: { // set all the options here
    name: null,
    autoplay: null,
    autoplay_delay: null,
    remove_title: true
  },

  initialize: function(source, options) {

    this.setOptions(options);

    this.source = source;
    this.external = false;
    this.items = null;
    this.name = this.options.name;
    this.type = null; // 'autoplay','standard','single'
    this.prepare_gallery();
    this.prepare_elements();
  },

  prepare_gallery: function() {
    switch (typeOf(this.source)) {
      case 'element'://single
        if (this.check_extension(this.source.href)) {
          this.items = [this.source];
        } else {
          alert('Wrong file extension: ' + this.source.href);
        }
        break;
      case 'elements': // html
        this.items = this.source.filter(function(link) {
          return this.check_extension(link.href);
        }, this);
        break;
      case 'array': // xml, array
        this.items = this.source.filter(function(link) {
          return this.check_extension(link.href);
        }, this);
        this.external = true;
        break;
      default:
        return;
    }
    //if (this.items.length == 0) {
    //  throw new Error('Warning: gallery ' + this.name + ' is empty');
    //}
  },

  // turns everything into an object
  prepare_elements: function() {
    this.items = this.items.map(function(item) {
      var splitted_url = item.href.split('?');
      var output = {};
      output.element = (typeOf(item) == 'element') ? item : null;
      output.href = splitted_url[0];
      output.vars = (splitted_url[1]) ? splitted_url[1].parseQueryString() : null;
      output.size = null;
      output.caption = (output.element) ? output.element.get('title') : item.title;
      if (this.options.remove_title && output.element) {
        output.element.removeProperty('title')
      }
      var size_string = (output.element) ? output.element.get('data-milkbox-size') : item.size;
      if (size_string) {
        output.size = Object.map(this.get_item_props(size_string), function(value, key) {
          return value.toInt();
        });
      }
      return output;
    }, this);
    if (this.items.length == 0) return;
    this.type = (this.items.length == 1) ? 'single' : (this.options.autoplay) ? 'autoplay' : 'standard';
  },

  check_extension: function(string) {
    return string.split('?')[0].test(/\.(gif|jpg|jpeg|png|swf|html)$/i);
  },

  get_index_of: function(item) {
    var index = (typeOf(item) == 'string') ? this.items.indexOf(this.items.filter(function(i) {
      return i.href === item;
    })[0]) : this.items.indexOf(item);
    return index;
  },

  get_item: function(index) {
    return this.items[index];
  },

  get_item_props: function(prop_string) {
    var props = {};
    var s = prop_string.split(',').each(function(p, i) {
      var clean = p.trim().split(':');
      props[clean[0].trim()] = clean[1].trim();
    }, this);
    return props;
  },

  refresh: function() {
    this.type = (this.items.length == 1) ? 'single' : (this.options.autoplay) ? 'autoplay' : 'standard';
  },

  clear: function() {
    this.source = null;
    this.items = null;
  }

});

Ngn.Milkbox.milkbox = new Ngn.Milkbox({ centered: true });

Ngn.Milkbox.add = function(els, name) {
  if (!els.length) return;
  if (!name) name = 'g' + Ngn.getRandomInt(0, 10000);
  var files = [];
  els.each(function(el, i) {
    el.addEvent('click', function(e) {
      e.preventDefault();
      Ngn.Milkbox.milkbox.open(name, i);
    });
    var eImg = el.getElement('img');
    files.push({
      href: el.get('href'),
      title: eImg ? eImg.get('title') : ''
    });
  });
  if (!files.length) return;
  Ngn.Milkbox.milkbox.addGalleries([{
    name: name,
    files: files
  }]);
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.Upload.js|--*/
Ngn.Form.Upload = new Class({
  Implements: [Options, Events],

  options: {
    dropMsg: 'Пожалуйста перетащите файлы сюда',
    onComplete: function() {
      //window.location.reload(true);
    },
    fileOptions: {}
  },

  initialize: function(form, eInput, options) {
    this.form = form;
    this.eInput = document.id(eInput);
    this.eCaption = this.eInput.getParent('.element').getElement('.help');
    this.name = this.eInput.get('name');
    this.setOptions(options);
    if ('FormData' in window) {
      this.beforeInit();
      this.init();
      this.afterInit();
    } else throw new Error('FormData.window not exists');
  },

  beforeInit: function() {
  },

  inProgress: false,

  init: function() {
    this.eProgress = new Element('div.fileProgress').inject(this.eCaption, 'after');
    this.requestFile = new Ngn.Request.File({
      url: this.options.url,
      onRequest: function() {
        this.inProgress = true;
        this.eProgress.setStyles({display: 'block', width: 0});
        this.eCaption.set('html', Locale.get('Core.uploading'));
      }.bind(this),
      onProgress: function(event) {
        var loaded = event.loaded, total = event.total;
        var proc = parseInt(loaded / total * 100, 10).limit(0, 100);
        if (!proc) return;
        this.eProgress.setStyle('width', proc + '%');
        if (proc == 100) this.eCaption.set('html', Locale.get('Core.uploadComplete'));
        else if (proc) this.eCaption.set('html', proc + '%');
      }.bind(this),
      onComplete: function(r) {
        this.inProgress = false;
        this.eProgress.setStyle('width', '100%');
        this.fireEvent('complete', {result: r});
      }.bind(this)
    });
  },

  afterInit: function() {
  }

});

Ngn.Form.Upload.Single = new Class({
  Extends: Ngn.Form.Upload,

  beforeInit: function() {
    this.eInput.addEvents(this.options.fileEvents);
    this.eInput.addEvents({
      change: function() {
        // the main place in file classes
        this.file = this.eInput.files[0];
        if (this.file.size > Ngn.fileSizeMax) {
          this.eInput.addClass('maxFileSizeExceeded');
        } else {
          this.eInput.removeClass('maxFileSizeExceeded');
        }
      }.bind(this)
    });
  },

  //afterInit: function() {
  //  if (this.options.loadedFiles[this.eInput.get('name')]) {
  //    this.eCaption.set('html', 'Загружен: ' + this.options.loadedFiles[this.eInput.get('name')].name);
  //  }
  //},

  send: function() {
    if (!this.file) {
      this.fireEvent('complete');
      return;
    }
    this.requestFile.append(this.eInput.get('name'), this.file);
    this.requestFile.send();
  }

});

Ngn.Form.Upload.Multi = new Class({
  Extends: Ngn.Form.Upload,

  afterInit: function() {
    this.inputFiles = new Ngn.Form.MultipleFileInput(this.eInput, this.eCaption);
    this.inputFiles.addEvents(this.options.fileEvents);
  },

  send: function() {
    var n = 0;
    this.inputFiles.getFiles().each(function(file) {
      this.requestFile.append(this.name, file);
      n++;
    }.bind(this));
    this.requestFile.send();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/Ngn.Request.js|--*/
Ngn.Request = new Class({
  Extends: Request,

  id: null,

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.parent(options);
  },

  success: function(text, xml) {
    Ngn.Arr.drop(Ngn.Request.inProgress, this.id);
    if (text.contains('Error: ')) {
      return;
    }
    this.parent(text, xml);
  },

  send: function(options) {
    Ngn.Request.inProgress.push(this.id);
    this.parent(options);
  }

});

Ngn.Request.inProgress = [];

Ngn.Request.Loading = new Class({
  Extends: Ngn.Request,

  success: function(text, xml) {
    Ngn.loading(false);
    this.parent(text, xml);
  },

  send: function(options) {
    Ngn.loading(true);
    this.parent(options);
  }

});

Ngn.json = {};
Ngn.json.decode = function(text, secure) {
  return Ngn.json.process(JSON.decode(text, secure));
};

Ngn.json.process = function(json) {
  if (!json) return json;
  for (var i in json) {
    if (typeof(json[i]) == 'object' || typeof(json[i]) == 'array') {
      json[i] = Ngn.json.process(json[i]);
    } else if (typeOf(json[i]) == 'string') {
      if (json[i].test(/^func: .*/)) {
        json[i] = json[i].replace(/^func: (.*)/, '$1');
        json[i] = eval('(function() {' + json[i] + '})');
      }
    }
  }
  return json;
};

Ngn.Request.JSON = new Class({
  Extends: Request.JSON,

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.parent(options);
  },

  success: function(text) {
    Ngn.Arr.drop(Ngn.Request.inProgress, this.id);
    try {
      this.response.json = Ngn.json.decode(text, this.options.secure);
    } catch (e) {
      throw new Error('non-json result by url ' + this.options.url + '. result:\n' + text);
    }
    if (this.response.json === null) {
      this.onSuccess({});
      return;
    }
    if (this.response.json.actionDisabled) {
      window.location.reload(true);
      return;
    }
    if (this.response.json.error) {
      Ngn.Request.JSON.throwServerError(this.response.json);
      return;
    }
    // sflm
    if (this.response.json.sflJsDeltaUrl) {
      Asset.javascript(this.response.json.sflJsDeltaUrl, {
        onLoad: function() {
          this.onSuccess(this.response.json, text);
        }.bind(this)
      });
    } else {
      this.onSuccess(this.response.json, text);
    }
    if (this.response.json.sflCssDeltaUrl) Asset.css(this.response.json.sflCssDeltaUrl);
  },

  send: function(options) {
    Ngn.Request.inProgress.push(this.id);
    this.parent(options);
  }

});

Ngn.Request.JSON.throwServerError = function(r) {
  throw new Error(r.error.message + "\n----------\n" + r.error.trace)
};

Ngn.Request.sflJsDeltaUrlOnLoad = false;

Ngn.Request.Iface = {};

Ngn.Request.Iface.loading = function(state) {
  var el = $('globalLoader');
  if (!el) {
    var el = Elements.from('<div id="globalLoader" class="globalLoader"></div>')[0].inject(document.getElement('body'), 'top');
    el.setStyle('top', window.getScroll().y);
    window.addEvent('scroll', function() {
      el.setStyle('top', window.getScroll().y);
    });
  }
  el.setStyle('visibility', state ? 'visible' : 'hidden');
};

Ngn.Request.settings = function(name, callback) {
  Asset.javascript('/c2/jsSettings/' + name, {
    onLoad: function() {
      callback(eval('Ngn.settings.' + name.replace(/\//g, '.')));
    }
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.String.js|--*/
Ngn.String = {};
Ngn.String.rand = function(len) {
  var allchars = 'abcdefghijknmpqrstuvwxyzABCDEFGHIJKLNMPQRSTUVWXYZ'.split('');
  var string = '';
  for (var i = 0; i < len; i++) {
    string += allchars[Ngn.Number.randomInt(0, allchars.length - 1)];
  }
  return string;
};

Ngn.String.ucfirst = function(str) {
  var f = str.charAt(0).toUpperCase();
  return f + str.substr(1, str.length - 1);
};

Ngn.String.hashCode = function(str) {
  var hash = 0, i, chr, len;
  if (str.length == 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

Ngn.String.trim = function(s) {
  return s.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};


/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Number.js|--*/
Ngn.Number = {};
Ngn.Number.randomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Arr.js|--*/
Ngn.Arr = {};
Ngn.Arr.inn = function(needle, haystack, strict) {  // Checks if a value exists in an array
  var found = false, key, strict = !!strict;
  for (key in haystack) {
    if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
      found = true;
      break;
    }
  }
  return found;
};

Ngn.Arr.drop = function(array, value) {
  return array.splice(array.indexOf(value), 1);
};


/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Request.File.js|--*/
Ngn.progressSupport = ('onprogress' in new Browser.Request);

// Обёртка для Request с поддержкой FormData
Ngn.Request.File = new Class({
  Extends: Ngn.Request.JSON,

  options: {
    emulation: false, urlEncoded: false, allowDublicates: false, formData: null
  },

  initialize: function(options) {
    this.id = Ngn.String.rand(20);
    this.xhr = new Browser.Request();
    this.setOptions(options);
    this.clear();
    this.headers = this.options.headers;
    if (this.options.formData) for (var i in this.options.formData) this.append(i, this.options.formData[i]);
  },

  clear: function() {
    this.formData = new FormData();
    this._formData = {};
    return this;
  },

  bracketCount: {},

  append: function(key, value) {
    var hasStr = function(haystack, needle) {
      var pos = haystack.indexOf(needle);
      if (pos == -1) {
        return false;
      } else {
        return true;
      }
    };
    var baseKey;
    var multi = hasStr(key, '[]');
    if (!multi && !this.options.allowDublicates && this._formData[key]) return;
    if (multi) {
      baseKey = key.replace('[]', '');
      if (!this.bracketCount[baseKey]) this.bracketCount[baseKey] = 0;
      key = baseKey + '[' + this.bracketCount[baseKey] + ']';
      this.bracketCount[baseKey]++;
    }
    this.formData.append(key, value);
    this._formData[key] = value;
    return this.formData;
  },

  send: function(options) {
    if (!this.check(options)) return this;
    Ngn.Request.inProgress.push(this.id);
    this.options.isSuccess = this.options.isSuccess || this.isSuccess;
    this.running = true;
    var xhr = this.xhr;
    if (Ngn.progressSupport) {
      xhr.onloadstart = this.loadstart.bind(this);
      xhr.onprogress = this.progress.bind(this);
      xhr.upload.onprogress = this.progress.bind(this);
    }
    xhr.open('POST', this.options.url, true);
    xhr.onreadystatechange = this.onStateChange.bind(this);
    Object.each(this.headers, function(value, key) {
      try {
        xhr.setRequestHeader(key, value);
      } catch (e) {
        this.fireEvent('exception', [key, value]);
      }
    }, this);
    this.fireEvent('request');
    xhr.send(this.formData);
    if (!this.options.async) this.onStateChange();
    if (this.options.timeout) this.timer = this.timeout.delay(this.options.timeout, this);
    return this;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Form.MultipleFileInput.js|--*/
Object.append(Element.NativeEvents, {
  dragenter: 2, dragleave: 2, dragover: 2, dragend: 2, drop: 2
});

Ngn.Form.MultipleFileInput = new Class({
  Implements: [Options, Events],
  
  initialize: function(eInput, eContainer, options) {
    this.eInput = document.id(eInput);
    this.eContainer = document.id(eContainer);
    this.setOptions(options);
    var drop = this.drop = document.id(this.options.drop);
    var name = this.eInput.get('name');
    this.eInput.set('multiple', true);
    this.inputEvents = {
      change: function() {
        Array.each(this.eInput.files, this.add, this);
      }.bind(this)
    };
    this.dragEvents = drop && (typeof document.body.draggable != 'undefined') ? {
      dragenter: this.fireEvent.bind(this, 'dragenter'),
      dragleave: this.fireEvent.bind(this, 'dragleave'),
      dragend: this.fireEvent.bind(this, 'dragend'),
      dragover: function(event){
        event.preventDefault();
        this.fireEvent('dragover', event);
      }.bind(this),
      drop: function(event){
        event.preventDefault();
        var dataTransfer = event.event.dataTransfer;
        if (dataTransfer) Array.each(dataTransfer.files, this.add, this);
        this.fireEvent('drop', event);
      }.bind(this)
    } : null;
    this.attach();
  },
  
  attach: function(){
    this.eInput.addEvents(this.inputEvents);
    if (this.dragEvents) this.drop.addEvents(this.dragEvents);
  },

  detach: function(){
    this.eInput.removeEvents(this.inputEvents);
    if (this.dragEvents) this.drop.removeEvents(this.dragEvents);
  },
  
  _files: [],

  add: function(file) {
    this._files.push(file);
    this.fireEvent('change', file);
    this.eContainer.set('html', 'Добавлено: '+this._files.length+' шт.');
    return this;
  },

  getFiles: function(){
    return this._files;
  }

});

// заменяет обычный input multiple-input'ом
Ngn.Form.MultipleFileInput.Adv = new Class({
  Extends: Ngn.Form.MultipleFileInput,

  options: {
    itemClass: 'uploadItem'/*,
    onAdd: function(file){},
    onRemove: function(file){},
    onEmpty: function(){},
    onDragenter: function(event){},
    onDragleave: function(event){},
    onDragover: function(event){},
    onDrop: function(event){}*/
  },
  
  _files: [],

  add: function(file) {
    this._files.push(file);
    var self = this;
    new Element('li', {
      'class': this.options.itemClass
    }).grab(new Element('span', {
      text: file.name
    })).grab(new Element('a', {
      text: 'x',
      href: '#',
      events: {
        click: function(e){
          e.preventDefault();
          self.remove(file);
        }
      }
    })).inject(this.eConrainer);
    this.fireEvent('add', file);
    return this;
  },

  remove: function(file){
    var index = this._files.indexOf(file);
    if (index == -1) return this;
    this._files.splice(index, 1);
    this.eContainer.childNodes[index].destroy();
    this.fireEvent('remove', file);
    if (!this._files.length) this.fireEvent('empty');
    return this;
  },

  getFiles: function(){
    return this._files;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/form/Ngn.Frm.HeaderToggle.js|--*/
Ngn.Frm.HeaderToggle = new Class({
  Implements: [Options, Events],

  opened: false,

  initialize: function(eBtn, options) {
    this.setOptions(options);
    this.eBtn = eBtn;
    this.eHeader = this.eBtn.getParent();
    this.eToggle = this.eBtn.getParent().getParent();
    this.eHeader.inject(this.eToggle, 'before');
    var saved = Ngn.Storage.get(eBtn.get('data-name'));
    if (saved == undefined) this.toggle(this.opened); else this.toggle(saved);
    this.eBtn.addEvent('click', function(e) {
      e.preventDefault();
      this.toggle(!this.opened);
      Ngn.Storage.set(this.eBtn.get('data-name'), this.opened);
    }.bind(this));
  },

  toggle: function(opened) {
    opened ? this.eHeader.removeClass('headerToggleClosed') : this.eHeader.addClass('headerToggleClosed');
    if (this.eBtn.get('tag') == 'input') this.eBtn.set('value', '  ' + (opened ? '↑' : '↓') + '  ');
    this.eToggle.setStyle('display', opened ? 'block' : 'none');
    this.opened = opened;
    this.fireEvent('toggle', opened);
  }

});


Ngn.Frm.headerToggleFx = function(btns) {
  btns.each(function(btn) {
    var eToggle = btn.getParent().getParent();
    btn.getParent().inject(eToggle, 'before');
    var setArrow = function(opened) {
      btn.set('value', '  ' + (opened ? '↑' : '↓') + '  ');
    };
    var fx = new Fx.Slide(eToggle, {
      duration: 300,
      transition: Fx.Transitions.Pow.easeOut,
      onComplete: function() {
        setArrow(opened);
        Ngn.Storage.set(btn.get('data-name'), opened ? 1 : 0);
      }
    });
    var opened = true;
    var saved = Ngn.Storage.get(btn.get('data-name'));
    if (!saved || saved == 0) {
      fx.hide();
      opened = false;
    }
    if (saved != undefined) setArrow(opened);
    btn.addEvent('click', function(e) {
      e.preventDefault();
      opened ? fx.slideOut() : fx.slideIn();
      opened = !opened;
    });
  });
};
/*--|/home/user/ngn-env/ngn/i/js/ngn/trash/Ngn.IframeFormRequest.js|--*/
Ngn.IframeFormRequest = new Class({

  Implements: [Options, Events],

  options: { /*
    onRequest: function() {},
    onComplete: function(data) {},
    onFailure: function() {}, */
    eventName: 'submit'
  },

  initialize: function(form, options) {
    this.setOptions(options);
    var frameId = this.frameId = String.uniqueID();
    var loading = false;

    this.form = document.id(form);

    this.formEvent = function() {
      loading = true;
      this.fireEvent('request');
    }.bind(this);

    this.iframe = new IFrame({
      name: frameId,
      styles: {
        display: 'none'
      },
      src: 'about:blank',
      events: {
        load: function() {
          if (loading) {
            var doc = this.iframe.contentWindow.document;
            if (doc && doc.location.href != 'about:blank') {
              this.complete(doc);
            } else {
              this.fireEvent('failure');
            }
            loading = false;
          }
        }.bind(this)
      }
    }).inject(document.body);
    this.attach();
  },
  
  complete: function(doc) {
    this.fireEvent('complete', doc.body.innerHTML);
  },

  attach: function() {
    this.target = this.form.get('target');
    this.form.set('action', this.form.get('action').toURI().setData({ifr: 1}, true).toString());
    this.form.set('target', this.frameId)
      .addEvent(this.options.eventName, this.formEvent);
  },

  detach: function() {
    this.form.set('target', this.target)
      .removeEvent(this.options.eventName, this.formEvent);
  }

});


Ngn.IframeFormRequest.JSON = new Class({
  Extends: Ngn.IframeFormRequest,
  
  initialize: function(form, options) {
    this.parent(form, options);
    this.iframe.responseType = 'json';
  },
  
  complete: function(doc) {
    var data = JSON.decode(doc.getElementById('json').value);
    if (data.error) {
      new Ngn.Dialog.Error({ error: data.error });
      return;
    }
    this.fireEvent('complete', data);
  }
  
});
/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.RequiredOptions.js|--*/
Ngn.RequiredOptions = new Class({
  Extends: Options,

  requiredOptions: [],

  setOptions: function(options) {
    this.parent(options);
    for (var i = 0; i++; i < this.requiredOptions.length) {
      if (!this.options[this.requiredOptions[i]])
        throw new Error('Required option ' + this.requiredOptions[i] + ' not defined');
    }
    return this;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.js|--*/
Ngn.Dialog = new Class({
  Implements: [Ngn.RequiredOptions, Events],
  options: {
    id: 'dlg', // Уникальный идентификатор диалога. Если не задан, то формируется, как "dlg + random string"
    autoShow: true, // Показывать диалог при создании класса. Иначе используется _Ngn.Dialog.show_
    buttons: null, // Набор дополнительные кнопок в подвале. Формат объекта: {name: 'Name', text: 'Button text', class_name: 'CSS class', action: function() {}, tabindex: 1}
    cancel: null,
    cancelClass: 'cancel',
    cancelText: 'Cancel',
    cancelDestroy: true,
    callback: null,
    center: true,
    dialogClass: 'dialog',
    draggable: true,
    fxOptions: {},
    footer: null,
    footerClass: 'dialog-footer iconsSet',
    force: true,
    height: 'auto',
    message: null,
    messageAreaClass: 'dialog-message',
    messageBoxClass: 'mid-float-box',
    noTitleClass: 'mav-no-title',
    noFooterClass: 'mav-no-footer',
    ok: null,
    okClass: 'ok',
    okText: 'OK',
    okDestroy: true,
    parent: null,
    shadeClass: 'dialog-shade',
    styles: {},
    title: '',
    titleBarClass: 'dialog-title',
    titleClose: true,
    titleCloseClass: 'icon-button md-closer',
    titleCloseTitle: 'Close',
    titleTextClass: 'md-title-text move',
    url: null,
    useFx: !Browser.ie,
    //'useFx: false,
    width: 550,
    top: 30,
    bindBuildMessageFunction: false,
    noPadding: true,
    setMessageDelay: null,
    forceShadeClose: false,
    jsonRequest: false,
    reduceHeight: false,
    baseZIndex: 300,
    savePosition: false,
    vResize: false,
    fixed: false,
    //maxHeight: null,
    onComplete: Function.from(),
    onClose: Function.from(),
    onOkClose: Function.from(),
    onCancelClose: Function.from(),
    onHide: Function.from(),
    onRequest: Function.from(),
    onShow: Function.from()
  },

  delayedShow: false,
  closed: false,
  dialog: null,
  drag: null,
  footer: null,
  fx: null,
  grabbed: null,
  message: null,
  parent: null,
  request: null,
  titlebar: null,
  isOkClose: false,
  btns: {},
  status: null,

  initialize: function(options) {
    this.setOptions(options);
    // new Image().src = '/i/img/dialog/cross-pushed.png'; // preloading of hover cross
    if (this.options.id == 'dlg') {
      this.options.id = 'dlg' + Ngn.String.rand(5);
      if (this.options.savePosition) throw new Error('Can not save position on random ID');
      if (this.options.vResize) throw new Error('Can not save size on random ID');
    }
    if (this.options.vResize && typeof(this.options.vResize) != 'function') {
      this.options.vResize = Ngn.Dialog.VResize;
    }
    if (this.options.noPadding) this.options.messageAreaClass += ' dialog-nopadding';
    if (this.options.reduceHeight) this.options.messageAreaClass += ' dialog-scroll';
    if ($(this.options.id + '_dialog')) {
      console.debug('Dialog with id=' + this.options.id + ' already opened. Aborted');
      return null;
    }
    if (this.options.bindBuildMessageFunction) this.options.message = this.buildMessage.bind(this, this.options.message);
    this.request = new (this.options.jsonRequest ? Ngn.Request.JSON : Ngn.Request)({
      evalScripts: true,
      onSuccess: this.urlResponse.bind(this),
      onFailure: this.errorMessage.bind(this)
    });
    this.dialogId = this.options.id + '_dialog';
    this.dialogN = Ngn.Dialog.dialogs.getLength() + 1;
    Ngn.Dialog.dialogs[this.dialogId] = this;
    this.parentElement = $((this.options.parent || document.body));
    var dialog_styles = Object.merge({
      'display': 'none',
      'width': this.options.width.toInt() + 'px',
      'z-index': this.options.baseZIndex + (this.dialogN * 2)
    }, this.options.styles);
    this.dialog = new Element('div', {
      'id': this.dialogId,
      'class': this.options.dialogClass,
      //'opacity': (this.options.useFx ? 0 : 1),
      'styles': dialog_styles
    }).inject(this.parentElement);
    if (this.options.fixed) this.dialog.setStyle('position', 'fixed');
    this.fx = this.options.useFx ? new Fx.Tween(this.dialog, Object.merge({
      duration: 300
    }, this.options.fxOptions)) : null;
    if (this.fx) this.fx.set('opacity', 0);

    //dialog-message
    //if (this.options.maxHeight)
    //this.message.setStyle('max-height', this.options.maxHeight+'px');
    //this.options.maxHeight;

    // dialog box sections and borders
    this.eMessage = new Element('div', {
      'class': this.options.messageBoxClass
    }).inject(this.dialog);

    // dialog box title
    if (this.options.title !== false) {
      this.titlebar = new Element('div', {
        'id': this.options.id + '_title',
        'class': this.options.titleBarClass
      }).inject(this.eMessage);

      this.titleText = new Element('span', {'class': this.options.titleTextClass, 'html': this.options.title}).inject(this.titlebar);

      if (this.options.titleClose != false) {
        this.btnClose = Ngn.Btn.opacity(new Element('span', {
          'id': this.options.id + '_closer',
          'class': this.options.titleCloseClass
          //'title': this.options.titleCloseTitle
        }).inject(this.titlebar).addEvent('click', this.close.bind(this)));
      }
    }

    // dialog box message
    this.message = new Element('div', {
      'id': this.options.id + '_message',
      'class': this.options.messageAreaClass + (this.options.title === false ? ' ' + this.options.noTitleClass : '') + (this.options.footer === false ? ' ' + this.options.noFooterClass : '')
    }).inject(this.eMessage);
    if (this.options.height != 'auto') this.message.setStyle('max-height', this.options.height.toInt() + 'px');
    if (this.options.height != 'auto') this.message.setStyle('overflow-y', 'auto');
    this.beforeInitRequest();
    if (this.options.url != undefined) {
      this.dotter = new Ngn.Dotter(this.message);
      this.dotter.start();
      this.request.options.url = this.options.url;
      this.startupLoading(true);
      (function() {
        this.request.send()
      }).delay(100, this);
      if (this.options.autoShow) this.delayedShow = true;
    } else if (this.options.message != undefined) {
      if (this.options.setMessageDelay) {
        (function() {
          this.setMessage(this.options.message);
        }).delay(this.options.setMessageDelay, this);
      } else {
        this.setMessage(this.options.message);
      }
    }

    // dialog footer
    if (this.options.footer !== false) {
      this.footer = new Element('div', {
        'id': this.options.id + '_footer',
        'class': this.options.footerClass
      }).inject(this.eMessage);
      new Element('div', {'class': 'foot-wrap'}).inject(this.footer);
      if (this.options.ok !== false) {
        this.createButton('ok', this.options.id, this.options.okText, this.options.okClass, this.options.ok, !this.options.okDestroy, undefined, true).inject(this.footer.firstChild, 'top');
      }
      if (this.options.cancel !== false) {
        this.createButton('cancel', this.options.id, this.options.cancelText, this.options.cancelClass, this.options.cancel, !this.options.cancelDestroy).inject(this.footer.firstChild, 'top');
      }
      this.status = new Element('div', {'class': 'foot-status'}).inject(this.footer.firstChild, 'top');
      if (typeOf(this.options.buttons) == 'object') {
        for (var btn in this.options.buttons) {
          btn = this.options.buttons[btn];
          this.createButton(btn.name, this.options.id, btn.text, btn.class_name, btn.action, !(btn.auto_close), ((btn.tabindex != undefined) ? btn.tabindex : null)).inject(this.footer.firstChild, 'top');
        }
      }
    }

    // set dialog to draggable
    if (this.options.draggable && this.titlebar) {
      this.drag = new Drag.Move(this.dialog, {
        handle: this.titlebar,
        onComplete: function() {
          if (this.options.savePosition) Ngn.Storage.json.set('dialogPos' + this.options.id, this.dialog.getPosition());
          window.fireEvent('dialogMove', this);
        }.bind(this)
      });
    }

    this.fireEvent('complete');
    this.init();

    if (this.options.vResize) {
      if (this.options.url) {
        this.addEvent('request', function() {
          new this.options.vResize(this);
        }.bind(this));
      } else {
        new this.options.vResize(this);
      }
    }

    // close on escape
    this.dialog.addEvent('keydown', function(e) {
      if (e.key == 'esc') this.close();
    }.bind(this));
    // execute onComplete function, if present.
    if (this.options.autoShow && !this.request.running) {
      this.show();
    }
    window.document.currentDialog = this;
  },

  initSavedPosition: function() {
    if (this.options.id == 'dlg') throw new Error('Can not use default id for such dialog');
    var pos = Ngn.Storage.json.get('dialogPos' + this.options.id);
    if (pos) this.dialog.setPosition(pos); else this.initCenterPosition();
  },

  beforeInitRequest: function() {
  },

  init: function() {
  },

  initReduceHeight: function(force) {
    if (force || !this.options.reduceHeight) return;
    //if (this.initHeight) return;
    //this.initHeight = this.message.getSize().y;
    //if (!this.initHeight) throw new Error('Cannot be null');
    window.addEvent('resize', this.reduceHeight.bind(this));
    this.reduceHeight();
  },

  reduceHeight: function() {
    var maxH = window.getSize().y - 150;
    this.message.setStyle('max-height', maxH + 'px');
    return;
    if (this.initHeight < maxH)
      this.message.setStyle('height', this.initHeight + 'px'); else
      this.message.setStyle('height', maxH + 'px');
  },

  setTitle: function(title) {
    if (this.options.title === false) return;
    this.prevTitle = this.options.title;
    this.title = title;
    this.titleText.set('html', title);
  },

  restorePrevTitle: function() {
    if (this.options.title === false) return;
    this.titleText.set('html', this.prevTitle);
  },

  setMessage: function(_message, delayedShow) {
    var message = (typeOf(_message) == 'function' ? _message() : _message);
    if (this.dotter) this.dotter.stop();
    if (typeOf(message) == 'element') {
      this.grabbed = message.getParent();
      if (this.grabbed != null) {
        message.removeClass('none');
        this.message.grab(message);
      } else {
        message.inject(this.message);
      }
    } else {
      this.message.set('html', message);
    }
    if (delayedShow == undefined) delayedShow = this.delayedShow;
    if (this.delayedShow && delayedShow) {
      this.delayedShow = false;
      this.show();
    }

    /*
     if (this.titlebar && this.btnClose) {
     this.titleText.setStyle('width',
     (this.titlebar.getSizeWithoutPadding().x
     - this.btnClose.getSizeWithMargin().x
     - 10) + 'px');
     }
     */

    this.initReduceHeight();
    this.initPosition();
  },

  initPosition: function() {
    this.options.savePosition ? this.initSavedPosition() : this.initCenterPosition();
  },

  setOkText: function(text) {
    if (!this.btns.ok) return;
    this.btns.ok.getElement('a').set('html', this.getButtonInnerHtml(text));
  },

  setWidth: function(width) {
    this.options.width = width;
    this.dialog.setStyle('width', width.toInt() + 'px');
    this.initPosition();
  },

  enlargeWidth: function(width) {
    if (width > this.options.width) this.setWidth(width);
  },

  toggle: function(name, flag) {
    if (!this.btns[name]) return;
    this.btns[name].setStyle('display', flag ? 'block' : 'none');
  },

  errorMessage: function(xhr) {
  },

  urlResponse: function(_response) {
    if (this.closed) return;
    this.startupLoading(false);
    this.dotter.stop();
    if (!this.options.jsonRequest) {
      this.setMessage(_response, false);
    } else {
      if (_response.title) this.setTitle(_response.title);
      this.setMessage('', false);
    }
    this.fireEvent('request', _response);
  },

  getButtonInnerHtml: function(text) {
    return '<span><i></i>' + text + '</span>';
  },

  createButton: function(name, id, text, cls, action, unforceClose, tabindex, okClose) {
    var self = this;
    var eButton = new Element('div', { 'class': 'goright image-button ' + cls });
    var eLink = new Element('a', {
      id: id + '_' + name,
      href: 'javascript:void(0)',
      'class': 'btn',
      tabindex: (tabindex != undefined ? tabindex : (++this.tab_index)),
      html: this.getButtonInnerHtml(text)
    }).inject(eButton);
    if (action && action instanceof Function) {
      eLink.addEvent('click', action);
    }
    if (!unforceClose) eLink.addEvent('click', okClose ? this.okClose.bind(this) : this.close.bind(this));
    /*
     if (!unforceClose) eLink.addEvent('click', function(e) {
     e.preventDefault();
     okClose ? this.okClose.bind(this) : this.close.bind(this);
     }.bind(this));
     */
    this.btns[name] = eButton;
    return eButton;
  },

  openShade: function() {
    if (this.eShade != undefined) return;
    this.eShade = new Element('div', {
      'class': this.options.shadeClass,
      'styles': {
        'z-index': this.options.baseZIndex + (this.dialogN * 2) - 1
      }
    }).inject(document.body);
    return this;
  },

  closeShade: function() {
    this.eShade.dispose();
  },

  show: function() {
    if (this.options.force) this.openShade();
    this.dialog.setStyle('display', '');
    this.initPosition();
    this.fireEvent('show');
    if (this.options.useFx) {
      this.fx.start('opacity', 0, 1);
    }
  },

  hide: function() {
    this.dialog.setStyle('display', 'none');
    this.fireEvent('hide');
  },

  okClose: function() {
    this.isOkClose = true;
    this.close();
  },

  close: function() {
    if (this.options.useFx) {
      this.fx.start('opacity', 1, 0).chain(this.finishClose.bind(this));
    } else {
      this.finishClose();
    }
  },

  finishClose: function() {
    document.getElement('body').removeClass('noscroll');
    if ($(this.dialog)) {
      this.closed = true;
      if (this.grabbed != undefined) {
        this.grabbed.grab(this.message.firstChild);
      }
      this.fireEvent('beforeClose');
      this.dialog.empty().dispose();
      Ngn.Dialog.dialogs.erase(this.dialogId);
      if (this.options.force) this.closeShade();
      this.fireEvent('close');
      this.isOkClose ? this.fireEvent('okClose') : this.fireEvent('cancelClose');
    }
  },

  initCenterPosition: function(fx) {
    if (!this.options.center) return;
    var parXY = this.parentElement.getCoordinates();
    var parScroll = this.parentElement.getScroll();
    var elmXY = this.dialog.getCoordinates();
    var elmWH = this.dialog.getSize();
    var dialogH = Math.round((parXY.height - elmWH.y) / 5);
    if (dialogH < 20) dialogH = 20;
    if (this.options.center !== 'y') {
      if (fx) new Fx.Tween(this.dialog, { duration: 'short' }).start('left', ((parXY.width - elmWH.x) / 2) + 'px'); else this.dialog.setStyle('left', ((parXY.width - elmWH.x) / 2) + 'px');
    }
    if (this.options.center !== 'x') {
      if (fx) new Fx.Tween(this.dialog, { duration: 'short' }).start('top', (dialogH + parScroll.y) + 'px');
      //else this.dialog.setStyle('top', (dialogH + parScroll.y) + 'px');
      else this.dialog.setStyle('top', this.options.top + 'px');
    }
  },

  startupLoading: function(flag) {
    flag ? this.message.addClass('dialog-loading') : this.message.removeClass('dialog-loading');
    this.loading(flag);
  },

  loading: function(flag) {
    this.toggle('ok', !flag);
    this.toggle('cancel', !flag);
    if (this.footer) {
      this.message.removeClass('loading');
      flag ? this.footer.addClass('loading') : this.footer.removeClass('loading');
    } else {
      flag ? this.message.addClass('loading') : this.message.removeClass('loading');
    }
  }

});

Ngn.Dialog.openWhenClosed = function(closingDialogObject, openDialogClass, options) {
  var id = function() {
    if (!closingDialogObject.closed) return;
    clearInterval(id);
    new openDialogClass(options);
  }.periodical(500);
};

Ngn.Dialog.dialogs = new Hash({});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.VResize.js|--*/
Ngn.Dialog.VResize = new Class({

  initialize: function(dialog) {
    this.dialog = dialog;
    Ngn.Element._whenElPresents(this.getResizebleEl.bind(this), this.init.bind(this));
  },

  init: function() {
    var eResizeble = this.getResizebleEl();
    this.eHandler = new Element('div', {'class': 'vResizeHandler'}).inject(this.dialog.eMessage);
    this.dialog.dialog.addClass('vResize');
    var storeK = this.dialog.options.id + '_height';
    var h = Ngn.Storage.get(storeK);
    if (h) eResizeble.setStyle('height', h + 'px');
    new Drag(eResizeble, {
      preventDefault: true,
      stopPropagation: true,
      snap: 0,
      handle: this.eHandler,
      modifiers: {y: 'height', x: null},
      onComplete: function() {
        Ngn.Storage.set(storeK, eResizeble.getSize().y);
      }
    });
    this.eHandler.inject(this.dialog.eMessage);
  },

  getResizebleEl: function() {
    return this.dialog.eMessage;
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/Ngn.Element.js|--*/
Ngn.Element = {};

Ngn.Element._whenElPresents = function(elGetter, action, maxAttempts) {
  var el;
  el = elGetter();
  find = function() {
    return el = elGetter();
  };
  if (find()) {
    action(el);
    return;
  }
  maxAttempts = maxAttempts || 10;
  var n = 1;
  var id = function() {
    n++;
    if (find()) {
      clearTimeout(id);
      action(el);
      return;
    }
    if (n == maxAttempts) {
      clearTimeout(id);
      throw new Error('Element not presents after ' + maxAttempts + ' attempts');
    }
  }.periodical(200);
};

Ngn.Element.whenElPresents = function(eParent, selector, action) {
  return Ngn.Element._whenElPresents(function() {
    return eParent.getElement(selector);
  }, action);
};

Ngn.Element.bindSizes = function(eFrom, eTo) {
  eFrom.addEvent('resize', function() {
    eTo.setSize(eFrom.getSize());
  });
};

Ngn.Element.initTips = function(els) {
  if (!Ngn.tips) Ngn.Element.tips = new Tips(els);
};

Ngn.Element.setTip = function(el, title) {
  if (!Ngn.Element.tips) Ngn.Element.initTips(el);
  if (el.retrieve('tip:native')) {
    Ngn.Element.tips.hide(el);
    el.store('tip:title', title);
  } else {
    Ngn.Element.tips.attach(el);
  }
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.Btn.js|--*/
// @requires Ngn.Frm

Ngn.Btn = new Class({
  Implements: [Options],

  options: {
    usePushed: false,
    request: false,
    fileUpload: false
  },

  pushed: false,

  initialize: function(el, action, options) {
    //if (options.request) this.request = options.request;
    this.setOptions(options);
    this.setAction(action);
    this.el = el;
    this.toggleDisabled(true);
    var up = function() {
      if (!this.enable) return;
      if (!this.options.usePushed) this.el.removeClass('pushed');
    }.bind(this);
    var down = function() {
      if (!this.enable) return;
      if (!this.options.usePushed) this.el.addClass('pushed');
    }.bind(this);
    this.el.addEvent('mousedown', down);
    this.el.addEvent('tap', down);
    this.el.addEvent('mouseup', up);
    this.el.addEvent('mouseout', up);
    this.el.addEvent('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (!this.enable) return;
      //if (this.request) this.toggleDisabled(false);
      this.runAction();
    }.bind(this));
    //if (this.request) {
    //  this.request.addEvent('complete', function() {
    //    this.toggleDisabled(true);
    //  }.bind(this));
    //}
    if (this.options.fileUpload) {
      new Ngn.Btn.FileUpload(this, this.options.fileUpload);
    }
    this.init();
  },

  setAction: function(action) {
    if (!action) action = function() {
    };
    if (typeof(action) == 'function') this.action = { action: action.bind(this) };
    else {
      if (action.classAction) {
        // do nothing. action is class
      } else {
        if (action.args) {
          action.action = action.action.pass(action.args, this);
        } else {
          action.action = action.action.bind(this);
        }
      }
      this.action = action;
    }
  },

  runAction: function() {
    if (!this.pushed && this.action.confirm) {
      var opt = {
        id: this.action.id,
        onOkClose: function() {
          this._action();
        }.bind(this)
      };
      if (typeof(this.action.confirm) == 'string') opt.message = this.action.confirm;
      new Ngn.Dialog.Confirm.Mem(opt);
    } else {
      this._action();
    }
  },

  _action: function() {
    this.action.action();
    if (this.options.usePushed) this.togglePushed(!this.pushed);
    if (this.request) this.request.send();
  },

  init: function() {
  },

  togglePushed: function(pushed) {
    this.pushed = pushed;
    this.pushed ? this.el.addClass('pushed') : this.el.removeClass('pushed');
  },

  toggleDisabled: function(enable) {
    this.enable = enable;
    enable ? this.el.removeClass('nonActive') : this.el.addClass('nonActive');
  }

});

/**
 * Создаёт и возвращает html-элемент кнопки
 *
 * @param opt
 * @param opt.cls CSS-класс
 * @param opt.title Заголовок кнопки
 * @param opt.caption Значение тега "title"
 * @returns {HTMLElement}
 */
Ngn.Btn.btn = function(opt) {
  if (!opt) opt = {};
  if (!opt.cls) opt.cls = '';
  if (!opt.title && !opt.cls.contains('btn')) opt.cls = 'bordered ' + opt.cls;
  var a = new Element('a', Object.merge({
    'class': (opt.cls.contains('icon') ? '' : 'smIcons ') + opt.cls,
    html: opt.title || ''
  }, opt.prop || {}));
  if (opt.caption) {
    a.set('title', opt.caption);
    //Ngn.Element.setTip(a, opt.caption);
  }
  new Element('i').inject(a, 'top');
  return a;
};

/**
 * Кнопка с заголовком
 */
Ngn.Btn.btn1 = function(title, cls, prop) {
  return Ngn.Btn.btn({
    title: title,
    cls: cls,
    prop: prop
  });
};

/**
 * Кнопка с всплывающей подсказкой
 */
Ngn.Btn.btn2 = function(caption, cls, prop) {
  return Ngn.Btn.btn({
    caption: caption,
    cls: cls,
    prop: prop
  });
};

Ngn.Btn.flag1 = function(defaultFirstState, state1, state2) {
  return Ngn.Btn.__flag(Ngn.Btn.tn1, defaultFirstState, state1, state2);
};

Ngn.Btn.flag2 = function(defaultFirstState, state1, state2) {
  return Ngn.Btn.__flag(Ngn.Btn.btn2, defaultFirstState, state1, state2);
};

Ngn.Btn.__flag = function(btn, defaultFirstState, state1, state2) {
  var deflt = defaultFirstState ? state1 : state2;
  return Ngn.Btn._flag(Ngn.Btn.btn2(deflt.title, deflt.cls), state1, state2);
};

Ngn.Btn._flag = function(eA, state1, state2) {
  return eA.addEvent('click', function(e) {
    e.preventDefault();
    var flag = eA.hasClass(state1.cls);
    var newState = flag ? state2 : state1;
    var curState = flag ? state1 : state2;
    if (curState.confirm !== undefined) if (!confirm(curState.confirm)) return;
    new Ngn.Request({
      url: curState.url,
      onComplete: function() {
        eA.removeClass(curState.cls);
        eA.addClass(newState.cls);
        eA.set('title', newState.title);
        //Ngn.addTips(eA);
      }
    }).send();
  });
};

Ngn.Btn.Action = new Class({
  action: function() {}
});

Ngn.Btn.FileUpload = new Class({
  Implements: [Options],

  options: {
    // url: '',
    mime: '',
    onRequest: function() {
    },
    onComplete: function() {
    }
  },

  initialize: function(btn, options) {
    this.btn = btn;
    this.setOptions(options);
    var eUploadWrapper = new Element('div', {styles: {
      position: 'relative',
      display: 'inline-block',
      overflow: 'hidden'
    }}).wraps(this.btn.el);
    var eEile = new Element('input', {type: 'file', accept: this.options.mime, events: {
      mouseover: function() {
        this.getParent().getElement('a').addClass('over');
      },
      mouseout: function() {
        this.getParent().getElement('a').removeClass('over');
      }
    }, styles: {
      position: 'absolute',
      cursor: 'pointer',
      width: this.btn.el.getSize().x + 'px',
      height: this.btn.el.getSize().y + 'px',
      top: '0px',
      left: '0px',
      'z-index': 2,
      'opacity': 0
    }}).inject(eUploadWrapper, 'bottom');
    eEile.addEvent('change', function() {
      req.append('file', this.files[0]);
      req.send();
    });
    this.options.onRequest = this.options.onRequest.bind(this);
    this.options.onComplete = this.options.onComplete.bind(this);
    var req = new Ngn.Request.File({
      url: this.options.url,
      formData: {
        name: 'bg'
      },
      onRequest: function() {
        this.btn.toggleDisabled(false);
        this.options.onRequest();
      }.bind(this),
      onProgress: function(event) {
        var loaded = event.loaded, total = event.total;
        var proc = parseInt(loaded / total * 100, 10).limit(0, 100);
        //c ('Загружено ' + proc + '%');
        //if (proc == 100) console.debug('Загрузка завершена');
      }.bind(this),
      onComplete: function(r) {
        this.btn.toggleDisabled(true);
        this.options.onComplete(r);
        eEile.set('value', '');
        req.clear();
      }.bind(this)
    });

  }

});

Ngn.Btn.addAction = function(selector, action, parent) {
  var esBtn = (parent ? parent : document).getElements(selector);
  if (!esBtn) return;
  esBtn.each(function(eBtn) {
    action = action.pass(eBtn);
    eBtn.addEvent('click', function(e) {
      e.preventDefault();
      action(e);
    });
  });
};

Ngn.Btn.opacity = function(eBtn, outOp, overOp) {
  var fx = new Fx.Morph(eBtn, { duration: 'short', link: 'cancel' });
  if (!outOp != undefined) outOp = 0.4;
  if (!overOp != undefined) overOp = 1;
  eBtn.setStyle('opacity', outOp);
  eBtn.addEvent('mouseover', function() {
    fx.start({'opacity': [outOp, overOp]});
  });
  eBtn.addEvent('mouseout', function() {
    fx.start({'opacity': [overOp, outOp]});
  });
  return eBtn;
};

Ngn.Btn.addAjaxAction = function(eBtn, action, onComplete) {
  if (!eBtn) return;
  onComplete = onComplete ? onComplete : Function.from();
  eBtn.addEvent('click', function(e) {
    e.preventDefault();
    if (eBtn.hasClass('confirm') && !Ngn.confirm()) return;
    if (eBtn.hasClass('loading')) return;
    if (eBtn.retrieve('disabled')) return;
    eBtn.addClass('loading');
    new Ngn.Request({
      url: eBtn.get('href').replace(action, 'ajax_' + action),
      onComplete: function() {
        onComplete();
        eBtn.removeClass('loading');
      }
    }).send();
  });
};

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Msg.js|--*/
Ngn.Dialog.Msg = new Class({
  Extends: Ngn.Dialog,

  options: {
    noPadding: false,
    messageAreaClass: 'dialog-message large',
    title: false
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Confirm.js|--*/
Ngn.Dialog.Confirm = new Class({
  Extends: Ngn.Dialog.Msg,

  options: {
    width: 300,
    message: 'Вы уверены?'
  },

  initialize: function(_opts) {
    var opts = Object.merge(_opts, {
      cancel: false,
      titleClose: false,
      ok: this.closeAction.bind(this, true),
      cancel: this.closeAction.bind(this, false)
    });
    this.parent(opts);
  },

  closeAction: function(_confirmed) {
    _confirmed ? this.okClose() : this.close();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Confirm.Mem.js|--*/
Ngn.Dialog.Confirm.Mem = new Class({
  Extends: Ngn.Dialog.Confirm,

  options: {
    width: 250,
    okText: 'Удалить',
    bindBuildMessageFunction: true,
    notAskSomeTime: false
  },

  timeoutId: null,

  initialize: function(_opts) {
    this.setOptions(_opts);
    this.options.dialogClass += ' dialog-confirm';
    if (this.options.notAskSomeTime) {
      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = (function() {
        Ngn.Storage.remove(this.options.id + 'confirmMem');
      }).delay(120000, this);
    }
    if (Ngn.Storage.get(this.options.id + 'confirmMem')) {
      this.fireEvent('okClose');
      return;
    }
    this.parent(_opts);
  },

  buildMessage: function(_msg) {
    var eMessageCont = new Element('div');
    if (this.options.notAskSomeTime) {
      var checkboxCaption = 'Неспрашивать меня об этом какое-то время';
    } else {
      var checkboxCaption = 'Больше не спрашивать по этому поводу';
    }
    new Element('div', {'html': '<h3 style="margin-top:0px">' + _msg + '</h3>'}).inject(eMessageCont);
    Elements.from('<span class="checkbox"><input type="checkbox" id="confirmMem' + this.options.id + '" class="confirmMem" /><label for="confirmMem' + this.options.id + '">' + checkboxCaption + '</label></span>')[0].inject(eMessageCont);
    this.eMemCheckbox = eMessageCont.getElement('.confirmMem');
    return eMessageCont;
  },

  finishClose: function() {
    if (this.isOkClose) {
      console.debug([this.options.id + 'confirmMem', this.eMemCheckbox.get('checked')]);
      Ngn.Storage.set(this.options.id + 'confirmMem', this.eMemCheckbox.get('checked'));
    }
    this.parent();
  }

});

/*--|/home/user/ngn-env/ngn/i/js/ngn/core/controls/Ngn.Dotter.js|--*/
Ngn.Dotter = new Class({
  Implements: [Options,Events],

  options: {
    delay: 500,
    dot: '.',
    message: 'Loading',
    numDots: 10,
    property: 'text',
    reset: false/*,
    onDot: Function.from(),
    onStart: Function.from(),
    onStop: Function.from()
    */
  },

  initialize: function(container, options) {
    this.setOptions(options);
    this.container = document.id(container);
    this.dots = 0;
    this.running = false;
  },

  dot: function() {
    if(this.running) {
      var text = this.container.get(this.options.property);
      this.dots++;
      this.container.set(this.options.property,(this.dots % this.options.numDots != 0 ? text : this.options.message) + '' + this.options.dot);
    }
    return this;
  },

  load: function() {
    this.loaded = true;
    this.dots = 0;
    this.dotter = function(){ this.dot(); this.fireEvent('dot'); }.bind(this);
    this.periodical = this.dotter.periodical(this.options.delay);
    this.container.set(this.options.property,this.options.message + '' + this.options.dot);
    return this;
  },

  start: function() {
    if(!this.loaded || this.options.reset) this.load();
    this.running = true;
    this.fireEvent('start');
    return this;
  },

  stop: function() {
    this.running = this.loaded = false;
    clearTimeout(this.periodical);
    this.fireEvent('stop');
    return this;
  }

});
/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Alert.js|--*/
Ngn.Dialog.Alert = new Class({
  Extends: Ngn.Dialog,

  options: {
    noPadding: false,
    title: false
  },

  initialize: function(_opts) {
    var opts = Object.merge(_opts, {
      cancel: false,
      titleClose: false,
      bindBuildMessageFunction: true
    });
    this.parent(opts);
  },

  buildMessage: function(msg) {
    var message_box = new Element('div');
    new Element('div', {'class': 'icon-button alert-icon goleft'}).inject(message_box);
    new Element('div', {'class': 'mav-alert-msg goleft', 'html': msg}).inject(message_box);
    new Element('div', {'class': 'clear'}).inject(message_box);
    return message_box;
  }
});

/*--|/home/user/ngn-env/ngn/i/js/ngn/dialog/Ngn.Dialog.Error.js|--*/
Ngn.Dialog.Error = new Class({
  Extends: Ngn.Dialog.Alert,

  options: {
    title: 'Ошибка',
    width: 600
  },

  buildMessage: function(msg) {
    //throw new Error(this.options.error.message);
    //return this.parent('<p>' + this.options.error.message + ' <i>Code: ' + this.options.error.code + '</i></p>' + '<p>' + this.options.error.trace + '</p>');
  }

});