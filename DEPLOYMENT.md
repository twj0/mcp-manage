# MCP Manager 部署指南

## Ubuntu 22 VPS 部署说明

### 系统要求
- Ubuntu 22.04 LTS
- Node.js >= 18.0.0
- npm >= 8.0.0
- 至少 1GB RAM
- 至少 2GB 磁盘空间

### 1. 安装 Node.js 和 npm

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v18.x.x 或更高版本
npm --version   # 应该显示 8.x.x 或更高版本
```

### 2. 部署应用程序

```bash
# 创建应用目录
sudo mkdir -p /opt/mcp-manager
sudo chown $USER:$USER /opt/mcp-manager

# 上传代码到服务器（使用 scp、git clone 或其他方式）
cd /opt/mcp-manager

# 安装依赖
npm install

# 创建日志目录
mkdir -p logs

# 创建配置目录（如果不存在）
mkdir -p config
```

### 3. 环境配置

```bash
# 复制环境配置模板
cp .env.example .env

# 编辑环境配置
nano .env
```

推荐的生产环境配置：
```env
# 服务器配置
NODE_ENV=production
PORT=3456
HOST=0.0.0.0

# WebDAV 配置（可选）
WEBDAV_URL=https://your-webdav-server.com/dav
WEBDAV_USERNAME=your-username
WEBDAV_PASSWORD=your-password
WEBDAV_AUTO_BACKUP=true
WEBDAV_BACKUP_RETENTION=10
```

### 4. 防火墙配置

```bash
# 允许应用端口
sudo ufw allow 3456/tcp

# 如果使用 nginx 反向代理
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 5. 使用 PM2 进行进程管理

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start start-web-server.js --name "mcp-manager"

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 status
pm2 logs mcp-manager
```

### 6. Nginx 反向代理（推荐）

创建 nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/mcp-manager
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket 支持
    location /ws {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE 支持
    location /sse {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/mcp-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL 证书（使用 Let's Encrypt）

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

### 8. 监控和维护

```bash
# 查看应用日志
pm2 logs mcp-manager

# 重启应用
pm2 restart mcp-manager

# 更新应用
cd /opt/mcp-manager
git pull  # 如果使用 git
npm install  # 安装新依赖
pm2 restart mcp-manager

# 系统资源监控
pm2 monit
```

### 9. 备份策略

```bash
# 创建备份脚本
sudo nano /opt/mcp-manager/backup.sh
```

备份脚本内容：
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mcp-manager"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz config/

# 保留最近 7 天的备份
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/config_$DATE.tar.gz"
```

设置定时备份：
```bash
chmod +x /opt/mcp-manager/backup.sh
sudo crontab -e
# 添加以下行（每天凌晨 2 点备份）：
# 0 2 * * * /opt/mcp-manager/backup.sh
```

### 10. 故障排除

#### 常见问题：

1. **端口被占用**
   ```bash
   sudo lsof -i :3456
   sudo kill -9 <PID>
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /opt/mcp-manager
   chmod -R 755 /opt/mcp-manager
   ```

3. **内存不足**
   ```bash
   # 创建交换文件
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

4. **查看系统日志**
   ```bash
   sudo journalctl -u nginx
   pm2 logs mcp-manager --lines 100
   ```

### 11. 安全建议

1. **更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```

3. **定期更新依赖**
   ```bash
   npm audit
   npm update
   ```

4. **使用强密码和密钥认证**
   - 禁用 SSH 密码登录
   - 使用 SSH 密钥认证
   - 定期更换密码

### 12. 访问应用

部署完成后，可以通过以下方式访问：

- **Web 界面**: `http://your-domain.com` 或 `http://your-server-ip:3456`
- **MCP 端点**: 
  - HTTP JSON-RPC: `http://your-domain.com/mcp`
  - Server-Sent Events: `http://your-domain.com/sse`
  - WebSocket: `ws://your-domain.com/ws`

### 13. 性能优化

1. **启用 gzip 压缩**（已在应用中启用）
2. **使用 CDN**（如果需要）
3. **数据库优化**（如果使用数据库）
4. **缓存策略**（已在应用中配置）

---

## 快速部署脚本

创建一键部署脚本：

```bash
#!/bin/bash
# quick-deploy.sh

set -e

echo "🚀 开始部署 MCP Manager..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建必要目录
mkdir -p logs config

# 复制环境配置
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置环境变量"
fi

# 启动应用
echo "🚀 启动应用..."
pm2 start start-web-server.js --name "mcp-manager"
pm2 save

echo "✅ 部署完成！"
echo "🌐 访问地址: http://localhost:3456"
echo "📊 查看状态: pm2 status"
echo "📝 查看日志: pm2 logs mcp-manager"
```

使用方法：
```bash
chmod +x quick-deploy.sh
./quick-deploy.sh
```