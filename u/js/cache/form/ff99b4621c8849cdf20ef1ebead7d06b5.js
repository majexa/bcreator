Ngn.Frm.init.ff99b4621c8849cdf20ef1ebead7d06b5 = function() {

var id = 'ff99b4621c8849cdf20ef1ebead7d06b5';
Ngn.Form.forms[id].eForm.getElements('.type_fieldList').each(function(el){
  new Ngn.Frm.FieldSet(Ngn.Form.forms[id], el, {'rowElementSelector': '.hgrp'});
});

// -- type: color --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.ff99b4621c8849cdf20ef1ebead7d06b5, 'color');

// -- type: fontFamilyCufon --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.ff99b4621c8849cdf20ef1ebead7d06b5, 'fontFamilyCufon');

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('ff99b4621c8849cdf20ef1ebead7d06b5'), 1000);

};
