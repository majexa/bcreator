require('dotenv').load();
process.env.PROJECT_FOLDER = __dirname;
require('require-dir')('./gulp-tasks');