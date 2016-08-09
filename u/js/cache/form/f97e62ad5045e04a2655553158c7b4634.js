Ngn.Frm.init.f97e62ad5045e04a2655553158c7b4634 = function() {

var id = 'f97e62ad5045e04a2655553158c7b4634';
Ngn.Form.forms[id].eForm.getElements('.type_fieldList').each(function(el){
  new Ngn.sd.FieldSetAnimatedText(Ngn.Form.forms[id], el, {'rowElementSelector': '.hgrp'});
});

// -- type: color --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.f97e62ad5045e04a2655553158c7b4634, 'color');

// -- type: fontFamilyCufon --
new Ngn.Form.ElInit.factory(Ngn.Form.forms.f97e62ad5045e04a2655553158c7b4634, 'fontFamilyCufon');

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('f97e62ad5045e04a2655553158c7b4634'), 1000);

};
