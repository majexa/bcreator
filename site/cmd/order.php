<?php

foreach (Config::getVar('sd/pageBlocks/132') as $v) {
  print 'ID='.$v['id'].'. '.$v['orderKey'].': '.$v['data']['type'].' '.@$v['content']['text']."\n";
}
//die2($pageBlocks);
