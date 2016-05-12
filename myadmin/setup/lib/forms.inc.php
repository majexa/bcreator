<?php
/**
 * List of avaible forms, each form is described as an array of fields to display.
 * Fields MUST have their counterparts in the $cfg array.
 *
 * There are two possible notations:
 * $forms['Form name'] = array('Servers' => array(1 => array('host')));
 * can be written as
 * $forms['Form name'] = array('Servers/1/host');
 *
 * You can assign default values set by special button ("set value: ..."), eg.:
 * $forms['Server_pmadb'] = array('Servers' => array(1 => array(
 *  'pmadb' => 'phpmyadmin')));
 *
 * @package    phpMyAdmin-setup
 * @author     Piotr Przybylski <piotrprz@gmail.com>
 * @license    http://www.gnu.org/licenses/gpl.html GNU GPL 2.0
 * @version    $Id: forms.inc.php 11875 2008-11-13 20:02:18Z crackpl $
 */

$forms = [];
$forms['_config.php'] = [
    'DefaultLang',
    'ServerDefault'];
$forms['Server'] = ['Servers' => [1 => [
    'verbose',
    'host',
    'port',
    'socket',
    'ssl',
    'connect_type',
    'extension',
    'compress',
    'auth_type',
    'user',
    'password',
    'nopassword',
    'auth_swekey_config' => './swekey.conf']]];
$forms['Server_login_options'] = ['Servers' => [1 => [
    'SignonSession',
    'SignonURL',
    'LogoutURL']]];
$forms['Server_config'] = ['Servers' => [1 => [
    'only_db',
    'hide_db',
    'AllowRoot',
    'AllowNoPasswordRoot',
    'DisableIS',
    'AllowDeny/order',
    'AllowDeny/rules',
    'ShowDatabasesCommand',
    'CountTables']]];
$forms['Server_pmadb'] = ['Servers' => [1 => [
    'pmadb' => 'phpmyadmin',
    'controluser',
    'controlpass',
    'verbose_check',
    'bookmarktable' => 'pma_bookmark',
    'relation' => 'pma_relation',
    'table_info' => 'pma_table_info',
    'table_coords' => 'pma_table_coords',
    'pdf_pages' => 'pma_pdf_pages',
    'column_info' => 'pma_column_info',
    'history' => 'pma_history',
    'designer_coords' => 'designer_coords']]];
$forms['Import_export'] = [
    'UploadDir',
    'SaveDir',
    'AllowAnywhereRecoding',
    'DefaultCharset',
    'RecodingEngine',
    'IconvExtraParams',
    'ZipDump',
    'GZipDump',
    'BZipDump',
    'CompressOnFly'];
$forms['Security'] = [
    'blowfish_secret',
    'ForceSSL',
    'CheckConfigurationPermissions',
    'TrustedProxies',
    'AllowUserDropDatabase',
    'AllowArbitraryServer',
    'LoginCookieRecall',
    'LoginCookieValidity',
    'LoginCookieStore',
    'LoginCookieDeleteAll'];
$forms['Sql_queries'] = [
    'ShowSQL',
    'Confirm',
    'QueryHistoryDB',
    'QueryHistoryMax',
    'IgnoreMultiSubmitErrors',
    'VerboseMultiSubmit'];
$forms['Other_core_settings'] = [
    'MaxDbList',
    'MaxTableList',
    'MaxCharactersInDisplayedSQL',
    'OBGzip',
    'PersistentConnections',
    'ExecTimeLimit',
    'MemoryLimit',
    'SkipLockedTables',
    'UseDbSearch'];
$forms['Left_frame'] = [
    'LeftFrameLight',
    'LeftDisplayLogo',
    'LeftLogoLink',
    'LeftLogoLinkWindow',
    'LeftDefaultTabTable',
    'LeftPointerEnable'];
$forms['Left_servers'] = [
    'LeftDisplayServers',
    'DisplayServersList'];
$forms['Left_databases'] = [
    'DisplayDatabasesList',
    'LeftFrameDBTree',
    'LeftFrameDBSeparator',
    'ShowTooltipAliasDB'];
$forms['Left_tables'] = [
    'LeftFrameTableSeparator',
    'LeftFrameTableLevel',
    'ShowTooltip',
    'ShowTooltipAliasTB'];
$forms['Startup'] = [
    'ShowStats',
    'ShowPhpInfo',
    'ShowServerInfo',
    'ShowChgPassword',
    'ShowCreateDb',
    'SuggestDBName'];
$forms['Browse'] = [
    'NavigationBarIconic',
    'ShowAll',
    'MaxRows',
    'Order',
    'BrowsePointerEnable',
    'BrowseMarkerEnable'];
$forms['Edit'] = [
    'ProtectBinary',
    'ShowFunctionFields',
    'CharEditing',
    'CharTextareaCols',
    'CharTextareaRows',
    'InsertRows',
    'ForeignKeyDropdownOrder',
    'ForeignKeyMaxLimit'];
$forms['Tabs'] = [
    'LightTabs',
    'PropertiesIconic',
    'DefaultTabServer',
    'DefaultTabDatabase',
    'DefaultTabTable',
	'QueryWindowDefTab'];
$forms['Sql_box'] = ['SQLQuery' => [
    'Edit',
    'Explain',
    'ShowAsPHP',
    'Validate',
    'Refresh']];
$forms['Import_defaults'] = ['Import' => [
    'format',
    'allow_interrupt',
    'skip_queries']];
$forms['Export_defaults'] = ['Export' => [
    'format',
    'compression',
    'asfile',
    'charset',
    'onserver',
    'onserver_overwrite',
    'remember_file_template',
    'file_template_table',
    'file_template_database',
    'file_template_server']];
?>