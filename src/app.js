import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import config from './config/index.js';
import { logger } from './services/logger.js';
import apiRoutes from './routes/api.js';
import transportRoutes from './routes/transport.js';
import { transportService } from './services/transportService.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

/**
 * 应用程序配置
 */
class App {
    constructor() {
        this.app = express();
        this.port = config.server.port;
        this.server = null;
        this.wss = null;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandlers();
    }

    /**
     * 设置中间件
     */
    setupMiddleware() {
        // 安全中间件
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS配置
        this.app.use(cors({
            origin: config.cors.origin,
            credentials: true,
            optionsSuccessStatus: 200
        }));

        // 压缩响应
        this.app.use(compression());

        // 解析JSON和URL编码数据
        this.app.use(express.json({ limit: config.server.bodyLimit }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: config.server.bodyLimit 
        }));

        // 请求日志
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }

    /**
     * 设置路由
     */
    setupRoutes() {
        // API 路由
        logger.info('Mounting API routes at /api');
        this.app.use('/api', apiRoutes);

        // 传输层路由 - SSE, HTTP JSON-RPC
        logger.info('Mounting transport routes');
        this.app.use('/', transportRoutes);

        // 静态文件服务
        const publicDir = path.join(__dirname, '../public');
        logger.info('Setting up static file serving from:', publicDir);
        this.app.use(express.static(publicDir, {
            maxAge: config.server.staticMaxAge,
            etag: true,
            lastModified: true
        }));

        // SPA路由 - 为所有其他路由提供index.html
        this.app.get('*', (req, res) => {
            logger.debug('Serving index.html for:', req.path);
            res.sendFile(path.join(publicDir, 'index.html'));
        });
    }

    /**
     * 设置错误处理器
     */
    setupErrorHandlers() {
        // 404处理器
        this.app.use(notFoundHandler);

        // 全局错误处理器
        this.app.use(errorHandler);
    }

    /**
     * 启动服务器
     */
    async start() {
        try {
            this.server = this.app.listen(this.port, () => {
                logger.info(`MCP Manager running at http://localhost:${this.port}`, {
                    environment: config.app.environment,
                    nodeVersion: process.version,
                    platform: process.platform
                });
                
                logger.info('Available routes:', {
                    api: [
                        'GET  /api/health',
                        'GET  /api/test',
                        'GET  /api/cursor-config',
                        'GET  /api/claude-config',
                        'GET  /api/tools',
                        'GET  /api/tools/:serverName',
                        'POST /api/save-configs',
                        'POST /api/tools/call'
                    ],
                    transport: [
                        'GET  /sse',
                        'POST /sse/rpc',
                        'POST /mcp',
                        'WS   /ws',
                        'GET  /transport/stats',
                        'GET  /transport/health',
                        'GET  /transport/info'
                    ],
                    static: ['/*']
                });
            });

            // 初始化WebSocket服务器
            logger.info('Initializing WebSocket server...');
            this.wss = transportService.initializeWebSocketServer(this.server);

            // 优雅关闭
            process.on('SIGTERM', () => {
                logger.info('SIGTERM received, shutting down gracefully...');
                this.gracefulShutdown();
            });

            process.on('SIGINT', () => {
                logger.info('SIGINT received, shutting down gracefully...');
                this.gracefulShutdown();
            });

            return this.server;
        } catch (error) {
            logger.error('Failed to start server:', error);
            throw error;
        }
    }

    /**
     * 优雅关闭服务器
     */
    gracefulShutdown() {
        logger.info('Starting graceful shutdown...');
        
        // 清理传输层连接
        if (transportService) {
            transportService.cleanup();
        }
        
        // 关闭服务器
        if (this.server) {
            this.server.close(() => {
                logger.info('HTTP server closed.');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }

    /**
     * 获取Express应用实例
     */
    getApp() {
        return this.app;
    }
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    const app = new App();
    app.start().catch(error => {
        logger.error('Failed to start application:', error);
        process.exit(1);
    });
}

export default App;