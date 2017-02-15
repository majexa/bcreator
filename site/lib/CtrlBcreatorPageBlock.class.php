<?php

class CtrlBcreatorPageBlock extends CtrlSdPageBlock {

  function action_json_imageMultiUpload() {
    $items = $this->items();
    $blockId = $this->req->param(3);
    $block = $items->getItem($blockId);
    $imageN = BracketName::getLastKey($this->req['fn']);
    $images = empty($block['data']['images']) ? [] : $block['data']['images'];
    $file = Dir::make(UPLOAD_PATH."/{$items->name}/multi".'/'.$blockId).'/'.$imageN.'.jpg';
    copy($this->req->files['image'][$imageN]['tmp_name'], $file);
    $images[$imageN] = '/'.UPLOAD_DIR."/{$items->name}/multi".'/'.$blockId.'/'.$imageN.'.jpg';
    $items->update($blockId, [
      'images' => $images
    ]);
  }

  function action_json_deleteImage() {
    $items = $this->items();
    $blockId = $this->req->param(3);
    $block = $items->getItem($blockId);
    $imageN = $this->req->param(4);
    $basePath = '/'.UPLOAD_DIR."/{$items->name}/multi/$blockId";
    $folder = UPLOAD_PATH."/{$items->name}/multi/$blockId";
    File::delete("$folder/$imageN.jpg");
    $images = $block['data']['images'];
    unset($images[$imageN]);
    $newImages = [];
    for ($i = 0; $i < count($images); $i++) {
      $newImages[] = $basePath."/$i.jpg";
    }
    $items->update($blockId, [
      'images' => $newImages
    ]);
    $n = 0;
    foreach (glob("$folder/*") as $file) {
      if ($file != "$folder/$n.jpg") {
        rename($file, "$folder/$n.jpg");
      }
      $n++;
    }
    $this->json = $newImages;
  }


  function action_json_delete() {
    parent::action_json_delete();
    Dir::remove(UPLOAD_PATH."/{$this->items()->name}/multi/".$this->req->param(3));
  }

}