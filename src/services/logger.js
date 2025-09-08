/**
 * Logging Service
 * @fileoverview 日志管理服务
 */

import winston from 'winston';
import path from 'path';
import { config } from '../config/index.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * 自定义日志格式
 */
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * 创建日志记录器
 */
class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: combine(
        errors({ stack: true }),
        timestamp(),
        customFormat
      ),
      defaultMeta: { service: 'mcp-manager' },
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: combine(
            colorize(),
            customFormat
          ),
        }),
        
        // 错误日志文件
        new winston.transports.File({
          filename: path.join(config.paths.logs, 'error.log'),
          level: 'error',
          maxFiles: config.logging.maxFiles,
          maxsize: config.logging.maxSize,
        }),
        
        // 组合日志文件
        new winston.transports.File({
          filename: path.join(config.paths.logs, 'combined.log'),
          maxFiles: config.logging.maxFiles,
          maxsize: config.logging.maxSize,
        }),
      ],
    });

    // 在开发环境中禁用控制台警告
    if (config.server.nodeEnv === 'development') {
      this.logger.exceptions.handle(
        new winston.transports.Console({
          format: combine(
            colorize(),
            customFormat
          ),
        })
      );
    }
  }

  /**
   * 记录错误信息
   * @param {string|Error} message - 错误消息或错误对象
   * @param {Object} meta - 附加元数据
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * 记录警告信息
   * @param {string} message - 警告消息
   * @param {Object} meta - 附加元数据
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * 记录信息
   * @param {string} message - 信息消息
   * @param {Object} meta - 附加元数据
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * 记录调试信息
   * @param {string} message - 调试消息
   * @param {Object} meta - 附加元数据
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * 记录详细信息
   * @param {string} message - 详细消息
   * @param {Object} meta - 附加元数据
   */
  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  /**
   * 记录 HTTP 请求
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @param {number} duration - 请求处理时间（毫秒）
   */
  logRequest(req, res, duration) {
    const { method, url, ip } = req;
    const { statusCode } = res;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    this.info('HTTP Request', {
      method,
      url,
      ip,
      statusCode,
      duration: `${duration}ms`,
      userAgent,
    });
  }

  /**
   * 记录 MCP 操作
   * @param {string} operation - 操作类型
   * @param {string} serverName - 服务器名称
   * @param {Object} details - 操作详情
   */
  logMcpOperation(operation, serverName, details = {}) {
    this.info('MCP Operation', {
      operation,
      serverName,
      ...details,
    });
  }

  /**
   * 记录配置变更
   * @param {string} action - 动作类型
   * @param {Object} changes - 变更内容
   */
  logConfigChange(action, changes = {}) {
    this.info('Configuration Change', {
      action,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 创建子日志记录器
   * @param {string} module - 模块名称
   * @returns {Object} 子日志记录器
   */
  child(module) {
    return {
      error: (message, meta = {}) => this.error(message, { module, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { module, ...meta }),
      info: (message, meta = {}) => this.info(message, { module, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { module, ...meta }),
      verbose: (message, meta = {}) => this.verbose(message, { module, ...meta }),
    };
  }
}

// 创建全局日志实例
const logger = new Logger();

export default logger;