<?php

class CtrlBcreatorList extends CtrlBcreatorLanding {

  function checkUser() {
      if (!Auth::get('id')) {
          $this->redirect('/');
          return;
      }
  }

  function action_default() {
    self::checkUser();
    Sflm::frontend('css')->addLib('i/css/common/tips.css');
    $this->setPageTitle('My Banners');
    $this->d['banners'] = [];
    $this->d['banners_trash_count'] = db()->selectCell('SELECT COUNT(*) FROM bcBanners_trash WHERE userId=?d', Auth::get('id'));
    foreach (db()->select('SELECT * FROM bcBanners WHERE userId=?d', Auth::get('id')) as $v) {
      $this->d['banners'][] = new BcBanner($v);
    }
    $this->d['innerTpl'] = 'landing/list';
    $this->d['menu'][2]['active'] = true;
  }

  function action_create() {
    self::checkUser();
    $this->setPageTitle('Create new');
    $this->d['menu'][1]['active'] = true;
    $form = new BannerSettingsCreationForm;
    if ($form->update()) {
      $this->redirect('/cpanel/'.$form->createdId);
      return;
    }
    $this->d['form'] = BcreatorCore::extendForm($form)->html();
    $this->d['innerTpl'] = 'landing/form';
  }

  function action_getTrash() {
      self::checkUser();
      $trash=db()->select('SELECT * FROM bcBanners_trash WHERE userId=?d', Auth::get('id'));
      if(count($trash)>0) {
          echo "<table class='table' style='width: 100%; padding: 15px; display: inline-table;'><thead><tr><th>Title</th><th>Size</th><th>Actions</th></tr></thead><tbody>";
          foreach ($trash as $v) {
              $v = new BcBanner($v);
              if ($v['directLink']) {
                  $img = "<img src = " . $v['directLink'] . '?' . strtotime($v['dateRender']) . " class='thumb' >";
              } else {
                  $img = "";
              }
              echo "<tr><td><b id='name-$v[id]'>$v[title]</b><br>$img</td><td>$v[size]</td><td><a href='#'><img src='/m/img/landing/restore.png' style='width:25px' title='Restore' onclick='restoreTrash(\"$v[id]\");'></a> <a href='#'><img src='/m/img/landing/delete.png' style='width:20px' title='Delete'  onclick='delTrash(\"$v[id]\");'></a></td></tr>";
          }
          echo "</tbody></table>";
          exit;
      } else {echo "No banners in trash"; exit;}
    }

    function action_getCountTrash() {
        self::checkUser();
        $CounTrash=db()->selectCell('SELECT Count(*) FROM bcBanners_trash WHERE userId=?d', Auth::get('id'));
        echo $CounTrash;
        exit;
    }


  function action_delete() {
    self::checkUser();
    $this->d['banner'] = Misc::checkEmpty(db()->selectRow('SELECT * FROM bcBanners WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    //$this->d['banner']['title'] = 'ID='.$this->d['banner']['id'];
    $this->d['innerTpl'] = 'landing/delete';
  }

  function action_deleteConfirmed() {
    self::checkUser();
      db()->query('INSERT INTO `bcBanners_trash` SELECT * FROM `bcBanners` WHERE `id`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
      db()->query('INSERT INTO `bcBlocks_trash` SELECT * FROM `bcBlocks` WHERE `bannerId`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
      db()->query('DELETE FROM `bcBanners` WHERE `id`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
      db()->query('DELETE FROM `bcBlocks` WHERE `bannerId`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
    $this->redirect('/list');
  }

  function action_deleteConfirmedTrash() {
        self::checkUser();
        db()->query('DELETE FROM `bcBanners_trash` WHERE `id`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        db()->query('DELETE FROM `bcBlocks_trash` WHERE `bannerId`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        echo "Ok";
      exit;
  }

  function action_restoreTrash() {
        self::checkUser();
        db()->query('INSERT INTO `bcBanners` SELECT * FROM `bcBanners_trash` WHERE `id`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        db()->query('INSERT INTO `bcBlocks` SELECT * FROM `bcBlocks_trash` WHERE `bannerId`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        db()->query('DELETE FROM `bcBanners_trash` WHERE `id`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        db()->query('DELETE FROM `bcBlocks_trash` WHERE `bannerId`=?d AND `userId`=?d', $this->req->param(2), Auth::get('id'));
        echo "Ok";
      exit;
    }
  function action_download() {
    self::checkUser();
    $banner = new BcBanner(db()->selectRow('SELECT * FROM bcBanners WHERE id=?d AND userId=?d', $this->req->param(2), Auth::get('id')));
    Misc::checkEmpty($banner['downloadFile']);
    header('Content-Type: application/image');
    header('Content-Disposition: attachment;filename="'.basename($banner['downloadFile']).'"');
    readfile($banner['downloadFile']);
  }

}