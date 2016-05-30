<?php

class CtrlBcreatorPageBlock extends CtrlSdPageBlock {

  function action_json_imageMultiUpload() {
    $items = $this->items();
    $blockId = $this->req->param(3);
    $block = $items->getItem($blockId);
    $imageN = BracketName::getLastKey($this->req['fn']);
    $images = empty($block['data']['images']) ? [] : $block['data']['images'];
    $file = Dir::make(UPLOAD_PATH."/{$items->name}/multi").'/'.$blockId.'-'.$imageN.'.jpg';
    copy($this->req->files['image'][$imageN]['tmp_name'], $file);
    $images[$imageN] = '/'.UPLOAD_DIR."/{$items->name}/multi".'/'.$blockId.'-'.$imageN.'.jpg';
    $items->update($blockId, [
      'images' => $images
    ]);
  }

  function action_json_deleteImage() {
    $items = $this->items();
    $blockId = $this->req->param(3);
    $block = $items->getItem($blockId);
    $imageN = $this->req->param(4);
    File::delete(UPLOAD_PATH."/{$items->name}/multi".'/'.$blockId.'-'.$imageN.'.jpg');
    $images = $block['data']['images'];
    //unset($images[$imageN]);
    $images = Arr::dropN($images, $imageN);
    $items->update($blockId, [
      'images' => $images
    ]);
    $this->json = $images;
  }

}