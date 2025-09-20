# mcp-manage

`mcp-manage` 是一个可以通过 Web 界面进行管理的 MCP 服务，并提供了一键部署和卸载功能，方便在远程 Linux 主机上使用。

## 功能特性

*   **一键部署**：通过单个命令即可在远程 Linux 主机上完成部署。
*   **Web 界面**：通过浏览器即可访问和管理。
*   **后台运行**：项目作为后台服务持续运行。
*   **便捷卸载**：提供全局命令用于快速删除项目。

## 部署说明

在您的 Linux 服务器上运行以下命令即可完成一键部署：

```bash
curl -sSL https://raw.githubusercontent.com/twj0/mcp-manage/main/deploy.sh | bash
```

该脚本会自动完成项目克隆、依赖安装和后台启动等所有步骤。

## 访问方式

部署成功后，您可以通过浏览器访问 `http://<您的服务器IP>:3000` 来使用 `mcp-manage`。

## 卸载说明

如果您需要卸载 `mcp-manage`，只需在终端中运行以下命令：

```bash
del-mcp-manage