#!/usr/bin/env node

/**
 * Secure Secret Generator for Cricket Trading Platform
 * 
 * This script generates secure random secrets for environment variables.
 * Run with: node scripts/generate-secrets.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the string in bytes (will be converted to hex)
 * @param {string} type - Type of secret ('hex', 'base64', 'base64url')
 * @returns {string} Secure random string
 */
function generateSecureSecret(length = 32, type = 'hex') {
  const bytes = crypto.randomBytes(length);
  
  switch (type) {
    case 'base64':
      return bytes.toString('base64');
    case 'base64url':
      return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    case 'hex':
    default:
      return bytes.toString('hex');
  }
}

/**
 * Calculate entropy bits for a given secret
 * @param {string} secret - The secret string
 * @param {string} encoding - Encoding type ('hex', 'base64', 'ascii')
 * @returns {number} Entropy in bits
 */
function calculateEntropy(secret, encoding = 'hex') {
  let possibleChars;
  
  switch (encoding) {
    case 'hex':
      possibleChars = 16; // 0-9, a-f
      break;
    case 'base64':
      possibleChars = 64; // A-Z, a-z, 0-9, +, /
      break;
    case 'ascii':
      possibleChars = 95; // Printable ASCII characters
      break;
    default:
      possibleChars = 256; // Assume byte values
  }
  
  const length = Buffer.from(secret, encoding === 'hex' ? 'hex' : 'utf8').length;
  return Math.log2(Math.pow(possibleChars, length));
}

/**
 * Generate all required secrets for the application
 */
function generateAllSecrets() {
  console.log(`${colors.bright}${colors.cyan}🔐 Generating Secure Secrets for Cricket Trading Platform${colors.reset}\n`);
  
  const secrets = {
    // Critical security secrets (64+ bytes recommended for production)
    JWT_SECRET: {
      value: generateSecureSecret(64, 'hex'),
      description: 'JWT token signing secret',
      minEntropy: 256,
      critical: true
    },
    
    ENCRYPTION_KEY: {
      value: generateSecureSecret(32, 'hex'),
      description: 'Encryption key for sensitive data',
      minEntropy: 128,
      critical: true
    },
    
    // API keys (generate placeholder if needed)
    RAPIDAPI_KEY: {
      value: 'your-rapidapi-key-here',
      description: 'RapidAPI key for cricket data',
      minEntropy: 0,
      critical: false
    },
    
    BETFAIR_APP_KEY: {
      value: 'your-betfair-app-key-here',
      description: 'Betfair application key',
      minEntropy: 0,
      critical: false
    },
    
    BETFAIR_SESSION_TOKEN: {
      value: 'your-betfair-session-token-here',
      description: 'Betfair session token',
      minEntropy: 0,
      critical: false
    },
    
    // Database passwords (if needed)
    MONGODB_PASSWORD: {
      value: generateSecureSecret(24, 'base64url'),
      description: 'MongoDB password (if using auth)',
      minEntropy: 144,
      critical: true
    },
    
    REDIS_PASSWORD: {
      value: generateSecureSecret(24, 'base64url'),
      description: 'Redis password (if using auth)',
      minEntropy: 144,
      critical: true
    }
  };
  
  // Calculate and display entropy for each secret
  console.log(`${colors.bright}Generated Secrets:${colors.reset}\n`);
  
  Object.entries(secrets).forEach(([key, secret]) => {
    const entropy = calculateEntropy(secret.value, key.includes('hex') ? 'hex' : 'ascii');
    const entropyColor = entropy >= secret.minEntropy ? colors.green : colors.red;
    const criticalIcon = secret.critical ? '🔴' : '🔵';
    
    console.log(`${criticalIcon} ${colors.bright}${key}${colors.reset}`);
    console.log(`   ${colors.yellow}Description:${colors.reset} ${secret.description}`);
    console.log(`   ${colors.yellow}Value:${colors.reset} ${secret.value}`);
    console.log(`   ${colors.yellow}Entropy:${colors.reset} ${entropyColor}${entropy.toFixed(1)} bits${colors.reset}`);
    
    if (secret.critical && entropy < secret.minEntropy) {
      console.log(`   ${colors.red}⚠️  Warning: Entropy below recommended ${secret.minEntropy} bits${colors.reset}`);
    }
    
    console.log();
  });
  
  // Generate .env file content
  const envContent = generateEnvFile(secrets);
  
  // Ask user if they want to save to .env file
  console.log(`${colors.bright}${colors.magenta}📁 Save to .env file?${colors.reset}`);
  console.log(`${colors.yellow}The following .env file will be created:${colors.reset}\n`);
  console.log(envContent);
  
  // In a real script, you would prompt the user
  // For now, we'll just write to a .env.generated file
  const envPath = path.join(__dirname, '..', '.env.generated');
  fs.writeFileSync(envPath, envContent);
  
  console.log(`\n${colors.green}✅ Generated secrets saved to: ${envPath}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Review the file and copy values to your actual .env file${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Never commit .env files to version control!${colors.reset}`);
  
  return secrets;
}

/**
 * Generate .env file content from secrets
 */
function generateEnvFile(secrets) {
  let content = `# ============================================\n`;
  content += `# Cricket Trading Platform - Generated Secrets\n`;
  content += `# Generated: ${new Date().toISOString()}\n`;
  content += `# ============================================\n\n`;
  
  // Add critical secrets first
  content += `# ==================== SECURITY CRITICAL ====================\n`;
  Object.entries(secrets)
    .filter(([_, secret]) => secret.critical)
    .forEach(([key, secret]) => {
      content += `# ${secret.description}\n`;
      content += `${key}=${secret.value}\n\n`;
    });
  
  // Add non-critical secrets
  content += `# ==================== EXTERNAL API KEYS ====================\n`;
  Object.entries(secrets)
    .filter(([_, secret]) => !secret.critical && key !== 'MONGODB_PASSWORD' && key !== 'REDIS_PASSWORD')
    .forEach(([key, secret]) => {
      content += `# ${secret.description}\n`;
      content += `${key}=${secret.value}\n\n`;
    });
  
  // Add database passwords if they're not placeholders
  const hasDbPasswords = secrets.MONGODB_PASSWORD && !secrets.MONGODB_PASSWORD.value.includes('your-') &&
                        secrets.REDIS_PASSWORD && !secrets.REDIS_PASSWORD.value.includes('your-');
  
  if (hasDbPasswords) {
    content += `# ==================== DATABASE PASSWORDS ====================\n`;
    content += `# MongoDB password (update MONGODB_URI if using)\n`;
    content += `MONGODB_PASSWORD=${secrets.MONGODB_PASSWORD.value}\n\n`;
    content += `# Redis password (update REDIS_URL if using)\n`;
    content += `REDIS_PASSWORD=${secrets.REDIS_PASSWORD.value}\n\n`;
  }
  
  content += `# ==================== SECURITY NOTES ====================\n`;
  content += `# 1. Store this file securely and never commit to version control\n`;
  content += `# 2. Rotate secrets regularly (especially JWT_SECRET)\n`;
  content += `# 3. Use different secrets for development, staging, and production\n`;
  content += `# 4. Consider using a secrets manager in production\n`;
  
  return content;
}

/**
 * Validate existing .env file
 */
function validateEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠️  No .env file found at ${envPath}${colors.reset}`);
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  
  console.log(`${colors.bright}${colors.cyan}🔍 Validating .env file${colors.reset}\n`);
  
  let hasIssues = false;
  
  lines.forEach(line => {
    const [key, value] = line.split('=').map(part => part.trim());
    
    if (!key || !value) return;
    
    // Check for common issues
    if (key === 'JWT_SECRET') {
      if (value.length < 32) {
        console.log(`${colors.red}❌ JWT_SECRET is too short (${value.length} chars, minimum 32)${colors.reset}`);
        hasIssues = true;
      }
      
      if (value.includes('development') || value.includes('local') || value.includes('secret')) {
        console.log(`${colors.yellow}⚠️  JWT_SECRET may contain weak keywords${colors.reset}`);
      }
      
      const entropy = calculateEntropy(value, 'ascii');
      if (entropy < 128) {
        console.log(`${colors.yellow}⚠️  JWT_SECRET entropy is low (${entropy.toFixed(1)} bits)${colors.reset}`);
      }
    }
    
    if (key === 'MONGODB_URI' && value.includes('localhost')) {
      console.log(`${colors.yellow}⚠️  MONGODB_URI points to localhost${colors.reset}`);
    }
    
    if (value.includes('put-') || value.includes('replace-') || value.includes('your-')) {
      console.log(`${colors.red}❌ ${key} appears to have a placeholder value${colors.reset}`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues) {
    console.log(`${colors.green}✅ .env file validation passed${colors.reset}`);
  }
  
  return !hasIssues;
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'validate':
      validateEnvFile();
      break;
    case 'generate':
    default:
      generateAllSecrets();
      break;
  }
}

module.exports = {
  generateSecureSecret,
  calculateEntropy,
  generateAllSecrets,
  validateEnvFile
};