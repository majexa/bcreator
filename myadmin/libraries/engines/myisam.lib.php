<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * @version $Id: myisam.lib.php 10137 2007-03-19 17:55:39Z cybot_tm $
 */

/**
 * the MyISAM storage engine
 */
class PMA_StorageEngine_myisam extends PMA_StorageEngine
{
    /**
     * returns array with variable names dedicated to MyISAM storage engine
     *
     * @return  array   variable names
     */
    function getVariables()
    {
        return [
            'myisam_data_pointer_size' => [
                'title' => $GLOBALS['strMyISAMDataPointerSize'],
                'desc'  => $GLOBALS['strMyISAMDataPointerSizeDesc'],
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'myisam_recover_options' => [
                'title' => $GLOBALS['strMyISAMRecoverOptions'],
                'desc'  => $GLOBALS['strMyISAMRecoverOptionsDesc'],
            ],
            'myisam_max_sort_file_size' => [
                'title' => $GLOBALS['strMyISAMMaxSortFileSize'],
                'desc'  => $GLOBALS['strMyISAMMaxSortFileSizeDesc'],
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'myisam_max_extra_sort_file_size' => [
                'title' => $GLOBALS['strMyISAMMaxExtraSortFileSize'],
                'desc'  => $GLOBALS['strMyISAMMaxExtraSortFileSizeDesc'],
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'myisam_repair_threads' => [
                'title' => $GLOBALS['strMyISAMRepairThreads'],
                'desc'  => $GLOBALS['strMyISAMRepairThreadsDesc'],
                'type'  => PMA_ENGINE_DETAILS_TYPE_NUMERIC,
            ],
            'myisam_sort_buffer_size' => [
                'title' => $GLOBALS['strMyISAMSortBufferSize'],
                'desc'  => $GLOBALS['strMyISAMSortBufferSizeDesc'],
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'myisam_stats_method' => [
            ],
            'delay_key_write' => [
            ],
            'bulk_insert_buffer_size' => [
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'skip_external_locking' => [
            ],
        ];
    }
}

?>
