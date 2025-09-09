# MCP 服务器管理器

一个基于 Web GUI 工具，用于管理 Claude 和 Cursor 中的模型上下文协议 (MCP) 服务器。此工具允许您通过用户友好的界面轻松启用/禁用 MCP 服务器及其工具。

## 🆕 新功能：MCP 代理服务器

**现在您可以将 mcp-manager 作为单个 MCP 服务器来访问所有已配置的 MCP 工具！**

无需在您的代理中配置多个 MCP 服务器，只需配置一个 mcp-manager 代理服务器即可访问所有已启用 MCP 服务器的工具。

### MCP 代理快速入门

1. 在 [`config.json`](config.json) 中配置您的 MCP 服务器
2. 在您的代理中，仅添加此服务器：
```json
{
  "mcpServers": {
    "mcp-manager": {
      "command": "node",
      "args": ["path/to/mcp-manager/mcp-server.js"]
    }
  }
}
```
3. 使用带有前缀名称的工具：`{服务器名称}_{工具名称}`
4. 通过 Web 界面动态管理服务器

📖 **[完整的代理设置指南](./MCP_PROXY_SETUP.md)**

## 功能

- 🎛️ 通过简单的切换开关启用/禁用 MCP 服务器
- 🔄 更改在 Claude 和 Cursor 之间自动同步
- 🛠️ 查看每个服务器可用的工具
- 🔒 安全处理环境变量和 API 密钥
- 📱 响应式设计，适用于任何屏幕尺寸

![MCP 服务器管理器界面](https://github.com/MediaPublishing/mcp-manager/blob/main/MCP-Server-Manager.png?raw=true)

## 安装

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

## 配置

MCP 服务器管理器使用两个配置文件：

- [`config.json`](config.json)：服务器主配置文件
- Claude 配置：位于 `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Cursor 配置：位于 `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` (macOS)

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
    }
  }
}
```

## 使用方法

1. 启动 MCP 服务器管理器
2. 使用切换开关启用/禁用服务器
3. 点击“保存更改”以应用您的更改
4. 重启 Claude 以激活新配置

## 关键词

- 模型上下文协议 (MCP)
- Claude AI
- Anthropic Claude
- Cursor 编辑器
- MCP 服务器管理
- Claude 配置
- AI 工具管理
- Claude 扩展
- MCP 工具
- AI 开发工具

## 贡献

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [`LICENSE`](LICENSE) 文件。

## 致谢

- 专为 Anthropic 的 Claude AI 使用而构建
- 兼容 Cursor 编辑器
- 使用模型上下文协议 (MCP)