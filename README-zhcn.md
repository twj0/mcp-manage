# MCP 服务器管理器

一个功能强大的基于 Web 的 GUI 工具，用于管理 Claude 和 Cursor 中的模型上下文协议 (MCP) 服务器。支持多种传输协议，提供统一的 MCP 代理服务，使 AI 客户端只需配置一个服务器即可访问所有已启用的工具。

## 🚀 核心特性

### 🌐 多传输层协议支持
**现在支持多种传输方式，让 AI 客户端可以通过不同协议访问您的 MCP 服务！**

- **📡 SSE (Server-Sent Events)**: `GET /sse` - 服务器推送实时消息
- **🔄 HTTP JSON-RPC**: `POST /mcp` - 标准 MCP 协议接口，完全兼容 MCP 规范
- **⚡ WebSocket**: `ws://host:port/ws` - 双向实时通信，低延迟交互
- **🖥️ 传统 stdio**: 通过命令行方式 - 原有的标准输入输出方式

### 🎛️ 统一代理服务
**无需在 AI 客户端配置多个 MCP 服务器，只需配置一个 mcp-manager 即可访问所有工具！**

### 🔧 图形化管理界面
**通过直观的 Web 界面轻松管理所有 MCP 服务器**

## 🔌 快速开始

### 方式一：传统 stdio 方式（原有功能）

1. 在 [`config.json`](config.json) 中配置您的 MCP 服务器
2. 在您的 AI 客户端中添加此服务器：
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["path/to/mcp-manager/bin/mcp-server.js"]
    }
  }
}
```
3. 使用带有前缀名称的工具：`{服务器名称}_{工具名称}`
4. 通过 Web 界面动态管理服务器

### 方式二：HTTP JSON-RPC 方式（新增✨）

1. 启动 mcp-manager 服务器：`npm start`
2. AI 客户端通过 HTTP 请求访问：

```bash
# 本地访问
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# 远程 VPS 访问
curl -X POST http://YOUR_VPS_IP:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### 方式三：WebSocket 方式（新增⚡）

```javascript
// JavaScript 客户端示例
const ws = new WebSocket('ws://127.0.0.1:3456/ws');

ws.onopen = () => {
  // 发送初始化请求
  ws.send(JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": { "tools": {} },
      "clientInfo": { "name": "my-client", "version": "1.0.0" }
    }
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('收到响应:', response);
};
```

### 方式四：SSE 方式（新增📡）

```javascript
// 建立 SSE 连接
const eventSource = new EventSource('http://127.0.0.1:3456/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到服务器消息:', data);
};

// 发送 JSON-RPC 请求
fetch('http://127.0.0.1:3456/sse/rpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  })
});
```

## 🛠️ 传输层管理端点

访问以下端点来管理和监控传输层服务：

- **健康检查**: `GET /transport/health` - 检查传输层服务状态
- **传输层信息**: `GET /transport/info` - 获取所有可用端点和功能信息
- **连接统计**: `GET /transport/stats` - 查看当前连接统计信息

## 📋 主要功能

- 🎛️ 通过简单的切换开关启用/禁用 MCP 服务器
- 🔄 更改在 Claude 和 Cursor 之间自动同步
- 🛠️ 查看每个服务器可用的工具
- 🔒 安全处理环境变量和 API 密钥
- 📱 响应式设计，适用于任何屏幕尺寸
- 🌐 支持本地和远程 VPS 部署
- 📡 多种传输协议支持（stdio、HTTP、WebSocket、SSE）

![MCP 服务器管理器界面](https://github.com/MediaPublishing/mcp-manager/blob/main/MCP-Server-Manager.png?raw=true)

## 🚀 安装与部署

### 本地安装

1. 克隆此仓库：
```bash
git clone https://github.com/yourusername/mcp-manager.git
cd mcp-manager
```

2. 安装依赖：
```bash
npm install
```

3. 创建配置文件：
```bash
cp config/config.example.json config.json
```

4. 启动服务器：
```bash
npm start
```

5. 在浏览器中打开 [`http://localhost:3456`](http://localhost:3456)

### 远程 VPS 部署

```bash
# 使用自定义端口
PORT=8080 npm start

# 使用 PM2 进程管理（推荐生产环境）
npm install -g pm2
pm2 start npm --name "mcp-manager" -- start
pm2 startup
pm2 save
```

## ⚙️ 配置

MCP 服务器管理器使用以下配置文件：

- [`config.json`](config.json)：服务器主配置文件
- Claude 配置：
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
- Cursor 配置：
  - macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
  - Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
  - Linux: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### 配置示例

```json
{
  "mcpServers": {
    "example-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    },
    "remote-server": {
      "transport": "sse",
      "url": "https://api.example.com/mcp/sse",
      "auth": {
        "type": "bearer",
        "value": "your-bearer-token"
      }
    }
  }
}
```

## 📖 使用方法

### Web 界面管理

1. 启动 MCP 服务器管理器
2. 在浏览器中打开管理界面
3. 使用切换开关启用/禁用服务器
4. 点击"保存更改"以应用您的更改
5. 配置会自动同步到 Claude 和 Cursor

### API 调用示例

```bash
# 初始化连接
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": { "tools": {} },
      "clientInfo": { "name": "test-client", "version": "1.0.0" }
    }
  }'

# 获取工具列表
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# 调用工具
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "server_name_tool_name",
      "arguments": {}
    }
  }'
```

## 🏷️ 关键词

- 模型上下文协议 (MCP)
- Claude AI / Anthropic Claude
- Cursor 编辑器
- MCP 服务器管理
- AI 工具管理
- 多传输协议支持
- WebSocket / SSE / HTTP JSON-RPC
- VPS 远程部署
- 统一代理服务

## 🤝 贡献

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [`LICENSE`](LICENSE) 文件。

## 🙏 致谢

- 专为 Anthropic 的 Claude AI 使用而构建
- 兼容 Cursor 编辑器
- 使用模型上下文协议 (MCP)
- 支持多种现代传输协议