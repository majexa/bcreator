<?php

class CtrlBcreatorProfile extends CtrlBcreatorLanding {

  function action_default() {
    $form = new UsersEditForm(Auth::get('id'));
    $form->templates['form'] = '<fieldset>{input}<div class="clear"></div></fieldset>';
    $form->templates['input'] = '<div class="form-group element{rowClass}"{data}>{title}<div class="col-md-4 field-wrapper">{input}{error}{help}</div></div>';
    $form->templates['help'] = '<span class="help-block">{help}</span>';
    $form->customTemplates['btnSubmit'] = [
      'input' => '<div class="bootstrap-button">{input}</div>'
    ];
    $form->templates['title'] = '<label class="col-md-4 control-label">{title}{required}<span>:</span></label>';
    if ($form->update()) {
      $this->redirect();
      return;
    }
    $this->d['form'] = '<legend>Profile</legend>'. //
      '<div class="form-horizontal">'.$form->html().'</div>';
    $this->d['innerTpl'] = 'common/form';
  }

}