# IDE/AI 扩展中配置 mcp-manager 指南

## 🎯 概述

本指南介绍如何在各种 IDE 和 AI 扩展中配置 mcp-manager，让您能够在编程环境中直接使用 MCP 工具。

## 📁 配置文件位置

### Windows
- **Cursor**: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **VS Code (Cline)**: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- **Claude Desktop**: `%APPDATA%\Claude\claude_desktop_config.json`

### macOS
- **Cursor**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **VS Code (Cline)**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Linux
- **Cursor**: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **VS Code (Cline)**: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Claude Desktop**: `~/.config/Claude/claude_desktop_config.json`

## 🔧 配置方法

### 1. Cursor IDE 配置

#### 通过 UI 界面配置：
1. 打开 Cursor
2. 点击左下角设置图标
3. 搜索 "MCP" 或 "Model Context Protocol"
4. 点击 "Edit in settings.json"
5. 添加配置

#### 直接编辑配置文件：
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"],
      "env": {}
    }
  }
}
```

### 2. VS Code + Cline 扩展配置

#### 通过命令面板：
1. 按 `Ctrl/Cmd + Shift + P`
2. 输入 "Cline: Open MCP Settings"
3. 编辑配置文件

#### 配置内容：
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"]
    }
  }
}
```

### 3. Claude Desktop 配置

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"]
    }
  }
}
```

## 📝 完整配置示例

### 基础配置（只使用 mcp-manager）
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"]
    }
  }
}
```

### 高级配置（包含环境变量）
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "mcp:*"
      }
    }
  }
}
```

### 多服务器配置
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"]
    },
    "local-ai": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\examples\\local-ai-mcp\\index.js"],
      "env": {
        "LOCAL_AI_BASE_URL": "http://localhost:8080",
        "LOCAL_AI_MODEL": "gpt-3.5-turbo"
      }
    }
  }
}
```

## 🚀 使用 UVX 方式（推荐）

如果您将 mcp-manager 发布为 npm 包，可以使用更简洁的配置：

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "uvx",
      "args": ["mcp-manager"]
    }
  }
}
```

## 🐳 使用 Docker 方式

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "mcp-manager:latest"
      ]
    }
  }
}
```

## ✅ 验证配置

配置完成后，可以通过以下方式验证：

### 1. 在聊天中测试
在 AI 扩展的聊天界面中输入：
```
请使用 launch_manager 工具启动 MCP 管理界面
```

### 2. 检查工具列表
在聊天中询问：
```
请列出所有可用的 MCP 工具
```

应该看到类似以下工具：
- `launch_manager` - 启动管理界面
- `brave-search_search` - Brave 搜索
- `github_create_repository` - 创建 GitHub 仓库
- 等等...

## 🔄 配置热重载

修改配置后：
1. **Cursor**: 重启 Cursor 或重新加载窗口 (`Ctrl/Cmd + R`)
2. **VS Code**: 重新加载窗口 (`Ctrl/Cmd + Shift + P` → "Developer: Reload Window")
3. **Claude Desktop**: 重启应用程序

## 🛠️ 故障排除

### 常见问题 1: 工具不显示
**原因**: 配置文件路径错误或格式错误  
**解决**: 检查路径是否使用绝对路径，JSON 格式是否正确

### 常见问题 2: 权限错误
**原因**: Node.js 没有执行权限  
**解决**: 确保 Node.js 已正确安装并在 PATH 中

### 常见问题 3: 端口冲突
**原因**: mcp-manager Web 服务端口被占用  
**解决**: 修改 mcp-manager 的端口配置

## 📋 配置检查清单

- [ ] 确认 Node.js 已安装 (`node --version`)
- [ ] 确认 mcp-manager 路径正确
- [ ] 确认 JSON 配置格式无误
- [ ] 确认配置文件权限正确
- [ ] 重启 IDE/AI 扩展
- [ ] 测试工具是否可用

## 🎨 自定义配置

您可以根据需要自定义配置：

```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": [
        "D:\\MCP\\mcp-manager\\mcp-server.js"
      ],
      "env": {
        "MCP_MANAGER_PORT": "3456",
        "MCP_MANAGER_DEBUG": "true"
      }
    }
  }
}
```

这样配置后，您就可以在 IDE 的 AI 助手中直接使用 mcp-manager 提供的所有工具了！