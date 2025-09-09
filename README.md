# MCP Manager

A powerful Web-based GUI tool for managing Model Context Protocol (MCP) servers in Claude and Cursor. It supports multiple transport protocols and provides a unified MCP proxy service, allowing AI clients to access all enabled tools by configuring just one server.

## 🚀 Core Features

### 🌐 Multi-Transport Protocol Support
**Now supports multiple transport methods, allowing AI clients to access your MCP services via different protocols!**

- **📡 SSE (Server-Sent Events)**: `GET /sse` - Server-side real-time message push
- **🔄 HTTP JSON-RPC**: `POST /mcp` - Standard MCP protocol interface, fully compatible with MCP specifications
- **⚡ WebSocket**: `ws://host:port/ws` - Bidirectional real-time communication with low latency
- **🖥️ Traditional stdio**: Command-line method - Original standard input/output method

### 🎛️ Unified Proxy Service
**No need to configure multiple MCP servers in AI clients - just configure one mcp-manager to access all tools!**

### 🔧 Graphical Management Interface
**Easily manage all MCP servers through an intuitive web interface**

## 🔌 Quick Start

### Method 1: Traditional stdio Method (Original Feature)

1. Configure your MCP servers in [`config.json`](config.json)
2. Add this server to your AI client:
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
3. Use tools with prefixed names: `{server_name}_{tool_name}`
4. Dynamically manage servers through the web interface

### Method 2: HTTP JSON-RPC Method (New ✨)

1. Start mcp-manager server: `npm start`
2. AI clients access via HTTP requests:

```bash
# Local access
curl -X POST http://127.0.0.1:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Remote VPS access
curl -X POST http://YOUR_VPS_IP:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Method 3: WebSocket Method (New ⚡)

```javascript
// JavaScript client example
const ws = new WebSocket('ws://127.0.0.1:3456/ws');

ws.onopen = () => {
  // Send initialization request
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
  console.log('Received response:', response);
};
```

### Method 4: SSE Method (New 📡)

```javascript
// Establish SSE connection
const eventSource = new EventSource('http://127.0.0.1:3456/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received server message:', data);
};

// Send JSON-RPC request
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

## 🛠️ Transport Layer Management Endpoints

Access the following endpoints to manage and monitor transport layer services:

- **Health Check**: `GET /transport/health` - Check transport layer service status
- **Transport Info**: `GET /transport/info` - Get all available endpoints and feature information  
- **Connection Stats**: `GET /transport/stats` - View current connection statistics

## 📋 Main Features

- 🎛️ Enable/disable MCP servers with simple toggle switches
- 🔄 Changes automatically sync between Claude and Cursor
- 🛠️ View available tools for each server
- 🔒 Securely handle environment variables and API keys
- 📱 Responsive design for any screen size
- 🌐 Support for local and remote VPS deployment
- 📡 Multiple transport protocol support (stdio, HTTP, WebSocket, SSE)

## 🚀 Installation & Deployment

### Local Installation

1. Clone this repository:
```bash
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage
```

2. Install dependencies:
```bash
npm install
```

3. Create configuration file:
```bash
cp config/config.example.json config.json
```

4. Start the server:
```bash
npm start
```

5. Open [`http://localhost:3456`](http://localhost:3456) in your browser

### Remote VPS Deployment

```bash
# Use custom port
PORT=8080 npm start

# Use PM2 process management (recommended for production)
npm install -g pm2
pm2 start npm --name "mcp-manager" -- start
pm2 startup
pm2 save
```

## ⚙️ Configuration

MCP Server Manager uses the following configuration files:

- [`config.json`](config.json): Main server configuration file
- Claude configuration:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
- Cursor configuration:
  - macOS: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
  - Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
  - Linux: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

### Configuration Example

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

## 📖 Usage

### Web Interface Management

1. Start MCP Server Manager
2. Open the management interface in your browser
3. Use toggle switches to enable/disable servers
4. Click "Save Changes" to apply your changes
5. Configuration automatically syncs to Claude and Cursor

### API Call Examples

```bash
# Initialize connection
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

# Get tools list
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'

# Call tool
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

## 🏷️ Keywords

- Model Context Protocol (MCP)
- Claude AI / Anthropic Claude
- Cursor Editor
- MCP Server Management
- AI Tool Management
- Multi-Transport Protocol Support
- WebSocket / SSE / HTTP JSON-RPC
- VPS Remote Deployment
- Unified Proxy Service

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [`LICENSE`](LICENSE) file for details.

## 🙏 Acknowledgments

- Built specifically for Anthropic's Claude AI
- Compatible with Cursor Editor
- Uses Model Context Protocol (MCP)
- Supports multiple modern transport protocols