# mcp-manage

`mcp-manage` is an MCP service that can be managed through a web interface. It provides one-click deployment and uninstallation for easy use on a remote Linux host.

## Features

*   **One-Click Deployment**: Deploy the application on a remote Linux host with a single command.
*   **Web Interface**: Access and manage the service through a browser.
*   **Background Service**: The project runs as a persistent background service.
*   **Convenient Uninstallation**: A global command is provided for quick removal of the project.

## Deployment

Run the following command on your Linux server for one-click deployment:

```bash
curl -sSL https://raw.githubusercontent.com/twj0/mcp-manage/main/deploy.sh | bash
```

This script will automatically handle cloning the project, installing dependencies, and starting the service in the background.

## Access

After successful deployment, you can access `mcp-manage` by navigating to `http://<Your-Server-IP>:11451` in your web browser.

## Uninstallation

If you need to uninstall `mcp-manage`, simply run the following command in your terminal:

```bash
del-mcp-manage
```