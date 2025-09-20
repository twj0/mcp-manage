import express from 'express';
import configController from '../controllers/configController.js';
import toolController from '../controllers/toolController.js';
import configImportExportRoutes from './configImportExport.js';
import { logger } from '../services/logger.js';

const router = express.Router();

/**
 * 配置相关路由
 */
// 获取Cursor配置
router.get('/cursor-config', (req, res) => configController.getCursorConfig(req, res));

// 获取Claude配置
router.get('/claude-config', (req, res) => configController.getClaudeConfig(req, res));

// 保存配置
router.post('/save-configs', (req, res) => configController.saveConfigs(req, res));

/**
 * 工具相关路由
 */
// 获取所有工具
router.get('/tools', (req, res) => toolController.getTools(req, res));

// 获取特定服务器的工具
router.get('/tools/:serverName', (req, res) => toolController.getServerTools(req, res));

// 调用工具
router.post('/tools/call', (req, res) => toolController.callTool(req, res));

/**
 * 配置导入导出路由
 */
router.use('/config', configImportExportRoutes);

/**
 * 健康检查和测试路由
 */
router.get('/health', (req, res) => {
    logger.info('Health check requested');
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

router.get('/test', (req, res) => {
    logger.info('Test endpoint called');
    res.json({ 
        message: 'MCP Manager API is working!',
        timestamp: new Date().toISOString()
    });
});

/**
 * 错误处理中间件
 */
router.use((error, req, res, next) => {
    logger.error('API Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

export default router;