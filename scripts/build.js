/**
 * Simple build script for development and production
 */

const fs = require('fs');
const path = require('path');

const environment = process.argv[2] || 'development';

console.log(`Building for ${environment}...`);

// For now, this is just a placeholder since we're using static files
// In the future, you could add minification, bundling, etc. here

if (environment === 'production') {
    console.log('Production build completed');
} else {
    console.log('Development build completed');
}

console.log('Build finished successfully!');
