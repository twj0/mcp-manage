#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class McpManagerServer {
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

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.cleanup();
      await this.server.close();
      process.exit(0);
    });
  }

  async loadConfig() {
    try {
      const configPath = join(__dirname, 'config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      console.error('Loaded config with servers:', Object.keys(this.config.mcpServers || {}));
      return this.config;
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = { mcpServers: {} };
      return this.config;
    }
  }

  async startMcpServer(serverName, serverConfig) {
    if (this.mcpProcesses.has(serverName)) {
      return this.mcpProcesses.get(serverName);
    }

    return new Promise((resolve, reject) => {
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
                    // 忽略非 JSON 数据
                  }
                }
              }
            };

            process.stdout.on('data', responseHandler);
            process.stdin.write(JSON.stringify(requestData) + '\n');
            
            // 超时处理
            setTimeout(() => {
              process.stdout.off('data', responseHandler);
              reject(new Error('Request timeout'));
            }, 5000);
          });
        }
      };

      process.stdout.on('data', (data) => {
        jsonBuffer += data.toString();
        const lines = jsonBuffer.split('\n');
        jsonBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const message = JSON.parse(line);
              if (message.method === 'notifications/initialized' && !isReady) {
                isReady = true;
                processInfo.ready = true;
                this.mcpProcesses.set(serverName, processInfo);
                resolve(processInfo);
              }
            } catch (e) {
              // 忽略非 JSON 数据
            }
          }
        }
      });

      process.stderr.on('data', (data) => {
        console.error(`[${serverName}] ${data}`);
      });

      process.on('error', (error) => {
        console.error(`[${serverName}] Process error:`, error);
        this.mcpProcesses.delete(serverName);
        if (!isReady) reject(error);
      });

      process.on('exit', (code) => {
        console.error(`[${serverName}] Process exited with code ${code}`);
        this.mcpProcesses.delete(serverName);
      });

      // 发送初始化消息
      const initMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'mcp-manager-proxy',
            version: '0.1.0'
          }
        }
      };
      
      process.stdin.write(JSON.stringify(initMessage) + '\n');
    });
  }

  async getServerTools(serverName, serverConfig) {
    if (this.toolsCache.has(serverName)) {
      return this.toolsCache.get(serverName);
    }

    try {
      const processInfo = await this.startMcpServer(serverName, serverConfig);
      
      const response = await processInfo.sendRequest({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {}
      });

      const tools = response.result?.tools || [];
      // 为每个工具添加服务器前缀
      const prefixedTools = tools.map(tool => ({
        ...tool,
        name: `${serverName}_${tool.name}`,
        description: `[${serverName}] ${tool.description || ''}`,
        originalName: tool.name,
        serverName: serverName
      }));

      this.toolsCache.set(serverName, prefixedTools);
      return prefixedTools;
    } catch (error) {
      console.error(`Error getting tools for ${serverName}:`, error);
      return [];
    }
  }

  async getAllTools() {
    if (!this.config) {
      await this.loadConfig();
    }

    const allTools = [];
    
    // 添加管理工具
    allTools.push({
      name: 'launch_manager',
      description: 'Launch the MCP Server Manager interface',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    });

    // 获取所有启用的服务器的工具
    for (const [serverName, serverConfig] of Object.entries(this.config.mcpServers || {})) {
      if (!serverConfig.disabled) {
        try {
          const tools = await this.getServerTools(serverName, serverConfig);
          allTools.push(...tools);
        } catch (error) {
          console.error(`Failed to load tools for ${serverName}:`, error);
        }
      }
    }

    return allTools;
  }

  async callServerTool(serverName, originalToolName, args) {
    const serverConfig = this.config.mcpServers[serverName];
    if (!serverConfig) {
      throw new Error(`Server ${serverName} not found`);
    }

    const processInfo = await this.startMcpServer(serverName, serverConfig);
    
    const response = await processInfo.sendRequest({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: originalToolName,
        arguments: args
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Tool call failed');
    }

    return response.result;
  }

  async cleanup() {
    for (const [serverName, processInfo] of this.mcpProcesses) {
      try {
        processInfo.process.kill();
      } catch (error) {
        console.error(`Error killing process ${serverName}:`, error);
      }
    }
    this.mcpProcesses.clear();
  }
  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.getAllTools();
      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};

      if (toolName === 'launch_manager') {
        // 启动管理界面
        const { exec } = await import('child_process');
        const serverPath = join(__dirname, 'server.js');
        exec(`node ${serverPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error: ${error}`);
            return;
          }
          console.log(stdout);
        });

        return {
          content: [
            {
              type: 'text',
              text: 'MCP Manager launched at http://localhost:3456',
            },
          ],
        };
      }

      // 处理代理工具调用
      const toolParts = toolName.split('_', 2);
      if (toolParts.length >= 2) {
        const serverName = toolParts[0];
        const originalToolName = toolName.substring(serverName.length + 1);
        
        try {
          const result = await this.callServerTool(serverName, originalToolName, args);
          return result;
        } catch (error) {
          throw new Error(`Error calling tool ${toolName}: ${error.message}`);
        }
      }

      throw new Error(`Unknown tool: ${toolName}`);
    });
  }

  async run() {
    // 首先加载配置
    await this.loadConfig();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Manager Server running on stdio');
    console.error('Available MCP servers:', Object.keys(this.config.mcpServers || {}));
  }
}

const server = new McpManagerServer();
server.run().catch(console.error);
