
# MCP Manage

A Web-based GUI tool for managing Model Context Protocol (MCP) servers in Claude and Cursor. It supports both local and remote deployment and provides a unified MCP server proxy function.

## ✨ Features

### Core Functions
- 🌐 **Web Management Interface**: Access the management interface in your browser via port 3456.
- 🔄 **MCP Server Proxy**: Acts as a single MCP server for all tools to access.
- ⚙️ **Dynamic Management**: Add/remove MCP servers in real-time without restarting.
- 🔌 **Multiple Configuration Methods**: Supports various configuration methods such as JSON, SSE, etc.
- 🏠 **Local/Remote Deployment**: Supports deployment on both local machines and remote VPS.

### Advantages
- 🔒 **Simplified Configuration**: Only one MCP server needs to be configured in your AI client.
- 📊 **Centralized Management**: Manage all MCP servers uniformly through the web interface.
- 🔄 **Automatic Synchronization**: Configuration changes are automatically synchronized to Claude and Cursor.
- 🛡️ **Secure Handling**: Securely handles environment variables and API keys.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage

# Install dependencies
npm install

# Create a configuration file
cp config.example.json config.json

# Start the service
npm start
```

## 🏠 Deployment Modes

### 1. Local Deployment
Run on your local computer and access via your local IP address:

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\path\\to\\mcp-manage\\bin\\mcp-server.js"]
    }
  }
}```

### 2. Remote VPS Deployment
Run on a remote server and access via the remote IP + port 3456:

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

## 📝 Configuration Guide

### Configuring for AI Clients

#### Cursor/Cline Configuration
Edit the MCP settings file:
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

- `config.json`: Main configuration file for the server.
- **Claude config**: Located at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).
- **Cursor config**: Located at `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS).

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







