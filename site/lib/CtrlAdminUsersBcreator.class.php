<?php

class CtrlAdminUsersBcreator extends CtrlAdminUsers {

  protected function getHead() {
    $head = parent::getHead();
    $head[] = 'Render limits';
    return $head;
  }

  protected function getData($item) {
    $data = parent::getData($item);
    if ($limit = db()->selectCell('SELECT rLimit FROM renderLimits WHERE userId=?d', $item['id'])) {
      $default = false;
    } else {
      $default = true;
      $limit = BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT;
    }
    $data[] = $default ? [$limit, 'gray'] : $limit;
    return $data;
  }

  function action_json_editRenderLimits() {
    return new EditRenderLimitsForm($this->req->rq('id'));
  }

}

CtrlAdminUsersBcreator::$properties['title'] = Locale::get('users', 'admin');