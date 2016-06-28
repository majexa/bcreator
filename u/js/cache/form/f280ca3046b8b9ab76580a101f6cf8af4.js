Ngn.Frm.init.f280ca3046b8b9ab76580a101f6cf8af4 = function() {
Ngn.Form.elOptions.image = {"deleteImageUrl":"\/pageBlock\/6\/json_deleteImage\/119\/{n}"}

var id = 'f280ca3046b8b9ab76580a101f6cf8af4';
Ngn.Form.forms[id].eForm.getElements('.type_fieldListBcreatorImages').each(function(el){
  new Ngn.sd.FieldSetAnimatedImages(Ngn.Form.forms[id], el, {'deleteImageUrl': '/pageBlock/6/json_deleteImage/119/{n}', 'rowElementSelector': '.hgrp'});
});

// -- jsMaxLength -- 

Ngn.Frm.maxLength($('f280ca3046b8b9ab76580a101f6cf8af4'), 1000);

};
