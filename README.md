# MCP Manager - 统一MCP服务器管理平台

一个基于Web的GUI工具，用于管理Claude和Cursor中的Model Context Protocol (MCP)服务器。支持本地和远程部署，提供统一的MCP服务器代理功能。

## ✨ 特性

### 核心功能
- 🌐 **Web管理界面**: 在浏览器中通过3456端口访问管理界面
- 🔄 **MCP服务器代理**: 作为单一MCP服务器提供所有工具访问
- ⚙️ **动态管理**: 实时添加/删除MCP服务器无需重启
- 🔌 **多种配置方式**: 支持JSON、SSE等多种配置方式
- 🏠 **本地/远程部署**: 支持本地和远程VPS部署

### 优势
- 🔒 **简化配置**: 在AI客户端只需配置一个MCP服务器
- 📊 **集中管理**: 通过Web界面统一管理所有MCP服务器
- 🔄 **自动同步**: 配置变更自动同步到Claude和Cursor
- 🛡️ **安全处理**: 安全处理环境变量和API密钥

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage

# 安装依赖
npm install

# 创建配置文件
cp config.example.json config.json

# 启动服务
npm start
```


## 🏠 部署模式

### 1. 本地部署
在本地计算机上运行，通过本机IP访问：

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\path\\to\\mcp-manage\\bin\\mcp-server.js"]
    }
  }
}
```

### 2. 远程VPS部署
在远程服务器上运行，通过远程IP+3456端口访问：

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["/path/to/mcp-manage/bin/mcp-server.js"]
    }
  }
}
```

## 📝 配置指南

### 为AI客户端配置

#### Cursor/Cline 配置
编辑MCP设置文件：
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manage\\bin\\mcp-server.js"]
    }
  }
}
```

## Configuration

The MCP Server Manager uses two configuration files:

- `config.json`: Main configuration file for the server
- Claude config: Located at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Cursor config: Located at `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS)

### Example Configuration

```json
{
  "mcpServers": {
    "example-server": {
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage

1. Launch the MCP Server Manager
2. Use the toggle switches to enable/disable servers
3. Click "Save Changes" to apply your changes
4. Restart Claude to activate the new configuration

## Keywords

- Model Context Protocol (MCP)
- Claude AI
- Anthropic Claude
- Cursor Editor
- MCP Server Management
- Claude Configuration
- AI Tools Management
- Claude Extensions
- MCP Tools
- AI Development Tools

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for use with Anthropic's Claude AI
- Compatible with the Cursor editor
- Uses the Model Context Protocol (MCP)
