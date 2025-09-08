# MCP Manager 代理配置示例

## Agent 配置文件示例

### 1. Claude Desktop 配置

在 `~/.config/Claude/claude_desktop_config.json` 中：

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

### 2. Cursor 配置

在 Cursor 的 MCP 设置文件中：

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

### 3. 其他 MCP 客户端配置

```json
{
  "mcpServers": {
    "all-tools-proxy": {
      "command": "node",
      "args": ["D:\\MCP\\mcp-manager\\mcp-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 使用示例

配置完成后，您将获得以下工具：

1. **管理工具**
   - `launch_manager` - 打开 Web 管理界面

2. **代理工具** (根据您的 config.json 配置)
   - `brave-search_search` - Brave 搜索
   - `github_create_repository` - 创建 GitHub 仓库  
   - `github_list_repositories` - 列出 GitHub 仓库
   - `airtable_list_bases` - 列出 Airtable 基础
   - `filesystem_read_file` - 读取文件
   - `google-maps_search` - Google 地图搜索
   - `perplexity_search` - Perplexity 搜索

## 启动和测试

### 启动代理服务器 (测试用)
```bash
npm run mcp
```

### 测试代理功能
```bash  
npm run test-proxy
```

### 启动 Web 管理界面
```bash
npm start
```

## 工具调用示例

在您的 agent 中，可以这样使用代理工具：

```javascript
// 启动管理界面
await callTool('launch_manager', {});

// 使用 Brave 搜索
await callTool('brave-search_search', {
  query: 'MCP protocol documentation'
});

// 创建 GitHub 仓库  
await callTool('github_create_repository', {
  name: 'my-new-repo',
  description: 'A new repository created via MCP'
});

// 读取文件
await callTool('filesystem_read_file', {
  path: '/path/to/file.txt'
});
```

## 动态管理

1. 使用 `launch_manager` 工具打开 Web 界面
2. 在界面中启用/禁用需要的 MCP 服务器  
3. 点击"保存更改"应用配置
4. 工具列表会实时更新，无需重启 agent

## 注意事项

- 确保 config.json 中的所有路径都是绝对路径
- API 密钥等敏感信息要正确配置在 env 字段中
- 首次使用时会自动安装 MCP SDK 依赖
- 工具名称会自动添加服务器前缀以避免冲突