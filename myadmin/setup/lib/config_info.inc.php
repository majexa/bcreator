<?php
/**
 * Description of options with non-standard values, list of persistent options
 * and validator assignments.
 *
 * By default data types are taken from config.default.php, here we define
 * only allowed values for select fields and type overrides.
 *
 * @package    phpMyAdmin-setup
 * @author     Piotr Przybylski <piotrprz@gmail.com>
 * @license    http://www.gnu.org/licenses/gpl.html GNU GPL 2.0
 * @version    $Id: config_info.inc.php 11645 2008-10-09 16:39:45Z crackpl $
 */

$cfg_db = [];

// path to config file, relative to phpMyAdmin's root path
$cfg_db['_config_file_path'] = './config/config.inc.php';

/**
 * Value meaning:
 * o array - select field, array contains allowed values
 * o string - type override
 *
 * Use normal array, paths won't be expanded
 */
$cfg_db['Servers'] = [1 => [
    'port'         => 'integer',
    'connect_type' => ['tcp', 'socket'],
    'extension'    => ['mysql', 'mysqli'],
    'auth_type'    => ['config', 'http', 'signon', 'cookie'],
    'AllowDeny'    => [
        'order'    => ['', 'deny,allow', 'allow,deny', 'explicit']],
    'only_db'      => 'array']];
$cfg_db['RecodingEngine'] = ['auto', 'iconv', 'recode'];
$cfg_db['DefaultCharset'] = $GLOBALS['cfg']['AvailableCharsets'];
$cfg_db['OBGzip'] = ['auto', true, false];
$cfg_db['ShowTooltipAliasTB'] = ['nested', true, false];
$cfg_db['DisplayDatabasesList'] = ['auto', true, false];
$cfg_db['LeftLogoLinkWindow'] = ['main', 'new'];
$cfg_db['LeftDefaultTabTable'] = [
    'tbl_structure.php', // fields list
    'tbl_sql.php',       // SQL form
    'tbl_select.php',    // search page
    'tbl_change.php',    // insert row page
    'sql.php'];          // browse page
$cfg_db['NavigationBarIconic'] = [true, false, 'both'];
$cfg_db['Order'] = ['ASC', 'DESC', 'SMART'];
$cfg_db['ProtectBinary'] = [false, 'blob', 'all'];
$cfg_db['CharEditing'] = ['input', 'textarea'];
$cfg_db['PropertiesIconic'] = [true, false, 'both'];
$cfg_db['DefaultTabServer'] = [
    'main.php',                // the welcome page (recommended for multiuser setups)
    'server_databases.php',    // list of databases
    'server_status.php',       // runtime information
    'server_variables.php',    // MySQL server variables
    'server_privileges.php',   // user management
    'server_processlist.php']; // process list
$cfg_db['DefaultTabDatabase'] = [
    'db_structure.php',   // tables list
    'db_sql.php',         // SQL form
    'db_search.php',      // search query
    'db_operations.php']; // operations on database
$cfg_db['DefaultTabTable'] = [
    'tbl_structure.php', // fields list
    'tbl_sql.php',       // SQL form
    'tbl_select.php',    // search page
    'tbl_change.php',    // insert row page
    'sql.php'];          // browse page
$cfg_db['QueryWindowDefTab'] = [
	'sql',     // SQL
	'files',   // Import files
	'history', // SQL history
	'full'];   // All (SQL and SQL history)
$cfg_db['Import']['format'] = [
    'csv',    // CSV
    'docsql', // DocSQL
    'ldi',    // CSV using LOAD DATA
    'sql'];   // SQL
$cfg_db['Import']['sql_compatibility'] = [
    'NONE', 'ANSI', 'DB2', 'MAXDB', 'MYSQL323', 'MYSQL40', 'MSSQL', 'ORACLE',
    // removed; in MySQL 5.0.33, this produces exports that
    // can't be read by POSTGRESQL (see our bug #1596328)
    //'POSTGRESQL',
    'TRADITIONAL'];
$cfg_db['Import']['ldi_local_option'] = ['auto', true, false];
$cfg_db['Export']['format'] = ['codegen', 'csv', 'excel', 'htmlexcel',
    'htmlword', 'latex', 'ods', 'odt', 'pdf', 'sql', 'texytext', 'xls', 'xml',
    'yaml'];
$cfg_db['Export']['compression'] = ['none', 'zip', 'gzip', 'bzip2'];
$cfg_db['Export']['charset'] = array_merge([''], $GLOBALS['cfg']['AvailableCharsets']);

/**
 * Config options which will be placed in config file even if they are set
 * to their default values (use only full paths)
 */
$persist_keys = [
    'DefaultLang',
    'ServerDefault',
    'UploadDir',
    'SaveDir',
    'Servers/1/verbose',
    'Servers/1/host',
    'Servers/1/port',
    'Servers/1/socket',
    'Servers/1/extension',
    'Servers/1/connect_type',
    'Servers/1/auth_type',
    'Servers/1/user',
    'Servers/1/password'];

/**
 * Default values overrides
 * Use only full paths
 */
$cfg_db['_overrides'] = [];
$cfg_db['_overrides']['Servers/1/extension'] = extension_loaded('mysqli')
    ? 'mysqli' : 'mysql';

/**
 * Validator assignments (functions from validate.lib.php and 'validators'
 * object in scripts.js)
 * Use only full paths and form ids
 */
$cfg_db['_validators'] = [
    'Server' => 'validate_server',
    'Server_pmadb' => 'validate_pmadb',
    'Servers/1/port' => 'validate_port_number',
    'Servers/1/hide_db' => 'validate_regex',
    'TrustedProxies' => 'validate_trusted_proxies',
    'LoginCookieValidity' => 'validate_positive_number',
    'LoginCookieStore' => 'validate_non_negative_number',
    'QueryHistoryMax' => 'validate_positive_number',
    'LeftFrameTableLevel' => 'validate_positive_number',
    'MaxRows' => 'validate_positive_number',
    'CharTextareaCols' => 'validate_positive_number',
    'CharTextareaRows' => 'validate_positive_number',
    'InsertRows' => 'validate_positive_number',
    'ForeignKeyMaxLimit' => 'validate_positive_number',
    'Import/skip_queries' => 'validate_non_negative_number'];
?>