# MCP Manager 部署修复指南

如果你在访问 `http://your-server-ip:11451` 时遇到 "File not found" 错误，请按照以下步骤修复：

## 快速修复

在你的Linux服务器上运行以下命令：

```bash
# 1. 进入项目目录
cd /root/mcp/mcp-manage  # 或者你的实际安装路径

# 2. 运行修复脚本
chmod +x fix-deployment.sh
./fix-deployment.sh

# 3. 重启服务
pm2 restart mcp-manager || npm start
```

## 手动修复步骤

如果自动修复脚本不工作，请手动执行以下步骤：

### 1. 检查文件结构

```bash
cd /root/mcp/mcp-manage  # 替换为你的实际路径
ls -la
```

确保你看到以下目录和文件：
- `public/` 目录
- `src/` 目录  
- `package.json`
- `start-web-server.js`
- `config.json`

### 2. 检查public目录

```bash
ls -la public/
```

应该包含：
- `index.html`
- `styles.css`
- `app.js`

### 3. 检查文件权限

```bash
chmod -R 755 .
chmod -R 644 public/*
```

### 4. 重新安装依赖

```bash
rm -rf node_modules package-lock.json
npm install
```

### 5. 检查配置文件

```bash
# 如果config.json不存在，从默认配置创建
if [ ! -f config.json ]; then
    cp config/default.json config.json
fi
```

### 6. 测试启动

```bash
# 停止现有进程
pkill -f "node.*start-web-server.js"
pm2 delete mcp-manager 2>/dev/null || true

# 启动服务器
npm start
```

## 常见问题解决

### 问题1: "ENOENT: no such file or directory"

**原因**: public目录或index.html文件缺失

**解决方案**:
```bash
# 检查文件是否存在
ls -la public/index.html

# 如果文件缺失，重新克隆项目
cd /root/mcp
rm -rf mcp-manage
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage
npm install
```

### 问题2: 端口被占用

**解决方案**:
```bash
# 查找占用端口的进程
netstat -tulpn | grep :11451

# 杀死进程
pkill -f "node.*start-web-server.js"
```

### 问题3: 权限问题

**解决方案**:
```bash
# 设置正确的所有者和权限
chown -R $USER:$USER /root/mcp/mcp-manage
chmod -R 755 /root/mcp/mcp-manage
```

## 验证修复

修复完成后，验证服务是否正常：

```bash
# 检查服务状态
curl -I http://localhost:11451

# 应该返回 HTTP/1.1 200 OK
```

如果返回200状态码，说明修复成功！

## 使用PM2管理服务

为了确保服务稳定运行，建议使用PM2：

```bash
# 安装PM2（如果未安装）
npm install -g pm2

# 启动服务
pm2 start start-web-server.js --name mcp-manager

# 设置开机自启
pm2 startup
pm2 save
```

## 获取帮助

如果问题仍然存在，请：

1. 检查服务器日志：`pm2 logs mcp-manager`
2. 运行诊断脚本：`node fix-public-files.js`
3. 提供错误信息和系统环境信息

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

- 操作系统版本：`cat /etc/os-release`
- Node.js版本：`node --version`
- 项目目录结构：`find . -type f -name "*.html" -o -name "*.js" -o -name "*.json" | head -20`
- 错误日志：完整的错误信息