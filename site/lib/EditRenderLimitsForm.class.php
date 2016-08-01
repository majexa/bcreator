<?php

class EditRenderLimitsForm extends Form {

  protected $userId;

  function __construct($userId) {
    $this->userId = $userId;
    $limitField = [
      'title' => 'Limit',
      'name'  => 'limit',
      'help'  => 'Default value is '.BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT
    ];
    $currentLimit = db()->selectCell('SELECT rLimit FROM renderLimits WHERE userId=?', $this->userId);
    if ($currentLimit and $currentLimit != BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT) {
      $limitField['value'] = $currentLimit;
    }
    else {
      $limitField['placeholder'] = BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT;
    }
    parent::__construct([$limitField], [
      'title' => 'Edit Render Limits'
    ]);
  }

  protected function _update(array $data) {
    if ($data['limit'] != BcreatorRender::DEFAULT_TRIAL_RENDER_LIMIT) {
      db()->insert('renderLimits', [
        'userId' => $this->userId,
        'rLimit'  => $data['limit']
      ], Db::modeUpdateOnDuplicateKey);
    }
  }

}