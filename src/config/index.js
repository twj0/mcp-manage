/**
 * Application Configuration
 * @fileoverview 应用程序配置管理
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 应用配置
 */
export const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3456,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // 路径配置
  paths: {
    root: path.resolve(__dirname, '../..'),
    src: path.resolve(__dirname, '..'),
    public: path.resolve(__dirname, '../../public'),
    config: path.resolve(__dirname, '../../config'),
    templates: path.resolve(__dirname, '../../templates'),
    examples: path.resolve(__dirname, '../../examples'),
    logs: path.resolve(__dirname, '../../logs'),
  },

  // MCP 配置
  mcp: {
    configFile: 'config.json',
    templatesFile: 'templates.json',
    registryFile: 'mcp-registry.json',
    defaultTimeout: 5000,
    maxRetries: 3,
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    maxFiles: 10,
    maxSize: '10m',
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // 安全配置
  security: {
    rateLimitWindowMs: 15 * 60 * 1000, // 15 分钟
    rateLimitMax: 100, // 每个窗口期最大请求数
    enableHelmet: true,
  },

  // API 配置
  api: {
    prefix: '/api',
    version: 'v1',
    timeout: 30000,
    maxBodySize: '10mb',
  },

  // MCP 服务器路径配置
  mcpPaths: {
    windows: {
      cursor: '%APPDATA%\\Cursor\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json',
      vscode: '%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json',
      claude: '%APPDATA%\\Claude\\claude_desktop_config.json',
    },
    darwin: {
      cursor: '~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
      vscode: '~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
      claude: '~/Library/Application Support/Claude/claude_desktop_config.json',
    },
    linux: {
      cursor: '~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
      vscode: '~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
      claude: '~/.config/Claude/claude_desktop_config.json',
    },
  },
};

/**
 * 获取当前平台的 MCP 路径
 * @returns {Object} MCP 配置文件路径
 */
export function getMcpPaths() {
  const platform = process.platform;
  return config.mcpPaths[platform] || config.mcpPaths.linux;
}

/**
 * 检查是否为开发环境
 * @returns {boolean}
 */
export function isDevelopment() {
  return config.server.nodeEnv === 'development';
}

/**
 * 检查是否为生产环境
 * @returns {boolean}
 */
export function isProduction() {
  return config.server.nodeEnv === 'production';
}

/**
 * 获取完整的服务器 URL
 * @returns {string}
 */
export function getServerUrl() {
  return `http://${config.server.host}:${config.server.port}`;
}

export default config;