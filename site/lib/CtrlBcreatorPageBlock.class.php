<?php

class CtrlBcreatorPageBlock extends CtrlSdPageBlock
{

    function action_json_imageMultiUpload()
    {
        $items = $this->items();
        $blockId = $this->req->param(3);
        $block = $items->getItem($blockId);
        $imageN = BracketName::getLastKey($this->req['fn']);
        $images = empty($block['data']['images']) ? [] : $block['data']['images'];
        $file = Dir::make(UPLOAD_PATH . "/{$items->name}/multi" . '/' . $blockId) . '/' . $imageN . '.jpg';
        copy($this->req->files['image'][$imageN]['tmp_name'], $file);
        $images[$imageN] = '/' . UPLOAD_DIR . "/{$items->name}/multi" . '/' . $blockId . '/' . $imageN . '.jpg';
        $items->update($blockId, [
            'images' => $images
        ]);
    }

    function action_json_deleteImage()
    {
        $items = $this->items();
        $blockId = $this->req->param(3);
        $block = $items->getItem($blockId);
        $imageN = $this->req->param(4);
        $basePath = '/' . UPLOAD_DIR . "/{$items->name}/multi/$blockId";
        $folder = UPLOAD_PATH . "/{$items->name}/multi/$blockId";
        File::delete("$folder/$imageN.jpg");
        $images = $block['data']['images'];
        unset($images[$imageN]);
        $newImages = [];
        for ($i = 0; $i < count($images); $i++) {
            $newImages[] = $basePath . "/$i.jpg";
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

    function action_json_undo()
    {
        $res = db()->selectRow('SELECT * FROM `bcBlocks_undo_stack` WHERE bannerId=? ORDER BY `id` DESC  LIMIT 0,1', $this->req->param(1));
        if (count($res) == 0) {
            return $this->json["act"] = False;
        }
        //error_log("You messed up!".print_r($res["COUNT(*)"]), 0);
        db()->query('INSERT INTO `bcBlocks_redo_stack` SELECT NULL,`dateCreate`,`dateUpdate`,`orderKey`,`content`,`data`,`bannerId`,`userId`,`act`,`idBlock` FROM `bcBlocks_undo_stack` WHERE `bcBlocks_undo_stack`.`id`=?', $res["id"]);
        db()->query('DELETE FROM `bcBlocks_undo_stack` WHERE `id` =?', $res["id"]);
        if ($res["act"] == "add") {
            $this->json["id"] = $res["idBlock"];
            $this->json["act"] = $res["act"];
            db()->query('DELETE FROM `bcBlocks` WHERE `id` =?', $res["idBlock"]);
        } else {
            $idblock = $res["idBlock"];
            $act = $res["act"] = $res["act"];
            if ($res["act"] == "delete") {
                $res["id"] = $res["idBlock"];
                unset($res["idBlock"]);
                unset($res["act"]);
                db()->query("INSERT INTO `bcBlocks` SET ?a", Arr::serialize($res));
            } else {
                $res = db()->selectRow('SELECT * FROM `bcBlocks_undo_stack` WHERE idBlock=? ORDER BY `id` DESC  LIMIT 0,1', $res["idBlock"]);
                db()->query("UPDATE `bcBlocks` SET `orderKey`='" . $res["orderKey"] . "',`content`='" . $res["content"] . "',`data`='" . $res["data"] . "',`dateUpdate`='" . $res["dateUpdate"] . "' WHERE `id`=?", $res["idBlock"]);
            }
            $items = $this->items();
            $this->json = $items->getItemF($idblock);
            $this->json["act"] = $act;
        }
        return $this;
    }

    function action_json_redo()
    {
        $res = db()->selectRow('SELECT * FROM `bcBlocks_redo_stack` WHERE bannerId=? ORDER BY `id` DESC  LIMIT 0,1', $this->req->param(1));
        if (count($res) == 0) {
            return $this->json["act"] = False;
        } else {
            $idBwork = $res["id"];
            db()->query('INSERT INTO `bcBlocks_undo_stack` SELECT NULL,`dateCreate`,`dateUpdate`,`orderKey`,`content`,`data`,`bannerId`,`userId`,`act`,`idBlock` FROM `bcBlocks_redo_stack` WHERE `bcBlocks_redo_stack`.`id`=?', $res["id"]);
            if ($res["act"] == "delete") {
                $this->json["id"] = $res["idBlock"];
                $this->json["act"] = $res["act"];
                db()->query('DELETE FROM `bcBlocks` WHERE `id` =?', $res["idBlock"]);
            } else {
                $idblock = $res["idBlock"];
                $act = $res["act"] = $res["act"];
                if ($res["act"] == "add") {
                    $res["id"] = $res["idBlock"];
                    unset($res["idBlock"]);
                    unset($res["act"]);
                    db()->query("INSERT INTO `bcBlocks` SET ?a", Arr::serialize($res));
                } else {
                    db()->query("UPDATE `bcBlocks` SET `orderKey`='" . $res["orderKey"] . "',`content`='" . $res["content"] . "',`data`='" . $res["data"] . "',`dateUpdate`='" . $res["dateUpdate"] . "' WHERE `id`=?", $res["idBlock"]);
                }
                $items = $this->items();
                $this->json = $items->getItemF($idblock);
                $this->json["act"] = $act;
            }
            db()->query('DELETE FROM `bcBlocks_redo_stack` WHERE `id` =?', $idBwork);
            return $this;
        }
    }

    function action_json_delete()
    {
        db()->query('INSERT INTO `bcBlocks_undo_stack` SELECT NULL,`dateCreate`,`dateUpdate`,`orderKey`,`content`,`data`,`bannerId`,`userId`,"delete" AS `act`,`id` AS `idBlock` FROM `bcBlocks` WHERE `bcBlocks`.`id`=?', $this->req->param(3));
        db()->query("DELETE FROM `bcBlocks_redo_stack` WHERE `bannerId`=?", $this->req->param(3));
        parent::action_json_delete();
        Dir::remove(UPLOAD_PATH . "/{$this->items()->name}/multi/" . $this->req->param(3));
    }

}