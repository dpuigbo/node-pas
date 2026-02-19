// Entry point for Phusion Passenger (Hostinger)
// Load .env with absolute path so it works regardless of cwd
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('tsx/cjs');
require('./src/index.ts');
