<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * @version $Id: bdb.lib.php 10137 2007-03-19 17:55:39Z cybot_tm $
 */

/**
 *
 */
class PMA_StorageEngine_bdb extends PMA_StorageEngine
{
    /**
     * @return  array   variable names
     */
    function getVariables()
    {
        return [
            'version_bdb' => [
                'title' => $GLOBALS['strVersionInformation'],
            ],
            'bdb_cache_size' => [
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'bdb_home' => [
            ],
            'bdb_log_buffer_size' => [
                'type'  => PMA_ENGINE_DETAILS_TYPE_SIZE,
            ],
            'bdb_logdir' => [
            ],
            'bdb_max_lock' => [
                'type'  => PMA_ENGINE_DETAILS_TYPE_NUMERIC,
            ],
            'bdb_shared_data' => [
            ],
            'bdb_tmpdir' => [
            ],
            'bdb_data_direct' => [
            ],
            'bdb_lock_detect' => [
            ],
            'bdb_log_direct' => [
            ],
            'bdb_no_recover' => [
            ],
            'bdb_no_sync' => [
            ],
            'skip_sync_bdb_logs' => [
            ],
            'sync_bdb_logs' => [
            ],
        ];
    }

    /**
     * @return string   LIKE pattern
     */
    function getVariablesLikePattern()
    {
        return '%bdb%';
    }

    /**
     * returns string with filename for the MySQL helppage
     * about this storage engne
     *
     * @return  string  mysql helppage filename
     */
    function getMysqlHelpPage()
    {
        return 'bdb';
    }
}

?>
