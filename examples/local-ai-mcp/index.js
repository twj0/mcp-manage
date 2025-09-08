#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

class LocalAIMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'local-ai-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // 本地 AI 服务配置
    this.aiConfig = {
      baseURL: process.env.LOCAL_AI_BASE_URL || 'http://localhost:8080',
      model: process.env.LOCAL_AI_MODEL || 'gpt-3.5-turbo',
      apiKey: process.env.LOCAL_AI_API_KEY || '',
    };

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupPromptHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'chat_completion',
          description: '与本地 AI 模型进行对话',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: '要发送给 AI 的消息'
              },
              system_prompt: {
                type: 'string',
                description: '系统提示（可选）'
              },
              temperature: {
                type: 'number',
                description: '温度参数 (0.0-2.0)',
                minimum: 0.0,
                maximum: 2.0,
                default: 0.7
              },
              max_tokens: {
                type: 'integer',
                description: '最大生成tokens数量',
                minimum: 1,
                maximum: 4096,
                default: 1000
              }
            },
            required: ['message']
          }
        },
        {
          name: 'list_models',
          description: '列出本地 AI 服务器上可用的模型',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'check_health',
          description: '检查本地 AI 服务器健康状态',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'generate_embedding',
          description: '生成文本嵌入向量',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: '要生成嵌入的文本'
              },
              model: {
                type: 'string',
                description: '嵌入模型名称（可选）'
              }
            },
            required: ['text']
          }
        }
      ]
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'chat_completion':
            return await this.handleChatCompletion(args);
          case 'list_models':
            return await this.handleListModels();
          case 'check_health':
            return await this.handleCheckHealth();
          case 'generate_embedding':
            return await this.handleGenerateEmbedding(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  setupResourceHandlers() {
    // 列出可用资源
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'ai://models',
          name: 'Available AI Models',
          description: '本地 AI 服务器上可用的模型列表',
          mimeType: 'application/json'
        },
        {
          uri: 'ai://config',
          name: 'AI Server Configuration',
          description: '当前 AI 服务器配置信息',
          mimeType: 'application/json'
        }
      ]
    }));

    // 读取资源
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'ai://models':
          const models = await this.getAvailableModels();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(models, null, 2)
              }
            ]
          };

        case 'ai://config':
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(this.aiConfig, null, 2)
              }
            ]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  setupPromptHandlers() {
    // 列出可用提示模板
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: [
        {
          name: 'code_review',
          description: '代码审查提示模板',
          arguments: [
            {
              name: 'code',
              description: '要审查的代码',
              required: true
            },
            {
              name: 'language',
              description: '编程语言',
              required: false
            }
          ]
        },
        {
          name: 'explain_concept',
          description: '概念解释提示模板',
          arguments: [
            {
              name: 'concept',
              description: '要解释的概念',
              required: true
            },
            {
              name: 'level',
              description: '解释难度级别 (beginner/intermediate/advanced)',
              required: false
            }
          ]
        }
      ]
    }));

    // 获取提示模板
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'code_review':
          const code = args?.code || '';
          const language = args?.language || '未知';
          return {
            description: `审查 ${language} 代码`,
            messages: [
              {
                role: 'system',
                content: {
                  type: 'text',
                  text: '你是一个专业的代码审查专家。请仔细分析提供的代码，指出潜在问题、改进建议和最佳实践。'
                }
              },
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `请审查以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\``
                }
              }
            ]
          };

        case 'explain_concept':
          const concept = args?.concept || '';
          const level = args?.level || 'intermediate';
          return {
            description: `解释概念: ${concept}`,
            messages: [
              {
                role: 'system',
                content: {
                  type: 'text',
                  text: `你是一个优秀的教师。请以${level === 'beginner' ? '初学者' : level === 'advanced' ? '高级' : '中级'}水平解释概念。`
                }
              },
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `请解释这个概念：${concept}`
                }
              }
            ]
          };

        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  // 工具实现方法
  async handleChatCompletion(args) {
    const {
      message,
      system_prompt = '',
      temperature = 0.7,
      max_tokens = 1000
    } = args;

    const messages = [];
    if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    }
    messages.push({ role: 'user', content: message });

    try {
      const response = await axios.post(`${this.aiConfig.baseURL}/v1/chat/completions`, {
        model: this.aiConfig.model,
        messages,
        temperature,
        max_tokens
      }, {
        headers: {
          'Authorization': this.aiConfig.apiKey ? `Bearer ${this.aiConfig.apiKey}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0]?.message?.content || '无响应';

      return {
        content: [
          {
            type: 'text',
            text: aiResponse
          }
        ]
      };
    } catch (error) {
      throw new Error(`AI 服务请求失败: ${error.message}`);
    }
  }

  async handleListModels() {
    try {
      const response = await axios.get(`${this.aiConfig.baseURL}/v1/models`, {
        headers: {
          'Authorization': this.aiConfig.apiKey ? `Bearer ${this.aiConfig.apiKey}` : undefined
        }
      });

      const models = response.data.data || [];
      const modelList = models.map(model => model.id || model.name).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `可用模型:\n${modelList}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }

  async handleCheckHealth() {
    try {
      const response = await axios.get(`${this.aiConfig.baseURL}/v1/models`, {
        timeout: 5000,
        headers: {
          'Authorization': this.aiConfig.apiKey ? `Bearer ${this.aiConfig.apiKey}` : undefined
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ 本地 AI 服务器健康状态正常\n服务器地址: ${this.aiConfig.baseURL}\n当前模型: ${this.aiConfig.model}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`健康检查失败: ${error.message}`);
    }
  }

  async handleGenerateEmbedding(args) {
    const { text, model = 'text-embedding-ada-002' } = args;

    try {
      const response = await axios.post(`${this.aiConfig.baseURL}/v1/embeddings`, {
        model,
        input: text
      }, {
        headers: {
          'Authorization': this.aiConfig.apiKey ? `Bearer ${this.aiConfig.apiKey}` : undefined,
          'Content-Type': 'application/json'
        }
      });

      const embedding = response.data.data[0]?.embedding || [];

      return {
        content: [
          {
            type: 'text',
            text: `文本嵌入生成成功\n维度: ${embedding.length}\n前5个值: [${embedding.slice(0, 5).join(', ')}...]`
          }
        ]
      };
    } catch (error) {
      throw new Error(`生成嵌入失败: ${error.message}`);
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.aiConfig.baseURL}/v1/models`, {
        headers: {
          'Authorization': this.aiConfig.apiKey ? `Bearer ${this.aiConfig.apiKey}` : undefined
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return [];
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Local AI MCP Server running on stdio');
    console.error(`AI Server: ${this.aiConfig.baseURL}`);
    console.error(`Default Model: ${this.aiConfig.model}`);
  }
}

// 启动服务器
const server = new LocalAIMCPServer();
server.run().catch(console.error);