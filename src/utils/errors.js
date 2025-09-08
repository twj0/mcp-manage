/**
 * Error Handling Utilities
 * @fileoverview 错误处理工具
 */

import logger from '../services/logger.js';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * MCP 相关错误
 */
export class McpError extends AppError {
  constructor(message, serverName = null, operation = null) {
    super(message, 500);
    this.serverName = serverName;
    this.operation = operation;
    this.type = 'MCP_ERROR';
  }
}

/**
 * 配置错误
 */
export class ConfigError extends AppError {
  constructor(message, configPath = null) {
    super(message, 400);
    this.configPath = configPath;
    this.type = 'CONFIG_ERROR';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'VALIDATION_ERROR';
  }
}

/**
 * 异步错误捕获装饰器
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function globalErrorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 记录错误
  logger.error('Global Error Handler', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // 生产环境返回简化错误信息
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // 未知错误
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
}

/**
 * 404 错误处理
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
export function notFoundHandler(req, res, next) {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
}

/**
 * 进程错误处理
 */
export function setupProcessErrorHandlers() {
  // 未捕获的异常
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

  // 未处理的 Promise 拒绝
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection! Shutting down...', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

  // SIGTERM 信号处理
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Graceful shutdown...');
    process.exit(0);
  });

  // SIGINT 信号处理 (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Graceful shutdown...');
    process.exit(0);
  });
}

/**
 * 验证错误处理
 * @param {Object} error - Joi 验证错误
 * @returns {ValidationError} 格式化的验证错误
 */
export function handleValidationError(error) {
  const errors = error.details.map(detail => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

  return new ValidationError('Validation failed', errors);
}

/**
 * 安全地解析 JSON
 * @param {string} jsonString - JSON 字符串
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析结果或默认值
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logger.warn('JSON Parse Error', {
      error: error.message,
      input: jsonString?.substring(0, 100) + '...',
    });
    return defaultValue;
  }
}

/**
 * 重试机制
 * @param {Function} fn - 要重试的函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} 执行结果
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        logger.error('Retry failed after maximum attempts', {
          attempts: maxRetries + 1,
          error: error.message,
        });
        throw error;
      }

      logger.warn('Retry attempt failed', {
        attempt: i + 1,
        maxRetries: maxRetries + 1,
        error: error.message,
        nextRetryIn: `${delay}ms`,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // 指数退避
    }
  }

  throw lastError;
}