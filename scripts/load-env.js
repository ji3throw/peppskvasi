/**
 * Environment Variable Loader
 * Loads environment variables from .env file and makes them available to the frontend
 */

// Simple .env file parser
function parseEnvFile(envContent) {
    const env = {};
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }
        
        // Parse KEY=VALUE format
        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex === -1) {
            continue;
        }
        
        const key = trimmedLine.substring(0, equalIndex).trim();
        let value = trimmedLine.substring(equalIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        env[key] = value;
    }
    
    return env;
}

// Load environment variables
async function loadEnvironmentVariables() {
    try {
        // Try to fetch .env file
        const response = await fetch('.env');
        if (!response.ok) {
            console.warn('No .env file found, using default values');
            return {};
        }
        
        const envContent = await response.text();
        const envVars = parseEnvFile(envContent);
        
        console.log('Environment variables loaded:', Object.keys(envVars));
        return envVars;
    } catch (error) {
        console.warn('Failed to load .env file:', error);
        return {};
    }
}

// Make environment variables available globally
loadEnvironmentVariables().then(envVars => {
    window.ENV_CONFIG = envVars;
    console.log('Environment config set:', window.ENV_CONFIG);
}).catch(error => {
    console.error('Failed to load environment variables:', error);
    window.ENV_CONFIG = {};
});
