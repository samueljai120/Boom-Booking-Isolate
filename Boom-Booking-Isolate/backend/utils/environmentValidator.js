/**
 * Environment Variable Validation Utility
 * 
 * Validates all required environment variables on application startup
 * to prevent runtime configuration errors.
 */

/**
 * Environment variable validation rules
 */
const ENV_VALIDATION_RULES = {
  // Required for all environments
  NODE_ENV: {
    required: true,
    type: 'string',
    validValues: ['development', 'production', 'test'],
    description: 'Node.js environment'
  },

  // Database configuration
  DATABASE_URL: {
    required: false, // Can use individual variables instead
    type: 'string',
    pattern: /^postgresql:\/\//,
    description: 'PostgreSQL database connection string'
  },

  // Individual database variables (fallback)
  POSTGRES_HOST: {
    required: false,
    type: 'string',
    description: 'PostgreSQL host (fallback if DATABASE_URL not set)'
  },

  POSTGRES_PORT: {
    required: false,
    type: 'number',
    description: 'PostgreSQL port (fallback if DATABASE_URL not set)'
  },

  POSTGRES_DB: {
    required: false,
    type: 'string',
    description: 'PostgreSQL database name (fallback if DATABASE_URL not set)'
  },

  POSTGRES_USER: {
    required: false,
    type: 'string',
    description: 'PostgreSQL username (fallback if DATABASE_URL not set)'
  },

  POSTGRES_PASSWORD: {
    required: false,
    type: 'string',
    description: 'PostgreSQL password (fallback if DATABASE_URL not set)'
  },

  // Security
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32,
    description: 'JWT signing secret (must be at least 32 characters)'
  },

  // Server configuration
  PORT: {
    required: false,
    type: 'number',
    default: 5000,
    description: 'Server port'
  },

  CORS_ORIGIN: {
    required: false,
    type: 'string',
    description: 'CORS allowed origins (comma-separated)'
  }
};

/**
 * Validation error class
 */
class EnvironmentValidationError extends Error {
  constructor(message, missing = [], invalid = []) {
    super(message);
    this.name = 'EnvironmentValidationError';
    this.missing = missing;
    this.invalid = invalid;
  }
}

/**
 * Validate a single environment variable
 */
function validateEnvVar(key, rule) {
  const value = process.env[key];
  const errors = [];

  // Check if required
  if (rule.required && (!value || value.trim() === '')) {
    errors.push(`Missing required environment variable: ${key}`);
    return { valid: false, errors, value };
  }

  // Skip validation if not required and not set
  if (!rule.required && (!value || value.trim() === '')) {
    return { valid: true, errors: [], value: rule.default || null };
  }

  // Type validation
  if (rule.type === 'number') {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      errors.push(`${key} must be a valid number, got: ${value}`);
    }
  }

  // String length validation
  if (rule.type === 'string' && rule.minLength && value.length < rule.minLength) {
    errors.push(`${key} must be at least ${rule.minLength} characters long`);
  }

  // Valid values validation
  if (rule.validValues && !rule.validValues.includes(value)) {
    errors.push(`${key} must be one of: ${rule.validValues.join(', ')}, got: ${value}`);
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    errors.push(`${key} must match pattern: ${rule.pattern}`);
  }

  return { valid: errors.length === 0, errors, value };
}

/**
 * Validate all environment variables
 */
export function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  
  const missing = [];
  const invalid = [];
  const validated = {};

  // Validate each environment variable
  for (const [key, rule] of Object.entries(ENV_VALIDATION_RULES)) {
    const result = validateEnvVar(key, rule);
    
    if (!result.valid) {
      if (!process.env[key] && rule.required) {
        missing.push({ key, rule, errors: result.errors });
      } else {
        invalid.push({ key, rule, errors: result.errors, value: result.value });
      }
    } else {
      validated[key] = result.value;
    }
  }

  // Special validation for database configuration
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_HOST) {
    missing.push({
      key: 'DATABASE_CONFIG',
      rule: { description: 'Either DATABASE_URL or POSTGRES_HOST must be set' },
      errors: ['Database configuration is required']
    });
  }

  // Report validation results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(({ key, rule, errors }) => {
      console.error(`   - ${key}: ${rule.description}`);
      errors.forEach(error => console.error(`     ${error}`));
    });
  }

  if (invalid.length > 0) {
    console.error('❌ Invalid environment variables:');
    invalid.forEach(({ key, rule, errors, value }) => {
      console.error(`   - ${key}: ${rule.description}`);
      errors.forEach(error => console.error(`     ${error}`));
      if (value !== undefined) {
        console.error(`     Current value: ${value}`);
      }
    });
  }

  if (missing.length > 0 || invalid.length > 0) {
    const errorMessage = `Environment validation failed: ${missing.length} missing, ${invalid.length} invalid`;
    
    if (process.env.NODE_ENV === 'production') {
      throw new EnvironmentValidationError(errorMessage, missing, invalid);
    } else {
      console.warn(`⚠️ ${errorMessage}`);
      console.warn('⚠️ Application may not function correctly');
    }
  }

  // Report successful validation
  console.log('✅ Environment validation passed');
  console.log(`📊 Validated ${Object.keys(validated).length} environment variables`);
  
  // Log important configuration (without sensitive data)
  console.log('🔧 Environment Configuration:');
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - PORT: ${process.env.PORT || '5000'}`);
  console.log(`   - Database: ${process.env.DATABASE_URL ? 'DATABASE_URL set' : 'Individual variables'}`);
  console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
  console.log(`   - CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'Not set'}`);

  return validated;
}

/**
 * Generate environment file template
 */
export function generateEnvTemplate() {
  console.log('📝 Environment file template:');
  console.log('');
  
  const template = Object.entries(ENV_VALIDATION_RULES)
    .map(([key, rule]) => {
      const comment = `# ${rule.description}`;
      const required = rule.required ? ' (REQUIRED)' : ' (optional)';
      const example = rule.default ? `=${rule.default}` : '=your-value-here';
      
      return `${comment}${required}\n${key}${example}`;
    })
    .join('\n\n');

  console.log(template);
  console.log('');
  console.log('# Additional optional variables:');
  console.log('CORS_ORIGIN=http://localhost:3000,https://yourdomain.com');
  console.log('LOG_LEVEL=info');
  console.log('BCRYPT_ROUNDS=12');
  console.log('RATE_LIMIT_WINDOW_MS=900000');
  console.log('RATE_LIMIT_MAX_REQUESTS=100');
}

/**
 * Check environment on startup
 */
export function checkEnvironment() {
  try {
    validateEnvironment();
    return true;
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      console.error('🚨 Environment validation failed:');
      console.error(error.message);
      
      if (error.missing.length > 0) {
        console.error('\n📋 Missing variables:');
        error.missing.forEach(({ key }) => console.error(`   - ${key}`));
      }
      
      if (error.invalid.length > 0) {
        console.error('\n❌ Invalid variables:');
        error.invalid.forEach(({ key }) => console.error(`   - ${key}`));
      }
      
      console.error('\n💡 Run generateEnvTemplate() to see required variables');
    }
    
    return false;
  }
}

export default {
  validateEnvironment,
  generateEnvTemplate,
  checkEnvironment,
  ENV_VALIDATION_RULES
};
