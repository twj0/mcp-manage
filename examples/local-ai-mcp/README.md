# Local AI MCP Server

这是一个本地 AI 的 MCP (Model Context Protocol) 服务器实现，专门设计用于与 mcp-manager 工具集成。

## 功能特性

### 🤖 AI 工具
- **chat_completion** - 与本地 AI 模型进行对话
- **list_models** - 列出可用的 AI 模型
- **check_health** - 检查 AI 服务器健康状态
- **generate_embedding** - 生成文本嵌入向量

### 📚 资源管理
- **ai://models** - 获取可用模型列表
- **ai://config** - 查看当前配置信息

### 💭 提示模板
- **code_review** - 代码审查提示模板
- **explain_concept** - 概念解释提示模板

## 支持的本地 AI 服务

### 1. Ollama
```bash
# 启动 Ollama
ollama serve

# 拉取模型
ollama pull llama2
ollama pull codellama
```

### 2. LocalAI
```bash
# 使用 Docker 启动 LocalAI
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest
```

### 3. text-generation-webui
```bash
# 启动 text-generation-webui
python server.py --api --listen
```

### 4. LM Studio
- 下载并启动 LM Studio
- 在设置中启用 API 服务器
- 默认端口通常是 1234

## 安装与配置

### 1. 安装依赖
```bash
cd examples/local-ai-mcp
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置您的本地 AI 服务器信息
```

### 3. 启动服务器
```bash
npm start
```

## 在 mcp-manager 中配置

### 方法一：使用模板
1. 打开 mcp-manager 界面
2. 点击 "Add Server" 标签
3. 选择 "Use Template" 模式
4. 选择 "Node.js Local Server" 模板
5. 填写配置信息

### 方法二：手动配置
在 mcp-manager 中添加以下配置：

```json
{
  "command": "node",
  "args": ["D:\\MCP\\mcp-manager\\examples\\local-ai-mcp\\index.js"],
  "env": {
    "LOCAL_AI_BASE_URL": "http://localhost:8080",
    "LOCAL_AI_MODEL": "gpt-3.5-turbo",
    "LOCAL_AI_API_KEY": "your-api-key-here"
  }
}
```

### 方法三：使用 UVX (推荐)
如果您将此项目发布为 npm 包：

```json
{
  "command": "uvx",
  "args": ["local-ai-mcp-server"],
  "env": {
    "LOCAL_AI_BASE_URL": "http://localhost:8080",
    "LOCAL_AI_MODEL": "gpt-3.5-turbo"
  }
}
```

## 使用示例

### 基本对话
```javascript
// 调用 chat_completion 工具
{
  "name": "local-ai_chat_completion",
  "arguments": {
    "message": "你好，请介绍一下 MCP 协议",
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

### 代码审查
```javascript
// 使用代码审查提示模板
{
  "name": "local-ai_code_review",
  "arguments": {
    "code": "function add(a, b) { return a + b; }",
    "language": "javascript"
  }
}
```

### 健康检查
```javascript
// 检查 AI 服务器状态
{
  "name": "local-ai_check_health",
  "arguments": {}
}
```

## 常见配置

### Ollama 配置
```env
LOCAL_AI_BASE_URL=http://localhost:11434
LOCAL_AI_MODEL=llama2
LOCAL_AI_API_KEY=
```

### LocalAI 配置
```env
LOCAL_AI_BASE_URL=http://localhost:8080
LOCAL_AI_MODEL=ggml-gpt4all-j
LOCAL_AI_API_KEY=
```

### LM Studio 配置
```env
LOCAL_AI_BASE_URL=http://localhost:1234
LOCAL_AI_MODEL=llama-2-7b-chat
LOCAL_AI_API_KEY=
```

## 故障排除

### 1. 连接失败
- 确认本地 AI 服务器正在运行
- 检查端口和地址配置
- 验证防火墙设置

### 2. 模型不存在
- 使用 `list_models` 工具查看可用模型
- 确认模型名称拼写正确
- 检查模型是否已下载

### 3. API 密钥错误
- 某些本地服务不需要 API 密钥，可留空
- 检查 API 密钥格式和权限

## 扩展开发

您可以根据需要扩展更多工具：

```javascript
// 添加新工具
{
  name: 'summarize_text',
  description: '文本摘要生成',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: '要摘要的文本'
      },
      length: {
        type: 'string',
        enum: ['short', 'medium', 'long'],
        description: '摘要长度'
      }
    },
    required: ['text']
  }
}
```

## 许可证

MIT License