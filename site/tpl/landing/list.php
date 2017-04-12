<ul>
<? foreach ($d['list'] as $v) { ?>
    <li><a href="/cpanel/<?= $v['id'] ?>"><?= $v['title'] ?></a></li>
<? } ?>
</ul>
