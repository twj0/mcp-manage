# MCP Manager

一个功能强大的Web GUI工具，用于管理Claude和Cursor中的Model Context Protocol (MCP)服务器。支持多种传输协议，提供统一的MCP代理服务，让AI客户端只需配置一个服务器即可访问所有工具。

## 🚀 核心特性

### 🌐 多传输协议支持
- **HTTP JSON-RPC** - 标准MCP协议接口，完全兼容MCP规范
- **WebSocket** - 双向实时通信，低延迟全双工通信
- **Server-Sent Events (SSE)** - 服务器实时消息推送
- **传统stdio** - 命令行标准输入输出，向后兼容

### 🎛️ 统一代理服务架构
- **单点访问设计** - 无需在AI客户端配置多个MCP服务器
- **工具名称格式** - `{server_name}_{tool_name}`
- **动态配置管理** - 实时启用/禁用MCP服务器

### 🔧 完整的Web管理系统
- **直观的Web界面** - 易于使用的图形化管理
- **实时监控** - 连接状态和性能监控
- **配置管理** - 环境变量和API密钥安全处理
- **批量导入/导出** - JSON格式配置文件批量管理
- **WebDAV备份** - 远程自动备份和恢复功能

## 📦 安装和部署

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务器**
```bash
npm start
```

4. **访问管理界面**
```
http://localhost:3456
```

### 生产环境部署

1. **使用PM2管理进程**
```bash
# 启动服务
npm run cli start

# 查看状态
npm run cli status

# 停止服务
npm run cli stop

# 重启服务
npm run cli restart
```

2. **环境变量配置**
```bash
# 设置端口
export PORT=3456

# 设置环境
export NODE_ENV=production

# 设置CORS
export CORS_ORIGIN="*"

# 设置日志级别
export LOG_LEVEL=info
```

## 🔌 使用方法

### 方法1: HTTP JSON-RPC (推荐)

**AI客户端配置示例:**
```json
{
  "mcpServers": {
    "mcp-manager": {
      "transport": "http",
      "url": "http://localhost:3456/mcp"
    }
  }
}
```

**直接API调用:**
```bash
# 获取所有工具列表
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# 调用特定工具
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "feedback-enhance_analyze_feedback",
      "arguments": {
        "feedback": "这个代码写得不好"
      }
    }
  }'
```

### 方法2: WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3456/ws');

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

### 方法3: Server-Sent Events

```javascript
// 建立SSE连接
const eventSource = new EventSource('http://localhost:3456/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('服务器消息:', data);
};

// 发送JSON-RPC请求
fetch('http://localhost:3456/sse/rpc', {
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

### 方法4: 传统stdio

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

## ⚙️ 配置管理

### MCP服务器配置

编辑 `config.json` 文件添加MCP服务器:

```json
{
  "mcpServers": {
    "feedback-enhance": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\examples\\feedback-enhance-mcp\\index.js"],
      "env": {
        "FEEDBACK_MODEL": "enhanced",
        "ANALYSIS_DEPTH": "detailed"
      }
    },
    "filesystem": {
      "command": "node",
      "args": ["/path/to/filesystem/dist/index.js", "/allowed/directory"]
    },
    "github": {
      "command": "node",
      "args": ["/path/to/github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 3456 | 服务器端口 |
| `HOST` | localhost | 服务器主机 |
| `NODE_ENV` | development | 运行环境 |
| `LOG_LEVEL` | info | 日志级别 |
| `CORS_ORIGIN` | * | CORS允许的源 |
| `WEBDAV_URL` | - | WebDAV服务器URL |
| `WEBDAV_USERNAME` | - | WebDAV用户名 |
| `WEBDAV_PASSWORD` | - | WebDAV密码 |
| `WEBDAV_AUTO_BACKUP` | false | 是否启用自动备份 |
| `WEBDAV_BACKUP_RETENTION` | 10 | 备份保留数量 |

## 💾 配置管理和备份

### 批量导入/导出功能

MCP Manager 提供强大的配置批量管理功能：

#### 导出配置
- **完整导出** - 导出所有服务器配置，包含元数据
- **选择性导出** - 可选择包含或排除禁用的服务器
- **JSON格式** - 标准化的配置文件格式

```bash
# 通过API导出配置
curl -X GET "http://localhost:3456/api/config/export?includeDisabled=true" \
  -H "Accept: application/json" \
  -o config-backup.json
```

#### 导入配置
- **文件上传** - 支持通过Web界面上传配置文件
- **合并模式** - 将新配置与现有配置合并
- **覆盖模式** - 完全替换现有配置
- **验证检查** - 自动验证配置文件格式和内容

```bash
# 通过API导入配置
curl -X POST "http://localhost:3456/api/config/import" \
  -F "configFile=@config-backup.json" \
  -F "mode=merge"
```

### WebDAV远程备份

支持将配置自动备份到WebDAV服务器：

#### 配置WebDAV
```bash
# 设置环境变量
export WEBDAV_URL="https://your-webdav-server.com/dav"
export WEBDAV_USERNAME="your-username"
export WEBDAV_PASSWORD="your-password"
export WEBDAV_AUTO_BACKUP="true"
```

#### 备份功能
- **自动备份** - 配置更改时自动创建备份
- **手动备份** - 通过Web界面或API手动备份
- **备份列表** - 查看所有可用的备份文件
- **一键恢复** - 从备份快速恢复配置
- **自动清理** - 自动删除过期的备份文件

```bash
# 手动创建备份
curl -X POST "http://localhost:3456/api/config/webdav/backup"

# 查看备份列表
curl -X GET "http://localhost:3456/api/config/webdav/backups"

# 从备份恢复
curl -X POST "http://localhost:3456/api/config/webdav/restore/backup-20241201-120000.json"
```

#### WebDAV状态监控
- **连接状态** - 实时显示WebDAV连接状态
- **备份历史** - 显示备份创建时间和大小
- **错误诊断** - 详细的错误信息和解决建议

## 📊 监控和诊断

### 健康检查
```bash
curl http://localhost:3456/transport/health
```

### 连接统计
```bash
curl http://localhost:3456/transport/stats
```

### 服务信息
```bash
curl http://localhost:3456/transport/info
```

## 🛠️ 内置MCP服务器

项目包含以下示例MCP服务器:

### feedback-enhance-mcp
反馈分析和增强工具，提供:
- `analyze_feedback` - 分析反馈质量
- `enhance_feedback` - 智能增强反馈内容
- `suggest_feedback_improvements` - 提供改进建议
- `generate_feedback_template` - 生成反馈模板
- `feedback_sentiment_score` - 情感倾向评估

### 使用示例
```bash
# 分析反馈
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "feedback-enhance_analyze_feedback",
      "arguments": {
        "feedback": "这个代码写得不好，有很多问题。"
      }
    }
  }'
```

## 🔧 开发和扩展

### 项目结构
```
mcp-manager/
├── src/                    # 核心源代码
│   ├── app.js             # 主应用程序
│   ├── config/            # 配置管理
│   ├── services/          # 核心服务
│   ├── routes/            # 路由定义
│   ├── controllers/       # 控制器
│   └── middleware/        # 中间件
├── examples/              # 示例MCP服务器
├── public/                # Web界面文件
├── config/                # 配置文件
├── bin/                   # 可执行文件
└── scripts/               # 辅助脚本
```

### 添加新的MCP服务器

1. 在 `examples/` 目录创建新的MCP服务器
2. 在 `config.json` 中添加配置
3. 通过Web界面启用服务器
4. 工具将自动以 `{server_name}_{tool_name}` 格式可用

### API开发

项目提供完整的REST API:
- `GET /api/health` - 健康检查
- `GET /api/tools` - 获取所有工具
- `POST /api/tools/call` - 调用工具
- `GET /api/cursor-config` - 获取Cursor配置
- `GET /api/claude-config` - 获取Claude配置

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

- GitHub Issues: [提交问题](https://github.com/twj0/mcp-manage/issues)
- 文档: [查看文档](https://github.com/twj0/mcp-manage#readme)

---

**MCP Manager** - 让MCP服务器管理变得简单高效！