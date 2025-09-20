import { createClient } from 'webdav';
import { logger } from './logger.js';
import config from '../config/index.js';

/**
 * WebDAV服务类 - 处理配置文件的远程备份和恢复
 */
class WebDAVService {
    constructor() {
        this.client = null;
        this.isConfigured = false;
        this.initializeClient();
    }

    /**
     * 初始化WebDAV客户端
     */
    initializeClient() {
        try {
            const webdavConfig = config.webdav;
            
            if (!webdavConfig || !webdavConfig.url) {
                logger.info('WebDAV not configured, backup functionality will be disabled');
                return;
            }

            this.client = createClient(webdavConfig.url, {
                username: webdavConfig.username,
                password: webdavConfig.password,
                headers: webdavConfig.headers || {}
            });

            this.isConfigured = true;
            logger.info('WebDAV client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize WebDAV client:', error);
            this.isConfigured = false;
        }
    }

    /**
     * 检查WebDAV连接状态
     */
    async checkConnection() {
        if (!this.isConfigured) {
            throw new Error('WebDAV not configured');
        }

        try {
            await this.client.getDirectoryContents('/');
            return { status: 'connected', message: 'WebDAV connection successful' };
        } catch (error) {
            logger.error('WebDAV connection check failed:', error);
            throw new Error(`WebDAV connection failed: ${error.message}`);
        }
    }

    /**
     * 上传配置文件到WebDAV
     */
    async uploadConfig(configData, filename = null) {
        if (!this.isConfigured) {
            throw new Error('WebDAV not configured');
        }

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = filename || `mcp-config-backup-${timestamp}.json`;
            const remotePath = `/mcp-manager-backups/${fileName}`;

            // 确保备份目录存在
            try {
                await this.client.createDirectory('/mcp-manager-backups');
            } catch (error) {
                // 目录可能已存在，忽略错误
                if (!error.message.includes('exists')) {
                    logger.warn('Failed to create backup directory:', error.message);
                }
            }

            // 上传配置文件
            const configJson = JSON.stringify(configData, null, 2);
            await this.client.putFileContents(remotePath, configJson, {
                contentType: 'application/json'
            });

            logger.info(`Configuration backed up to WebDAV: ${remotePath}`);
            return {
                success: true,
                remotePath,
                fileName,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to upload config to WebDAV:', error);
            throw new Error(`WebDAV upload failed: ${error.message}`);
        }
    }

    /**
     * 从WebDAV下载配置文件
     */
    async downloadConfig(fileName) {
        if (!this.isConfigured) {
            throw new Error('WebDAV not configured');
        }

        try {
            const remotePath = `/mcp-manager-backups/${fileName}`;
            const configData = await this.client.getFileContents(remotePath, {
                format: 'text'
            });

            logger.info(`Configuration downloaded from WebDAV: ${remotePath}`);
            return JSON.parse(configData);
        } catch (error) {
            logger.error('Failed to download config from WebDAV:', error);
            throw new Error(`WebDAV download failed: ${error.message}`);
        }
    }

    /**
     * 列出WebDAV上的备份文件
     */
    async listBackups() {
        if (!this.isConfigured) {
            throw new Error('WebDAV not configured');
        }

        try {
            const contents = await this.client.getDirectoryContents('/mcp-manager-backups');
            
            const backups = contents
                .filter(item => item.type === 'file' && item.filename.endsWith('.json'))
                .map(item => ({
                    filename: item.filename,
                    size: item.size,
                    lastModified: item.lastmod,
                    remotePath: `/mcp-manager-backups/${item.filename}`
                }))
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

            logger.info(`Found ${backups.length} backup files on WebDAV`);
            return backups;
        } catch (error) {
            logger.error('Failed to list backups from WebDAV:', error);
            throw new Error(`WebDAV list failed: ${error.message}`);
        }
    }

    /**
     * 删除WebDAV上的备份文件
     */
    async deleteBackup(fileName) {
        if (!this.isConfigured) {
            throw new Error('WebDAV not configured');
        }

        try {
            const remotePath = `/mcp-manager-backups/${fileName}`;
            await this.client.deleteFile(remotePath);

            logger.info(`Backup file deleted from WebDAV: ${remotePath}`);
            return { success: true, deletedFile: fileName };
        } catch (error) {
            logger.error('Failed to delete backup from WebDAV:', error);
            throw new Error(`WebDAV delete failed: ${error.message}`);
        }
    }

    /**
     * 自动备份配置（如果启用）
     */
    async autoBackup(configData) {
        if (!this.isConfigured) {
            return null;
        }

        const webdavConfig = config.webdav;
        if (!webdavConfig.autoBackup) {
            return null;
        }

        try {
            const result = await this.uploadConfig(configData);
            logger.info('Auto backup completed successfully');
            return result;
        } catch (error) {
            logger.error('Auto backup failed:', error);
            // 不抛出错误，因为这是自动备份
            return null;
        }
    }

    /**
     * 清理旧的备份文件
     */
    async cleanupOldBackups(keepCount = 10) {
        if (!this.isConfigured) {
            return;
        }

        try {
            const backups = await this.listBackups();
            
            if (backups.length <= keepCount) {
                logger.info(`Only ${backups.length} backups found, no cleanup needed`);
                return;
            }

            const toDelete = backups.slice(keepCount);
            const deletePromises = toDelete.map(backup => 
                this.deleteBackup(backup.filename).catch(error => {
                    logger.error(`Failed to delete backup ${backup.filename}:`, error);
                })
            );

            await Promise.all(deletePromises);
            logger.info(`Cleaned up ${toDelete.length} old backup files`);
        } catch (error) {
            logger.error('Failed to cleanup old backups:', error);
        }
    }
}

export default new WebDAVService();