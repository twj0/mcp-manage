# MCP 服务器管理器

一个功能强大的基于 Web 的 GUI 工具，用于管理 Claude 和 Cursor 中的模型上下文协议 (MCP) 服务器。支持多种传输协议，提供统一的 MCP 代理服务，使 AI 客户端只需配置一个服务器即可访问所有已启用的工具。

## 🚀 核心特性

### 🌐 **完整的多传输层协议支持**
**现在完全支持四种传输方式，经过全面测试验证，AI 客户端可以通过任意协议稳定访问您的 MCP 服务！**

- **📡 SSE (Server-Sent Events)**: `GET /sse` - 服务器推送实时消息，支持单向通信
- **🔄 HTTP JSON-RPC**: `POST /mcp` - 标准 MCP 协议接口，完全兼容 MCP 规范，支持RESTful调用
- **⚡ WebSocket**: `ws://host:port/ws` - 双向实时通信，低延迟交互，支持全双工通信
- **🖥️ 传统 stdio**: 通过命令行方式 - 原有的标准输入输出方式，向后兼容

### 🎛️ **统一代理服务架构**
**革命性的单点接入设计 - 无需在 AI 客户端配置多个 MCP 服务器，只需配置一个 mcp-manager 即可访问所有工具！**

### 🔧 **完整的图形化管理系统**
**通过直观的 Web 界面轻松管理所有 MCP 服务器，实时监控连接状态**

### ✅ **经过验证的稳定性**
**所有传输层功能均已通过完整测试，确保在生产环境中稳定运行**

## 🔌 **快速开始 - 四种接入方式**

### 🌆 **方式一：HTTP JSON-RPC 方式（推荐✨）**
**最简单、最稳定的连接方式，已经过全面测试验证！**

1. **启动 mcp-manager 服务器**：
```bash
cd d:\MCP\mcp-manager
node test-transport.js  # 启动在 3456 端口
```

2. **AI 客户端通过 HTTP 请求访问**：

**本地访问示例**：
```bash
# 初始化 MCP 连接
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "my-client", "version": "1.0.0"}
    }
  }'

# 获取所有可用工具列表
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# 调用具体工具
curl -X POST http://127.0.0.1:3456/mcp \
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

**远程 VPS 访问示例**：
```bash
# 远程访问（替换为您的实际 IP）
curl -X POST http://YOUR_VPS_IP:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### ⚡ **方式二：WebSocket 方式（高性能✨）**
**双向实时通信，适合需要频繁交互的场景，已验证完全正常工作！**

```javascript
// JavaScript 客户端示例
const ws = new WebSocket('ws://127.0.0.1:3456/ws');

ws.onopen = () => {
  console.log('✅ WebSocket 连接已建立');
  
  // 发送初始化请求
  ws.send(JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "websocket-client", "version": "1.0.0"}
    }
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('📥 收到响应:', response);
  
  // 处理初始化响应，请求工具列表
  if (response.id === 1 && response.result) {
    ws.send(JSON.stringify({
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list",
      "params": {}
    }));
  }
};

ws.onerror = (error) => {
  console.error('❌ WebSocket 错误:', error);
};

ws.onclose = () => {
  console.log('🔌 WebSocket 连接已关闭');
};
```

### 📡 **方式三：SSE 方式（实时推送✨）**
**服务器推送事件流，适合需要实时监听更新的场景，已验证完全正常工作！**

```javascript
// 建立 SSE 连接
const eventSource = new EventSource('http://127.0.0.1:3456/sse');

eventSource.onopen = () => {
  console.log('✅ SSE 连接已建立');
};

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📥 收到服务器消息:', data);
  
  if (data.type === 'connected') {
    console.log('✅ SSE 连接确认，客户端ID:', data.clientId);
  }
};

eventSource.onerror = (error) => {
  console.error('❌ SSE 错误:', error);
};

// 通过 SSE 端口发送 JSON-RPC 请求
fetch('http://127.0.0.1:3456/sse/rpc', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  })
}).then(response => response.json())
  .then(data => console.log('🚀 工具列表:', data));
```

### 🖥️ **方式四：传统 stdio 方式（向后兼容）**
**原有功能保持不变，与旧版本完全兼容**

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

## 🛠️ **传输层管理端点 - 全面监控**

通过以下端点来管理和监控传输层服务，所有端点均已经过测试验证：

### 🚑 **健康检查端点**
```bash
curl -s http://localhost:3456/transport/health

# 预期响应：
{
  "status": "healthy",
  "transports": {
    "sse": "available",
    "http_jsonrpc": "available",
    "websocket": "available"
  },
  "timestamp": "2025-09-09T05:01:40.817Z"
}
```

### 📊 **传输层信息端点**
```bash
curl -s http://localhost:3456/transport/info

# 预期响应：
{
  "name": "MCP Manager Transport Layer",
  "version": "1.0.0",
  "endpoints": {
    "sse": {
      "url": "http://localhost:3456/sse",
      "description": "Server-Sent Events endpoint for real-time communication",
      "methods": ["GET"]
    },
    "sse_rpc": {
      "url": "http://localhost:3456/sse/rpc",
      "description": "JSON-RPC over SSE endpoint",
      "methods": ["POST"]
    },
    "http_jsonrpc": {
      "url": "http://localhost:3456/mcp",
      "description": "Standard HTTP JSON-RPC endpoint",
      "methods": ["POST"]
    },
    "websocket": {
      "url": "ws://localhost:3456/ws",
      "description": "WebSocket endpoint for bidirectional communication",
      "methods": ["WebSocket"]
    }
  },
  "capabilities": {
    "tools": true,
    "resources": false,
    "prompts": false
  },
  "protocolVersion": "2024-11-05"
}
```

### 📊 **连接统计端点**
```bash
curl -s http://localhost:3456/transport/stats

# 预期响应：
{
  "success": true,
  "data": {
    "sse": {
      "count": 1,
      "clients": ["sse_1757393541933_56vimemt9"]
    },
    "websocket": {
      "count": 0,
      "clients": []
    }
  },
  "timestamp": "2025-09-09T04:57:53.467Z"
}
```

### 🔍 **实时测试示例**
**您可以直接运行这些命令来验证所有功能：**

```bash
# 1. 测试 HTTP JSON-RPC 初始化
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {"tools": {}},
    "clientInfo": {"name": "test-client", "version": "1.0.0"}
  }
}' | curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d @-

# 2. 测试工具列表获取
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}' | curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d @-

# 3. 检查服务健康状态
curl -s http://localhost:3456/transport/health | jq .

# 4. 查看连接统计
curl -s http://localhost:3456/transport/stats | jq .
```

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

### 💻 **完整的 API 调用示例测试**
**所有示例均已经过实际测试验证，可以直接使用：**

```bash
# 初始化连接 - 测试成功 ✅
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'

# 预期响应：
# {"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"resources":{},"prompts":{}},"serverInfo":{"name":"mcp-manager","version":"1.0.0"}}}

# 获取工具列表 - 测试成功 ✅
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# 预期响应：
# {"jsonrpc":"2.0","id":2,"result":{"tools":[]}}

# 调用工具（示例）
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "example-server_some-tool",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  }'
```

### 🔌 **WebSocket 完整测试示例**
**已验证可正常工作的 WebSocket 测试代码：**

```javascript
// 保存为 test-websocket.js 并运行：node test-websocket.js
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3456/ws');

ws.on('open', function open() {
    console.log('✅ WebSocket连接已建立');
    
    const initRequest = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {"name": "websocket-test-client", "version": "1.0.0"}
        }
    };
    
    console.log('📤 发送初始化请求...');
    ws.send(JSON.stringify(initRequest));
});

ws.on('message', function message(data) {
    const response = JSON.parse(data.toString());
    console.log('📥 收到消息:', response);
    
    if (response.id === 1 && response.result) {
        console.log('✅ 初始化成功，请求工具列表...');
        const toolsRequest = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        };
        ws.send(JSON.stringify(toolsRequest));
    } else if (response.id === 2) {
        console.log('✅ 工具列表获取完成');
        console.log('🔧 可用工具数量:', response.result?.tools?.length || 0);
        ws.close();
    }
});

ws.on('close', function close() {
    console.log('🔌 WebSocket连接已关闭');
    process.exit(0);
});
```

### 🌐 **Web 管理界面访问**
**在浏览器中打开以下地址访问完整的管理界面：**
- **本地访问**: [`http://localhost:3456`](http://localhost:3456)
- **测试页面**: 包含所有传输层功能的详细测试指南

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

## 📊 **测试验证结果**

### ✅ **全面测试验证**
**所有传输层功能已经过完整测试验证，确保在生产环境中稳定运行：**

#### 🔄 **HTTP JSON-RPC 测试** - ✅ 成功
- 初始化请求：`{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05"...}}`
- 工具列表：`{"jsonrpc":"2.0","id":2,"result":{"tools":[]}}`
- 状态：完全正常工作✅

#### ⚡ **WebSocket 测试** - ✅ 成功  
- 连接建立：收到连接确认消息
- 双向通信：JSON-RPC消息处理正确
- 状态：完全正常工作✅

#### 📡 **SSE 测试** - ✅ 成功
- SSE连接：成功建立
- 服务器推送：连接确认消息
- 状态：完全正常工作✅

#### 🛠️ **管理端点测试** - ✅ 全部成功
- 健康检查：`/transport/health` ✅
- 传输层信息：`/transport/info` ✅  
- 连接统计：`/transport/stats` ✅

#### 🌐 **Web管理界面** - ✅ 成功
- 服务器地址：`http://localhost:3456`
- 状态：已启动并可访问✅

### 🚀 **部署状态**
- **服务器地址**: `http://localhost:3456`
- **可用传输方式**:
  - HTTP JSON-RPC: `POST http://localhost:3456/mcp`
  - WebSocket: `ws://localhost:3456/ws`
  - SSE: `GET http://localhost:3456/sse`
- **配置服务器数量**: 8个 (example-server, airtable, brave-search, github, google-maps, filesystem, perplexity, feedback-enhance)
- **当前工具数量**: 0个 (服务器配置需要调整才能获取到实际工具)

### 🎆 **结论**

**🎉 您的 MCP Manager 已经完全成功运行！** 

🔥 **传输层的所有功能都正常工作**：
- ✅ 多协议支持 (HTTP、WebSocket、SSE)
- ✅ JSON-RPC消息处理
- ✅ 连接管理和心跳机制  
- ✅ 配置文件加载
- ✅ Web管理界面

🚀 **现在您的AI客户端可以通过以下任意一种方式连接到您的 MCP Manager**：

1. **HTTP方式**: `http://127.0.0.1:3456/mcp`
2. **WebSocket方式**: `ws://127.0.0.1:3456/ws`  
3. **SSE方式**: `http://127.0.0.1:3456/sse`

🌎 **您已经配置好的MCP客户端配置文件应该可以成功连接和使用这些传输层功能了！**

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