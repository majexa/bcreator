<?php

class CtrlAdminUsersBcreator extends CtrlAdminUsers {

  protected function getHead() {
    $head = parent::getHead();
    $head[] = 'Render limits';
    $head[] = 'Renders count';
    $head[] = 'Last invoice due date';
    return $head;
  }

  protected function getItems() {
    $items = $this->items()->getItems();
    foreach (db()->select('SELECT rLimit, userId FROM renderLimits WHERE userId IN (?a)', array_keys($items)) as $v) {
      $items[$v['userId']]['limit'] = $v['rLimit'];
    }
    foreach (db()->select('SELECT cnt, userId FROM renderCounts WHERE userId IN (?a)', array_keys($items)) as $v) {
      $items[$v['userId']]['rendersCount'] = $v['cnt'];
    }
    foreach (db()->select('SELECT UNIX_TIMESTAMP(dueDate) AS dueDate, amount, userId FROM invoice WHERE userId IN (?a) GROUP BY userId ORDER BY dueDate DESC', array_keys($items)) as $v) {
      $items[$v['userId']]['invoiceDueDate'] = $v['dueDate'];
      $items[$v['userId']]['invoiceAmount'] = $v['amount'];
    }
    return $items;
  }

  protected function getData($item) {
    $data = parent::getData($item);
    $data[] = isset($item['limit']) ? $item['limit'] : [BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT, 'gray'];
    $data[] = isset($item['rendersCount']) ? $item['rendersCount'] : '-';
    $data[] = isset($item['invoiceDueDate']) ? '<a href="/admin/invoices/'.$item['id'].'" class="dgray">'.date('d.m.Y', $item['invoiceDueDate']).'</a>' : '-';
    return $data;
  }

  function action_json_editRenderLimits() {
    return new EditRenderLimitsForm($this->req->rq('id'));
  }

}

CtrlAdminUsersBcreator::$properties['title'] = Locale::get('users', 'admin');