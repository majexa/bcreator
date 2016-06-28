Ngn.Frm.init.f2535069d276d51c667de78d364163497 = function() {
Ngn.Form.elOptions.image = {"deleteImageUrl":"\/pageBlock\/11\/json_deleteImage\/84\/{n}"}

var id = 'f2535069d276d51c667de78d364163497';
Ngn.Form.forms[id].eForm.getElements('.type_fieldListBcreatorImages').each(function(el){
  new Ngn.sd.FieldSetAnimatedImages(Ngn.Form.forms[id], el, {'deleteImageUrl': '/pageBlock/11/json_deleteImage/84/{n}', 'rowElementSelector': '.hgrp'});
});

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('f2535069d276d51c667de78d364163497'), 1000);

};
