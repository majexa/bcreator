Ngn.Frm.init.f318dc34717b4f4c3a1784667fa6d3cbe = function() {

var id = 'f318dc34717b4f4c3a1784667fa6d3cbe';
Ngn.Form.forms[id].eForm.getElements('.type_fieldList').each(function(el){
  new Ngn.sd.FieldSetAnimatedText(Ngn.Form.forms[id], el, {'rowElementSelector': '.hgrp'});
});

// -- type: color --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.f318dc34717b4f4c3a1784667fa6d3cbe, 'color');

// -- type: fontFamilyCufon --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.f318dc34717b4f4c3a1784667fa6d3cbe, 'fontFamilyCufon');

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('f318dc34717b4f4c3a1784667fa6d3cbe'), 1000);

};
