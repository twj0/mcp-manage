#!/bin/bash
# MCP Manager 快速部署脚本
# 适用于 Ubuntu 22.04 LTS

set -e

echo "🚀 开始部署 MCP Manager..."

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  请不要使用 root 用户运行此脚本"
    exit 1
fi

# 更新系统包
echo "📦 更新系统包..."
sudo apt update

# 检查并安装 Node.js
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    echo "📦 安装 Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 检查并安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

# 安装应用依赖
echo "📦 安装应用依赖..."
npm install

# 创建必要目录
echo "📁 创建必要目录..."
mkdir -p logs config

# 复制环境配置文件
if [ ! -f .env ]; then
    echo "📝 创建环境配置文件..."
    cp .env.example .env
    echo "⚠️  请根据需要编辑 .env 文件配置环境变量"
fi

# 设置防火墙（如果启用了 ufw）
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo "🔥 配置防火墙..."
    sudo ufw allow 3456/tcp
fi

# 停止可能存在的旧进程
echo "🛑 停止旧进程..."
pm2 delete mcp-manager 2>/dev/null || true

# 启动应用
echo "🚀 启动 MCP Manager..."
pm2 start start-web-server.js --name "mcp-manager"

# 设置开机自启
echo "⚙️  配置开机自启..."
pm2 startup | grep -E '^sudo' | bash || true
pm2 save

# 显示状态
echo ""
echo "✅ MCP Manager 部署完成！"
echo ""
echo "📊 应用状态:"
pm2 status

echo ""
echo "🌐 访问地址:"
echo "   - Web 界面: http://$(hostname -I | awk '{print $1}'):3456"
echo "   - 本地访问: http://localhost:3456"
echo ""
echo "🔧 管理命令:"
echo "   - 查看状态: pm2 status"
echo "   - 查看日志: pm2 logs mcp-manager"
echo "   - 重启应用: pm2 restart mcp-manager"
echo "   - 停止应用: pm2 stop mcp-manager"
echo ""
echo "📝 配置文件:"
echo "   - 环境配置: .env"
echo "   - MCP 配置: config/config.json"
echo ""
echo "🔍 如需配置 Nginx 反向代理或 SSL，请参考 DEPLOYMENT.md"