import express from 'express';
import configImportExportController from '../controllers/configImportExportController.js';
import { logger } from '../services/logger.js';

const router = express.Router();

/**
 * 配置导入导出路由
 */

// 导出配置
router.get('/export', (req, res) => {
    logger.info('Config export route accessed');
    configImportExportController.exportConfig(req, res);
});

// 导入配置
router.post('/import', configImportExportController.upload.single('configFile'), (req, res) => {
    logger.info('Config import route accessed');
    configImportExportController.importConfig(req, res);
});

/**
 * WebDAV 备份相关路由
 */

// 检查WebDAV连接状态
router.get('/webdav/status', (req, res) => {
    logger.info('WebDAV status check route accessed');
    configImportExportController.checkWebDAVStatus(req, res);
});

// 备份到WebDAV
router.post('/webdav/backup', (req, res) => {
    logger.info('WebDAV backup route accessed');
    configImportExportController.backupToWebDAV(req, res);
});

// 列出WebDAV备份
router.get('/webdav/backups', (req, res) => {
    logger.info('WebDAV backup list route accessed');
    configImportExportController.listWebDAVBackups(req, res);
});

// 从WebDAV恢复配置
router.post('/webdav/restore/:fileName', (req, res) => {
    logger.info('WebDAV restore route accessed');
    configImportExportController.restoreFromWebDAV(req, res);
});

// 删除WebDAV备份
router.delete('/webdav/backups/:fileName', (req, res) => {
    logger.info('WebDAV backup deletion route accessed');
    configImportExportController.deleteWebDAVBackup(req, res);
});

// 清理旧备份
router.post('/webdav/cleanup', (req, res) => {
    logger.info('WebDAV cleanup route accessed');
    configImportExportController.cleanupOldBackups(req, res);
});

/**
 * 错误处理中间件
 */
router.use((error, req, res, next) => {
    logger.error('Config Import/Export API Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            message: 'Configuration file must be smaller than 10MB',
            timestamp: new Date().toISOString()
        });
    }
    
    if (error.message === 'Only JSON files are allowed') {
        return res.status(400).json({
            error: 'Invalid file type',
            message: 'Only JSON files are allowed for configuration import',
            timestamp: new Date().toISOString()
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

export default router;