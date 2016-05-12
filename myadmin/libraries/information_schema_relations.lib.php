<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 *
 * @version $Id: information_schema_relations.lib.php 10142 2007-03-20 10:32:13Z cybot_tm $
 */

/**
 *
 */
$GLOBALS['information_schema_relations'] = [
    'CHARACTER_SETS' => [
        'DEFAULT_COLLATE_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'COLLATIONS',
            'foreign_field' => 'COLLATION_NAME'
        ]
    ],
    'COLLATIONS' => [
        'CHARACTER_SET_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'CHARACTER_SETS',
            'foreign_field' => 'CHARACTER_SET_NAME'
        ]
    ],
    'COLLATION_CHARACTER_SET_APPLICABILITY' => [
        'CHARACTER_SET_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'CHARACTER_SETS',
            'foreign_field' => 'CHARACTER_SET_NAME'
        ],
        'COLLATION_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'COLLATIONS',
            'foreign_field' => 'COLLATION_NAME'
        ]
    ],
    'COLUMNS' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ],
        'CHARACTER_SET_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'CHARACTER_SETS',
            'foreign_field' => 'CHARACTER_SET_NAME'
        ],
        'COLLATION_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'COLLATIONS',
            'foreign_field' => 'COLLATION_NAME'
        ]
    ],
    'COLUMN_PRIVILEGES' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'KEY_COLUMN_USAGE' => [
        'CONSTRAINT_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ],
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'ROUTINES' => [
        'ROUTINE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'SCHEMATA' => [
        'DEFAULT_CHARACTER_SET_NAME' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'CHARACTER_SETS',
            'foreign_field' => 'CHARACTER_SET_NAME'
        ]
    ],
    'SCHEMA_PRIVILEGES' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'TABLES' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ],
        'TABLE_COLLATION' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'COLLATIONS',
            'foreign_field' => 'COLLATION_NAME'
        ]
    ],
    'TABLE_CONSTRAINTS' => [
        'CONSTRAINT_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ],
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'TABLE_PRIVILEGES' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ],
    'VIEWS' => [
        'TABLE_SCHEMA' => [
            'foreign_db'    => 'information_schema',
            'foreign_table' => 'SCHEMATA',
            'foreign_field' => 'SCHEMA_NAME'
        ]
    ]
];

?>
