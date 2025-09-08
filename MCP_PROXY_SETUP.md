# MCP Manager 代理服务器配置指南

## 概述

现在 mcp-manager 支持作为一个 MCP 代理服务器使用。您只需要在 agent 配置中配置这一个 mcp-manager，就能使用配置在 config.json 中的所有 MCP 工具。

## 功能特性

✅ **工具代理**：自动加载所有启用的 MCP 服务器的工具  
✅ **工具重命名**：为每个工具添加服务器前缀，避免命名冲突  
✅ **动态管理**：通过 Web 界面启用/禁用服务器，实时更新可用工具  
✅ **统一入口**：只需配置一个 MCP 服务器就能使用多个工具  

## 安装依赖

首先安装 MCP SDK：

```bash
npm install @modelcontextprotocol/sdk
```

## Agent 配置

在您的 agent 配置文件中，只需添加这一个 MCP 服务器：

### Claude Desktop 配置
编辑 `~/.config/Claude/claude_desktop_config.json`：

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

### Cursor 配置
编辑 Cursor 的 MCP 设置文件：

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

## 工具命名规则

每个代理的工具都会按以下规则重命名：
- 原工具名：`search`
- 代理后：`brave-search_search`
- 格式：`{服务器名}_{原工具名}`

## 可用工具示例

假设您的 config.json 中配置了以下服务器：

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "node",
      "args": ["/path/to/brave-search/dist/index.js"],
      "env": {
        "BRAVE_API_KEY": "your-api-key"
      }
    },
    "github": {
      "command": "node", 
      "args": ["/path/to/github/dist/index.js"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      }
    }
  }
}
```

代理后的工具列表：
1. `launch_manager` - 启动管理界面
2. `brave-search_search` - Brave 搜索工具
3. `github_create_repository` - GitHub 创建仓库工具
4. `github_list_repositories` - GitHub 列出仓库工具
5. ... 其他工具

## 使用流程

1. **配置服务器**：在 config.json 中配置所需的 MCP 服务器
2. **启动管理界面**：使用 `launch_manager` 工具打开 Web 管理界面
3. **管理服务器**：在界面中启用/禁用需要的服务器
4. **使用工具**：直接调用代理后的工具名称

## 动态管理

- 通过 Web 界面启用/禁用服务器会实时更新可用工具列表
- 无需重启 agent，工具变更立即生效
- 所有配置自动同步到 Claude 和 Cursor

## 故障排除

### 1. 工具无法加载
- 检查 config.json 中的路径是否正确
- 确认目标 MCP 服务器的环境变量配置
- 查看控制台错误日志

### 2. 服务器启动失败
- 确认 MCP SDK 已正确安装
- 检查 Node.js 版本兼容性
- 验证配置文件 JSON 格式

### 3. 工具调用失败
- 确认目标服务器未被禁用
- 检查工具名称是否使用了正确的前缀
- 验证传入参数格式

## 注意事项

1. **路径配置**：确保 config.json 中的所有路径都是绝对路径
2. **环境变量**：敏感信息如 API 密钥要正确配置在 env 字段中
3. **权限管理**：确保 Node.js 进程有权限访问配置的文件路径
4. **资源管理**：代理会启动多个子进程，注意系统资源使用

## 高级配置

### 自定义工具前缀
如果需要自定义工具前缀规则，可以修改 mcp-server.js 中的 `getServerTools` 方法。

### 工具过滤
可以在代理层面过滤某些工具，避免暴露不需要的功能。

### 批量操作
通过 Web 界面可以快速启用/禁用多个服务器，实现批量工具管理。