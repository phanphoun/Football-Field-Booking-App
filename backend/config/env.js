require('dotenv').config();

// Environment configuration validation
const validateEnvironment = () => {
    const requiredEnvVars = {
        NODE_ENV: ['development', 'production', 'test'],
        PORT: (value) => {
            const port = parseInt(value);
            return !isNaN(port) && port > 0 && port < 65536;
        },
        JWT_SECRET: (value) => {
            return value && value.length >= 32;
        }
    };

    const optionalEnvVars = {
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PASSWORD: '',
        DB_NAME: 'football_booking',
        CORS_ORIGIN: 'http://localhost:3000',
        MAX_FILE_SIZE: '5242880'
    };

    const errors = [];
    const warnings = [];

    // Validate required environment variables
    for (const [key, validator] of Object.entries(requiredEnvVars)) {
        const value = process.env[key];
        
        if (!value) {
            errors.push(`Missing required environment variable: ${key}`);
            continue;
        }

        if (Array.isArray(validator)) {
            if (!validator.includes(value)) {
                errors.push(`Invalid ${key}. Must be one of: ${validator.join(', ')}`);
            }
        } else if (typeof validator === 'function') {
            if (!validator(value)) {
                errors.push(`Invalid ${key}. Validation failed.`);
            }
        }
    }

    // Set default values for optional environment variables
    for (const [key, defaultValue] of Object.entries(optionalEnvVars)) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
            warnings.push(`Using default value for ${key}: ${defaultValue}`);
        }
    }

    // Security warnings for production
    if (process.env.NODE_ENV === 'production') {
        if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
            errors.push('JWT_SECRET must be changed in production');
        }

        if (process.env.DB_PASSWORD === '') {
            warnings.push('Database password is empty in production');
        }

        if (process.env.CORS_ORIGIN === 'http://localhost:3000') {
            warnings.push('CORS_ORIGIN is set to localhost in production');
        }
    }

    // Log warnings
    if (warnings.length > 0) {
        console.log('Environment warnings:');
        warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
    }

    // Log errors and exit if critical
    if (errors.length > 0) {
        console.error('Environment configuration errors:');
        errors.forEach(error => console.error(`  ❌ ${error}`));
        
        if (process.env.NODE_ENV === 'production') {
            console.error('Critical environment errors detected. Exiting...');
            process.exit(1);
        } else {
            console.warn('Environment errors detected in development mode. Please fix these before production.');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

// Configuration object
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5000,
    
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'football_booking'
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        expiresIn: '24h'
    },
    
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    },
    
    upload: {
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    },
    
    security: {
        bcryptRounds: 12,
        maxLoginAttempts: 5,
        lockoutTime: 15 * 60 * 1000 // 15 minutes
    }
};

// Validate environment on module load
const validation = validateEnvironment();

module.exports = {
    config,
    validateEnvironment,
    validation
};
