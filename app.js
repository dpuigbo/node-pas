// Entry point for Phusion Passenger (Hostinger)
// Load .env first, then use tsx to run TypeScript directly
require('dotenv').config();
require('tsx/cjs');
require('./src/index.ts');
