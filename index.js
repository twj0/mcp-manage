#!/usr/bin/env node

/**
 * MCP Manager 应用程序入口点
 * 这是应用程序的主要启动文件
 */

import App from './src/app.js';
import { logger } from './src/services/logger.js';
import config from './src/config/index.js';

// 未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // 应用程序特定的日志记录、抛出错误或其他逻辑
});

// 未捕获的异常
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
});

// 启动应用程序
async function startApplication() {
    try {
        logger.info('Starting MCP Manager Application...', {
            version: config.app.version,
            environment: config.app.environment,
            nodeVersion: process.version
        });

        const app = new App();
        await app.start();

        logger.info('Application started successfully');
    } catch (error) {
        logger.error('Failed to start application:', error);
        process.exit(1);
    }
}

// 启动应用程序
startApplication();