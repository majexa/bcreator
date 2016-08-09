Ngn.Frm.init.fe020aa64deb603e7048da81848df258b = function() {
Ngn.Form.elOptions.image = {"deleteImageUrl":"\/pageBlock\/12\/json_deleteImage\/142\/{n}"}

var id = 'fe020aa64deb603e7048da81848df258b';
Ngn.Form.forms[id].eForm.getElements('.type_fieldListBcreatorImages').each(function(el){
  new Ngn.sd.FieldSetAnimatedImages(Ngn.Form.forms[id], el, {'deleteImageUrl': '/pageBlock/12/json_deleteImage/142/{n}', 'rowElementSelector': '.hgrp'});
});

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('fe020aa64deb603e7048da81848df258b'), 1000);

};
