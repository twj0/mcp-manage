import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../services/logger.js';
import configController from './configController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 工具控制器 - 处理MCP工具相关的请求
 */
class ToolController {
    /**
     * 获取工具列表
     */
    async getTools(req, res) {
        try {
            logger.info('Handling /api/tools request');
            
            const cursorConfigPath = configController.configPaths.CURSOR_CONFIG_PATH;
            const cursorConfig = await configController.readConfigFile(cursorConfigPath);
            const defaultConfigPath = path.join(__dirname, '../../config.json');
            const defaultConfig = await configController.readConfigFile(defaultConfigPath);
            const mergedConfig = configController.mergeConfigs(cursorConfig, defaultConfig.mcpServers || {});
            const servers = mergedConfig.mcpServers;

            // 定义每个服务器的可用工具
            const toolsMap = {
                'mcp-manager': [{
                    name: 'launch_manager',
                    description: 'Launch the MCP Server Manager interface',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                        required: []
                    }
                }],
                'feedback-enhance': [{
                    name: 'analyze_feedback',
                    description: 'Analyze feedback sentiment and extract key insights',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            feedback: {
                                type: 'string',
                                description: 'The feedback text to analyze'
                            }
                        },
                        required: ['feedback']
                    }
                }, {
                    name: 'generate_response',
                    description: 'Generate appropriate response to feedback',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            feedback: {
                                type: 'string',
                                description: 'The original feedback'
                            },
                            sentiment: {
                                type: 'string',
                                description: 'The sentiment analysis result'
                            }
                        },
                        required: ['feedback']
                    }
                }],
                'local-ai': [{
                    name: 'chat_completion',
                    description: 'Generate chat completion using local AI',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            messages: {
                                type: 'array',
                                description: 'Array of chat messages'
                            },
                            model: {
                                type: 'string',
                                description: 'Model name to use'
                            }
                        },
                        required: ['messages']
                    }
                }]
            };

            // 根据启用的服务器过滤工具
            const enabledTools = Object.entries(toolsMap)
                .filter(([serverName]) => {
                    return servers[serverName] && !servers[serverName].disabled;
                })
                .flatMap(([serverName, tools]) => 
                    tools.map(tool => ({
                        ...tool,
                        server: serverName,
                        // 添加工具前缀以避免冲突
                        name: `${serverName}_${tool.name}`
                    }))
                );

            logger.info(`Returning ${enabledTools.length} tools`);
            res.json(enabledTools);
        } catch (error) {
            logger.error('Error in getTools:', error);
            res.status(500).json({ 
                error: `Failed to get tools: ${error.message}` 
            });
        }
    }

    /**
     * 获取特定服务器的工具
     */
    async getServerTools(req, res) {
        try {
            const { serverName } = req.params;
            logger.info(`Getting tools for server: ${serverName}`);
            
            // 这里可以实际连接到MCP服务器获取工具列表
            // 目前返回模拟数据
            const tools = await this.fetchToolsFromServer(serverName);
            
            res.json({
                server: serverName,
                tools: tools
            });
        } catch (error) {
            logger.error(`Error getting tools for server ${req.params.serverName}:`, error);
            res.status(500).json({ 
                error: `Failed to get tools for server: ${error.message}` 
            });
        }
    }

    /**
     * 从MCP服务器获取工具（模拟实现）
     */
    async fetchToolsFromServer(serverName) {
        // 这里应该实际连接到MCP服务器
        // 目前返回模拟数据
        logger.debug(`Fetching tools from server: ${serverName}`);
        
        // 模拟延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return [
            {
                name: `${serverName}_example_tool`,
                description: `Example tool from ${serverName}`,
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: {
                            type: 'string',
                            description: 'Example input parameter'
                        }
                    },
                    required: ['input']
                }
            }
        ];
    }

    /**
     * 调用工具
     */
    async callTool(req, res) {
        try {
            const { toolName, arguments: toolArgs } = req.body;
            logger.info(`Calling tool: ${toolName}`);
            
            // 解析服务器名称和工具名称
            const [serverName, ...toolNameParts] = toolName.split('_');
            const actualToolName = toolNameParts.join('_');
            
            logger.debug(`Server: ${serverName}, Tool: ${actualToolName}`);
            
            // 这里应该实际调用MCP服务器的工具
            const result = await this.executeToolOnServer(serverName, actualToolName, toolArgs);
            
            res.json({
                success: true,
                result: result
            });
        } catch (error) {
            logger.error('Error calling tool:', error);
            res.status(500).json({ 
                error: `Failed to call tool: ${error.message}` 
            });
        }
    }

    /**
     * 在MCP服务器上执行工具（模拟实现）
     */
    async executeToolOnServer(serverName, toolName, args) {
        logger.debug(`Executing tool ${toolName} on server ${serverName} with args:`, args);
        
        // 模拟工具执行
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
            server: serverName,
            tool: toolName,
            executedAt: new Date().toISOString(),
            result: `Tool ${toolName} executed successfully with args: ${JSON.stringify(args)}`
        };
    }
}

export default new ToolController();