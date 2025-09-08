import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../services/logger.js';
import { ConfigError, FileError } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 配置控制器 - 处理MCP服务器配置相关的请求
 */
class ConfigController {
    constructor() {
        this.configPaths = this.getConfigPaths();
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
                CLAUDE_CONFIG_PATH: path.join(home, 'Library/Application Support/Claude/claude_desktop_config.json')
            };
        } else if (process.platform === 'win32') {
            return {
                CURSOR_CONFIG_PATH: path.join(home, 'AppData/Roaming/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
                CLAUDE_CONFIG_PATH: path.join(home, 'AppData/Roaming/Claude/claude_desktop_config.json')
            };
        } else {
            // Linux paths
            return {
                CURSOR_CONFIG_PATH: path.join(home, '.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
                CLAUDE_CONFIG_PATH: path.join(home, '.config/Claude/claude_desktop_config.json')
            };
        }
    }

    /**
     * 读取配置文件
     */
    async readConfigFile(filePath) {
        try {
            logger.info(`Reading config file: ${filePath}`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.info('No existing config found, using empty config');
                return { mcpServers: {} };
            }
            logger.error(`Error reading ${filePath}:`, error);
            throw new FileError(`Failed to read config file: ${filePath}`, error);
        }
    }

    /**
     * 合并配置文件
     */
    mergeConfigs(savedConfig, defaultConfig) {
        logger.info('Merging configurations');
        logger.debug('Saved servers:', Object.keys(savedConfig.mcpServers || {}));
        logger.debug('Default servers:', Object.keys(defaultConfig));
        
        const mergedServers = {};
        
        // 首先添加所有默认服务器
        Object.entries(defaultConfig).forEach(([name, config]) => {
            mergedServers[name] = { ...config };
        });
        
        // 用保存的配置覆盖默认配置
        Object.entries(savedConfig.mcpServers || {}).forEach(([name, config]) => {
            mergedServers[name] = {
                ...mergedServers[name],
                ...config
            };
        });
        
        logger.debug('Merged servers:', Object.keys(mergedServers));
        return { mcpServers: mergedServers };
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
            } else {
                logger.info(`Filtering out disabled server: ${name}`);
            }
        });
        
        logger.debug('Filtered servers:', Object.keys(filteredConfig.mcpServers));
        return filteredConfig;
    }

    /**
     * 获取Cursor配置
     */
    async getCursorConfig(req, res) {
        try {
            logger.info('Handling /api/cursor-config request');
            
            const savedConfig = await this.readConfigFile(this.configPaths.CURSOR_CONFIG_PATH);
            const defaultConfigPath = path.join(__dirname, '../../config.json');
            const defaultConfig = await this.readConfigFile(defaultConfigPath);
            const mergedConfig = this.mergeConfigs(savedConfig, defaultConfig.mcpServers || {});
            
            logger.info('Returning merged config with servers:', Object.keys(mergedConfig.mcpServers));
            res.json(mergedConfig);
        } catch (error) {
            logger.error('Error in getCursorConfig:', error);
            res.status(500).json({ 
                error: `Failed to read Cursor config: ${error.message}` 
            });
        }
    }

    /**
     * 获取Claude配置
     */
    async getClaudeConfig(req, res) {
        try {
            logger.info('Handling /api/claude-config request');
            
            const config = await this.readConfigFile(this.configPaths.CLAUDE_CONFIG_PATH);
            res.json(config);
        } catch (error) {
            logger.error('Error in getClaudeConfig:', error);
            res.status(500).json({ 
                error: `Failed to read Claude config: ${error.message}` 
            });
        }
    }

    /**
     * 保存配置
     */
    async saveConfigs(req, res) {
        try {
            logger.info('Handling /api/save-configs request');
            
            const { mcpServers } = req.body;
            if (!mcpServers) {
                throw new ConfigError('No server configuration provided');
            }

            // 保存到本地 config.json
            const localConfigPath = path.join(__dirname, '../../config.json');
            const localConfig = { mcpServers };
            await fs.writeFile(localConfigPath, JSON.stringify(localConfig, null, 2));

            // 保存完整配置到 Cursor 设置
            const fullConfig = { mcpServers };
            
            // 确保目录存在
            const cursorDir = path.dirname(this.configPaths.CURSOR_CONFIG_PATH);
            await fs.mkdir(cursorDir, { recursive: true });
            await fs.writeFile(this.configPaths.CURSOR_CONFIG_PATH, JSON.stringify(fullConfig, null, 2));

            // 保存过滤后的配置到 Claude 设置
            const filteredConfig = this.filterDisabledServers(fullConfig);
            logger.debug('Filtered config for Claude:', JSON.stringify(filteredConfig, null, 2));
            
            const claudeDir = path.dirname(this.configPaths.CLAUDE_CONFIG_PATH);
            await fs.mkdir(claudeDir, { recursive: true });
            await fs.writeFile(this.configPaths.CLAUDE_CONFIG_PATH, JSON.stringify(filteredConfig, null, 2));

            logger.info('Successfully saved configurations');
            res.json({ 
                success: true, 
                message: 'Configurations saved successfully' 
            });
        } catch (error) {
            logger.error('Error in saveConfigs:', error);
            res.status(500).json({ 
                error: error instanceof ConfigError ? error.message : `Failed to save configs: ${error.message}` 
            });
        }
    }
}

export default new ConfigController();