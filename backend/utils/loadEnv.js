const { config } = require('dotenv');
const { resolve } = require('path');

function loadEnv(path = '../../.env') {
    config({ path: resolve(__dirname, path) });
}

module.exports = {
    loadEnv
}; 