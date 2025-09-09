/**
 * Simple Logging Service
 * @fileoverview 简化的日志管理服务，无需外部依赖
 */

/**
 * 日志级别
 */
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    VERBOSE: 4
};

/**
 * 简化的日志记录器类
 */
class SimpleLogger {
    constructor() {
        this.level = LOG_LEVELS.INFO;
    }

    /**
     * 格式化时间戳
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * 格式化日志消息
     */
    formatMessage(level, message, meta = {}) {
        const timestamp = this.getTimestamp();
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    }

    /**
     * 记录错误信息
     */
    error(message, meta = {}) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this.formatMessage('ERROR', message, meta));
        }
    }

    /**
     * 记录警告信息
     */
    warn(message, meta = {}) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this.formatMessage('WARN', message, meta));
        }
    }

    /**
     * 记录信息
     */
    info(message, meta = {}) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this.formatMessage('INFO', message, meta));
        }
    }

    /**
     * 记录调试信息
     */
    debug(message, meta = {}) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(this.formatMessage('DEBUG', message, meta));
        }
    }

    /**
     * 记录详细信息
     */
    verbose(message, meta = {}) {
        if (this.level >= LOG_LEVELS.VERBOSE) {
            console.log(this.formatMessage('VERBOSE', message, meta));
        }
    }

    /**
     * 记录 HTTP 请求
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
export const logger = new SimpleLogger();
export default logger;