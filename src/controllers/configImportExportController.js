import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { logger } from '../services/logger.js';
import webdavService from '../services/webdavService.js';
import { ConfigError, AppError } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB限制
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Only JSON files are allowed'), false);
        }
    }
});

/**
 * 配置导入导出控制器
 */
class ConfigImportExportController {
    constructor() {
        this.configPaths = this.getConfigPaths();
        this.upload = upload;
    }

    /**
     * 根据操作系统获取配置文件路径
     */
    getConfigPaths() {
        const home = process.env.HOME || process.env.USERPROFILE;
        const isMac = process.platform === 'darwin';
        
        if (isMac) {
            return {
                CURSOR_CONFIG_PATH: path.join(home, 'Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
                CLAUDE_CONFIG_PATH: path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json'),
                LOCAL_CONFIG_PATH: path.join(__dirname, '../../config.json')
            };
        } else if (process.platform === 'win32') {
            return {
                CURSOR_CONFIG_PATH: path.join(home, 'AppData/Roaming/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
                CLAUDE_CONFIG_PATH: path.join(home, 'AppData/Roaming/Claude/claude_desktop_config.json'),
                LOCAL_CONFIG_PATH: path.join(__dirname, '../../config.json')
            };
        } else {
            // Linux paths
            return {
                CURSOR_CONFIG_PATH: path.join(home, '.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
                CLAUDE_CONFIG_PATH: path.join(home, '.config/Claude/claude_desktop_config.json'),
                LOCAL_CONFIG_PATH: path.join(__dirname, '../../config.json')
            };
        }
    }

    /**
     * 验证配置格式
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new ConfigError('Invalid configuration format');
        }

        if (!config.mcpServers || typeof config.mcpServers !== 'object') {
            throw new ConfigError('Configuration must contain mcpServers object');
        }

        // 验证每个服务器配置
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
            if (!serverConfig.command) {
                throw new ConfigError(`Server "${serverName}" missing required "command" field`);
            }

            if (!Array.isArray(serverConfig.args)) {
                throw new ConfigError(`Server "${serverName}" "args" must be an array`);
            }

            if (serverConfig.env && typeof serverConfig.env !== 'object') {
                throw new ConfigError(`Server "${serverName}" "env" must be an object`);
            }
        }

        return true;
    }

    /**
     * 读取配置文件
     */
    async readConfigFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return { mcpServers: {} };
            }
            throw new AppError(`Failed to read config file: ${filePath}`, 500);
        }
    }

    /**
     * 导出配置
     */
    async exportConfig(req, res) {
        try {
            logger.info('Handling config export request');

            const { format = 'json', includeDisabled = true } = req.query;

            // 读取所有配置
            const localConfig = await this.readConfigFile(this.configPaths.LOCAL_CONFIG_PATH);
            const cursorConfig = await this.readConfigFile(this.configPaths.CURSOR_CONFIG_PATH);
            const claudeConfig = await this.readConfigFile(this.configPaths.CLAUDE_CONFIG_PATH);

            // 合并配置
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    platform: process.platform,
                    nodeVersion: process.version
                },
                configurations: {
                    local: localConfig,
                    cursor: cursorConfig,
                    claude: claudeConfig
                }
            };

            // 过滤禁用的服务器（如果需要）
            if (!includeDisabled) {
                for (const configType of ['local', 'cursor', 'claude']) {
                    const config = exportData.configurations[configType];
                    if (config.mcpServers) {
                        const filteredServers = {};
                        for (const [name, server] of Object.entries(config.mcpServers)) {
                            if (!server.disabled) {
                                filteredServers[name] = server;
                            }
                        }
                        config.mcpServers = filteredServers;
                    }
                }
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `mcp-config-export-${timestamp}.json`;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json(exportData);

            logger.info('Configuration exported successfully');
        } catch (error) {
            logger.error('Error exporting config:', error);
            res.status(500).json({
                error: 'Failed to export configuration',
                message: error.message
            });
        }
    }

    /**
     * 导入配置
     */
    async importConfig(req, res) {
        try {
            logger.info('Handling config import request');

            if (!req.file) {
                throw new ConfigError('No configuration file provided');
            }

            const configData = JSON.parse(req.file.buffer.toString('utf8'));
            
            // 验证配置格式
            let importConfig;
            if (configData.configurations) {
                // 新格式的导出文件
                importConfig = configData.configurations.local || configData.configurations.cursor || configData.configurations.claude;
            } else {
                // 直接的配置格式
                importConfig = configData;
            }

            this.validateConfig(importConfig);

            const { overwrite = false, backup = true } = req.body;

            // 创建备份（如果需要）
            if (backup) {
                try {
                    const currentConfig = await this.readConfigFile(this.configPaths.LOCAL_CONFIG_PATH);
                    await webdavService.autoBackup(currentConfig);
                } catch (backupError) {
                    logger.warn('Failed to create backup before import:', backupError);
                }
            }

            let finalConfig;
            if (overwrite) {
                // 完全覆盖
                finalConfig = importConfig;
            } else {
                // 合并配置
                const currentConfig = await this.readConfigFile(this.configPaths.LOCAL_CONFIG_PATH);
                finalConfig = {
                    mcpServers: {
                        ...currentConfig.mcpServers,
                        ...importConfig.mcpServers
                    }
                };
            }

            // 保存配置到所有位置
            await this.saveConfigToAllLocations(finalConfig);

            const importedServers = Object.keys(importConfig.mcpServers || {});
            logger.info(`Successfully imported ${importedServers.length} server configurations`);

            res.json({
                success: true,
                message: `Successfully imported ${importedServers.length} server configurations`,
                importedServers,
                overwrite,
                backup
            });
        } catch (error) {
            logger.error('Error importing config:', error);
            res.status(500).json({
                error: 'Failed to import configuration',
                message: error.message
            });
        }
    }

    /**
     * 保存配置到所有位置
     */
    async saveConfigToAllLocations(config) {
        // 保存到本地配置
        await fs.writeFile(this.configPaths.LOCAL_CONFIG_PATH, JSON.stringify(config, null, 2));

        // 保存到Cursor配置
        const cursorDir = path.dirname(this.configPaths.CURSOR_CONFIG_PATH);
        await fs.mkdir(cursorDir, { recursive: true });
        await fs.writeFile(this.configPaths.CURSOR_CONFIG_PATH, JSON.stringify(config, null, 2));

        // 保存过滤后的配置到Claude
        const filteredConfig = this.filterDisabledServers(config);
        const claudeDir = path.dirname(this.configPaths.CLAUDE_CONFIG_PATH);
        await fs.mkdir(claudeDir, { recursive: true });
        await fs.writeFile(this.configPaths.CLAUDE_CONFIG_PATH, JSON.stringify(filteredConfig, null, 2));
    }

    /**
     * 过滤禁用的服务器
     */
    filterDisabledServers(config) {
        const filteredConfig = { mcpServers: {} };
        
        Object.entries(config.mcpServers).forEach(([name, server]) => {
            if (!server.disabled) {
                const { disabled, ...serverConfig } = server;
                filteredConfig.mcpServers[name] = serverConfig;
            }
        });
        
        return filteredConfig;
    }

    /**
     * 备份配置到WebDAV
     */
    async backupToWebDAV(req, res) {
        try {
            logger.info('Handling WebDAV backup request');

            const config = await this.readConfigFile(this.configPaths.LOCAL_CONFIG_PATH);
            const result = await webdavService.uploadConfig(config);

            res.json({
                success: true,
                message: 'Configuration backed up to WebDAV successfully',
                backup: result
            });
        } catch (error) {
            logger.error('Error backing up to WebDAV:', error);
            res.status(500).json({
                error: 'Failed to backup to WebDAV',
                message: error.message
            });
        }
    }

    /**
     * 从WebDAV恢复配置
     */
    async restoreFromWebDAV(req, res) {
        try {
            logger.info('Handling WebDAV restore request');

            const { fileName } = req.params;
            if (!fileName) {
                throw new ConfigError('Backup filename is required');
            }

            const config = await webdavService.downloadConfig(fileName);
            this.validateConfig(config);

            const { backup = true } = req.body;

            // 创建当前配置的备份
            if (backup) {
                try {
                    const currentConfig = await this.readConfigFile(this.configPaths.LOCAL_CONFIG_PATH);
                    await webdavService.autoBackup(currentConfig);
                } catch (backupError) {
                    logger.warn('Failed to create backup before restore:', backupError);
                }
            }

            // 恢复配置
            await this.saveConfigToAllLocations(config);

            const restoredServers = Object.keys(config.mcpServers || {});
            logger.info(`Successfully restored ${restoredServers.length} server configurations from WebDAV`);

            res.json({
                success: true,
                message: `Successfully restored ${restoredServers.length} server configurations`,
                restoredServers,
                fileName
            });
        } catch (error) {
            logger.error('Error restoring from WebDAV:', error);
            res.status(500).json({
                error: 'Failed to restore from WebDAV',
                message: error.message
            });
        }
    }

    /**
     * 列出WebDAV备份
     */
    async listWebDAVBackups(req, res) {
        try {
            logger.info('Handling WebDAV backup list request');

            const backups = await webdavService.listBackups();

            res.json({
                success: true,
                backups,
                count: backups.length
            });
        } catch (error) {
            logger.error('Error listing WebDAV backups:', error);
            res.status(500).json({
                error: 'Failed to list WebDAV backups',
                message: error.message
            });
        }
    }

    /**
     * 删除WebDAV备份
     */
    async deleteWebDAVBackup(req, res) {
        try {
            logger.info('Handling WebDAV backup deletion request');

            const { fileName } = req.params;
            if (!fileName) {
                throw new ConfigError('Backup filename is required');
            }

            const result = await webdavService.deleteBackup(fileName);

            res.json({
                success: true,
                message: 'Backup deleted successfully',
                deletedFile: result.deletedFile
            });
        } catch (error) {
            logger.error('Error deleting WebDAV backup:', error);
            res.status(500).json({
                error: 'Failed to delete WebDAV backup',
                message: error.message
            });
        }
    }

    /**
     * 检查WebDAV连接状态
     */
    async checkWebDAVStatus(req, res) {
        try {
            logger.info('Checking WebDAV connection status');

            const status = await webdavService.checkConnection();

            res.json({
                success: true,
                webdav: status
            });
        } catch (error) {
            logger.error('WebDAV status check failed:', error);
            res.status(500).json({
                success: false,
                error: 'WebDAV connection failed',
                message: error.message
            });
        }
    }

    /**
     * 清理旧备份
     */
    async cleanupOldBackups(req, res) {
        try {
            logger.info('Handling cleanup old backups request');

            const { keepCount = 10 } = req.query;
            await webdavService.cleanupOldBackups(parseInt(keepCount));

            res.json({
                success: true,
                message: `Cleanup completed, keeping ${keepCount} most recent backups`
            });
        } catch (error) {
            logger.error('Error cleaning up old backups:', error);
            res.status(500).json({
                error: 'Failed to cleanup old backups',
                message: error.message
            });
        }
    }
}

export default new ConfigImportExportController();