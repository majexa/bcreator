<a href="/list/add">Добавить документ</a>
<? foreach ($d['items'] as $v) { ?>
  <li>
    <?= $v['title'] ?: 'unnamed' ?>
    <a href="/cpanel/<?= $v['id'] ?>">Редактировать</a>
  </li>
<? } ?>
