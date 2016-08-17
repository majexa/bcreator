<?php

class CtrlBcreatorSupport extends CtrlBcreatorLanding {

  function action_default() {
    $this->setPageTitle('Support');
    $form = new BcreatorSupportForm;
    $this->d['innerTpl'] = 'landing/form';
    $this->d['menu'][3]['active'] = true;
    if ($form->update()) {
      $this->redirect('/support/complete');
      return;
    }
    $this->d['form'] = $form->html();
  }

  function action_complete() {
    $this->d['innerTpl'] = 'common/html';
    $this->d['html'] = '<p>Your message has been sent and will be reviewed within 48 hours. Thank you for your patience!</p>';
  }

}