import { logger } from '../services/logger.js';
import { AppError, ValidationError, ConfigError, FileError, McpError } from '../utils/errors.js';

/**
 * 404错误处理器
 */
export function notFoundHandler(req, res, next) {
    logger.warn(`404 - Not Found: ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
        path: req.path
    });
}

/**
 * 全局错误处理器
 */
export function errorHandler(error, req, res, next) {
    // 如果响应已经发送，则交给Express默认错误处理器
    if (res.headersSent) {
        return next(error);
    }

    // 记录错误
    logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // 根据错误类型设置状态码和响应
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = {};

    if (error instanceof ValidationError) {
        statusCode = 400;
        message = 'Validation Error';
        details = { 
            field: error.field, 
            value: error.value 
        };
    } else if (error instanceof ConfigError) {
        statusCode = 400;
        message = 'Configuration Error';
    } else if (error instanceof FileError) {
        statusCode = 500;
        message = 'File Operation Error';
        details = { 
            filePath: error.filePath 
        };
    } else if (error instanceof McpError) {
        statusCode = 502;
        message = 'MCP Server Error';
    } else if (error instanceof AppError) {
        statusCode = error.statusCode || 500;
        message = error.message;
    } else if (error.name === 'SyntaxError' && error.status === 400) {
        // JSON解析错误
        statusCode = 400;
        message = 'Invalid JSON';
    } else if (error.code === 'ENOENT') {
        statusCode = 404;
        message = 'File not found';
    } else if (error.code === 'EACCES') {
        statusCode = 403;
        message = 'Permission denied';
    }

    // 构建错误响应
    const errorResponse = {
        error: message,
        message: error.message || message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        ...details
    };

    // 在开发环境中包含堆栈跟踪
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    res.status(statusCode).json(errorResponse);
}

/**
 * 异步错误包装器
 * 用于包装异步路由处理器，自动捕获Promise rejection
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 验证中间件工厂
 */
export function validate(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            const validationError = new ValidationError(
                error.details[0].message,
                error.details[0].path[0],
                error.details[0].context?.value
            );
            return next(validationError);
        }
        next();
    };
}

/**
 * 速率限制错误处理器
 */
export function rateLimitHandler(req, res) {
    logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
    });

    res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString(),
        retryAfter: req.rateLimit?.resetTime
    });
}