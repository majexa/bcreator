Ngn.Frm.init.f39a644125f064730ad75db07221eb496 = function() {
Ngn.Form.elOptions.image = {"deleteImageUrl":"\/pageBlock\/11\/json_deleteImage\/84\/{n}"}

var id = 'f39a644125f064730ad75db07221eb496';
Ngn.Form.forms[id].eForm.getElements('.type_fieldListBcreatorImages').each(function(el){
  new Ngn.Frm.FieldSetBcreatorImages(Ngn.Form.forms[id], el, {'deleteImageUrl': '/pageBlock/11/json_deleteImage/84/{n}', 'rowElementSelector': '.hgrp'});
});

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('f39a644125f064730ad75db07221eb496'), 1000);

};
