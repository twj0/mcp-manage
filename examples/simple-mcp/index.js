#!/usr/bin/env node

// 简化版本的本地 AI MCP 服务器
// 适用于快速测试和学习

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class SimpleMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'simple-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    // 列出工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'echo',
          description: '回显输入的消息',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: '要回显的消息'
              }
            },
            required: ['message']
          }
        },
        {
          name: 'current_time',
          description: '获取当前时间',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'system_info',
          description: '获取系统信息',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        }
      ]
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'echo':
          return {
            content: [
              {
                type: 'text',
                text: `回显: ${args.message}`
              }
            ]
          };

        case 'current_time':
          return {
            content: [
              {
                type: 'text',
                text: `当前时间: ${new Date().toLocaleString('zh-CN')}`
              }
            ]
          };

        case 'system_info':
          return {
            content: [
              {
                type: 'text',
                text: `系统信息:
- Node.js 版本: ${process.version}
- 平台: ${process.platform}
- 架构: ${process.arch}
- 工作目录: ${process.cwd()}
- 环境变量数量: ${Object.keys(process.env).length}`
              }
            ]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Simple MCP Server running on stdio');
    console.error('Available tools: echo, current_time, system_info');
  }
}

// 启动服务器
const server = new SimpleMCPServer();
server.run().catch(console.error);