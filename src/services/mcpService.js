import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { McpError } from '../utils/errors.js';

/**
 * MCP代理服务器类
 * 负责管理多个MCP服务器并提供统一的工具访问接口
 */
export class McpManagerService {
    constructor() {
        this.server = new Server(
            {
                name: 'mcp-manager-server',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.mcpProcesses = new Map(); // 存储 MCP 进程
        this.toolsCache = new Map(); // 缓存工具列表
        this.config = null;

        this.setupEventHandlers();
        this.setupToolHandlers();
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        this.server.onerror = (error) => {
            logger.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, cleaning up...');
            await this.cleanup();
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * 设置工具处理器
     */
    setupToolHandlers() {
        // 处理工具列表请求
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            try {
                await this.loadConfig();
                const tools = await this.getAllTools();
                return { tools };
            } catch (error) {
                logger.error('Error listing tools:', error);
                throw new McpError(`Failed to list tools: ${error.message}`);
            }
        });

        // 处理工具调用请求
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const { name, arguments: args } = request.params;
                logger.info(`Calling tool: ${name}`);
                
                const result = await this.callTool(name, args);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (error) {
                logger.error(`Error calling tool ${request.params.name}:`, error);
                throw new McpError(`Failed to call tool: ${error.message}`);
            }
        });
    }

    /**
     * 加载配置文件
     */
    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'config.json');
            const configData = await fs.readFile(configPath, 'utf8');
            this.config = JSON.parse(configData);
            logger.info('Loaded config with servers:', Object.keys(this.config.mcpServers || {}));
            return this.config;
        } catch (error) {
            logger.error('Error loading config:', error);
            this.config = { mcpServers: {} };
            return this.config;
        }
    }

    /**
     * 启动MCP服务器
     */
    async startMcpServer(serverName, serverConfig) {
        if (this.mcpProcesses.has(serverName)) {
            return this.mcpProcesses.get(serverName);
        }

        return new Promise((resolve, reject) => {
            logger.info(`Starting MCP server: ${serverName}`);
            
            const process = spawn(serverConfig.command, serverConfig.args, {
                env: { ...process.env, ...serverConfig.env },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let jsonBuffer = '';
            let isReady = false;

            const processInfo = {
                process,
                ready: false,
                tools: [],
                sendRequest: (request) => {
                    return new Promise((resolve, reject) => {
                        const requestId = Date.now().toString();
                        const requestData = { ...request, id: requestId };
                        
                        const responseHandler = (data) => {
                            const lines = data.toString().split('\n');
                            for (const line of lines) {
                                if (line.trim()) {
                                    try {
                                        const response = JSON.parse(line);
                                        if (response.id === requestId) {
                                            process.stdout.off('data', responseHandler);
                                            resolve(response);
                                            return;
                                        }
                                    } catch (e) {
                                        // 忽略解析错误，继续处理其他行
                                    }
                                }
                            }
                        };

                        process.stdout.on('data', responseHandler);
                        
                        // 发送请求
                        process.stdin.write(JSON.stringify(requestData) + '\n');
                        
                        // 设置超时
                        setTimeout(() => {
                            process.stdout.off('data', responseHandler);
                            reject(new Error('Request timeout'));
                        }, 10000);
                    });
                }
            };

            // 处理stdout数据
            process.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const message = JSON.parse(line);
                            if (message.method === 'initialized' && !isReady) {
                                isReady = true;
                                processInfo.ready = true;
                                logger.info(`MCP server ${serverName} is ready`);
                                resolve(processInfo);
                            }
                        } catch (e) {
                            // 忽略非JSON输出
                        }
                    }
                }
            });

            // 处理错误
            process.stderr.on('data', (data) => {
                logger.warn(`MCP server ${serverName} stderr:`, data.toString());
            });

            process.on('error', (error) => {
                logger.error(`MCP server ${serverName} error:`, error);
                reject(error);
            });

            process.on('exit', (code) => {
                logger.info(`MCP server ${serverName} exited with code ${code}`);
                this.mcpProcesses.delete(serverName);
            });

            this.mcpProcesses.set(serverName, processInfo);

            // 初始化服务器
            setTimeout(() => {
                try {
                    process.stdin.write(JSON.stringify({
                        jsonrpc: '2.0',
                        id: 1,
                        method: 'initialize',
                        params: {
                            protocolVersion: '2024-11-05',
                            capabilities: {
                                tools: {}
                            },
                            clientInfo: {
                                name: 'mcp-manager',
                                version: '0.1.0'
                            }
                        }
                    }) + '\n');
                } catch (error) {
                    logger.error(`Failed to initialize ${serverName}:`, error);
                    reject(error);
                }
            }, 100);

            // 启动超时
            setTimeout(() => {
                if (!isReady) {
                    reject(new Error(`MCP server ${serverName} failed to start within timeout`));
                }
            }, 15000);
        });
    }

    /**
     * 获取所有工具
     */
    async getAllTools() {
        const allTools = [];
        
        for (const [serverName, serverConfig] of Object.entries(this.config.mcpServers || {})) {
            if (serverConfig.disabled) {
                continue;
            }

            try {
                const tools = await this.getServerTools(serverName);
                // 为工具添加服务器前缀以避免名称冲突
                const prefixedTools = tools.map(tool => ({
                    ...tool,
                    name: `${serverName}_${tool.name}`,
                    description: `[${serverName}] ${tool.description}`
                }));
                allTools.push(...prefixedTools);
            } catch (error) {
                logger.error(`Failed to get tools from ${serverName}:`, error);
            }
        }

        return allTools;
    }

    /**
     * 获取特定服务器的工具
     */
    async getServerTools(serverName) {
        try {
            const serverConfig = this.config.mcpServers[serverName];
            if (!serverConfig) {
                throw new Error(`Server ${serverName} not found in config`);
            }

            // 检查缓存
            if (this.toolsCache.has(serverName)) {
                return this.toolsCache.get(serverName);
            }

            // 启动服务器（如果尚未启动）
            const processInfo = await this.startMcpServer(serverName, serverConfig);
            
            // 获取工具列表
            const response = await processInfo.sendRequest({
                jsonrpc: '2.0',
                method: 'tools/list',
                params: {}
            });

            const tools = response.result?.tools || [];
            this.toolsCache.set(serverName, tools);
            
            logger.info(`Got ${tools.length} tools from ${serverName}`);
            return tools;
        } catch (error) {
            logger.error(`Error getting tools from ${serverName}:`, error);
            return [];
        }
    }

    /**
     * 调用工具
     */
    async callTool(toolName, args) {
        // 解析服务器名称和工具名称
        const [serverName, ...toolNameParts] = toolName.split('_');
        const actualToolName = toolNameParts.join('_');

        const serverConfig = this.config.mcpServers[serverName];
        if (!serverConfig) {
            throw new Error(`Server ${serverName} not found`);
        }

        const processInfo = this.mcpProcesses.get(serverName);
        if (!processInfo || !processInfo.ready) {
            throw new Error(`Server ${serverName} is not ready`);
        }

        // 调用工具
        const response = await processInfo.sendRequest({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
                name: actualToolName,
                arguments: args
            }
        });

        return response.result;
    }

    /**
     * 清理资源
     */
    async cleanup() {
        logger.info('Cleaning up MCP processes...');
        
        for (const [serverName, processInfo] of this.mcpProcesses) {
            try {
                if (processInfo.process && !processInfo.process.killed) {
                    processInfo.process.kill('SIGTERM');
                    logger.info(`Terminated MCP server: ${serverName}`);
                }
            } catch (error) {
                logger.error(`Error terminating ${serverName}:`, error);
            }
        }

        this.mcpProcesses.clear();
        this.toolsCache.clear();
    }

    /**
     * 运行服务器
     */
    async run() {
        try {
            await this.loadConfig();
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            logger.info('MCP Manager Server is running');
        } catch (error) {
            logger.error('Failed to start MCP Manager Server:', error);
            throw error;
        }
    }
}