// Custom error classes
class ValidationError extends Error {
    constructor(message, details = []) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class DatabaseError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DatabaseError';
        this.statusCode = 500;
        this.originalError = originalError;
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(resource = 'Resource') {
        super(`${resource} not found`);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message = 'Resource conflict') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

// Centralized error handler
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle specific error types
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json({
            error: err.message,
            details: err.details,
            type: 'validation_error'
        });
    }

    if (err instanceof DatabaseError) {
        return res.status(err.statusCode).json({
            error: 'Database operation failed',
            type: 'database_error'
        });
    }

    if (err instanceof AuthenticationError) {
        return res.status(err.statusCode).json({
            error: err.message,
            type: 'authentication_error'
        });
    }

    if (err instanceof AuthorizationError) {
        return res.status(err.statusCode).json({
            error: err.message,
            type: 'authorization_error'
        });
    }

    if (err instanceof NotFoundError) {
        return res.status(err.statusCode).json({
            error: err.message,
            type: 'not_found_error'
        });
    }

    if (err instanceof ConflictError) {
        return res.status(err.statusCode).json({
            error: err.message,
            type: 'conflict_error'
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            type: 'authentication_error'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            type: 'authentication_error'
        });
    }

    // Handle multer errors (file upload)
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        }
        return res.status(400).json({
            error: message,
            type: 'file_upload_error'
        });
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message || 'Something went wrong';

    res.status(statusCode).json({
        error: message,
        type: 'server_error',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

// Async error wrapper
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Database error handler
const handleDatabaseError = (error, operation = 'database operation') => {
    console.error(`Database error during ${operation}:`, error);
    
    // Handle specific MySQL errors
    if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Duplicate entry found');
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new ValidationError('Referenced record does not exist');
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
        throw new ValidationError('Data too long for column');
    }
    
    throw new DatabaseError(`Failed to perform ${operation}`, error);
};

module.exports = {
    ValidationError,
    DatabaseError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    errorHandler,
    asyncHandler,
    handleDatabaseError
};
