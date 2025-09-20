#!/bin/bash

echo "🔧 完全修复 MCP Manager 部署问题..."

# 1. 停止所有相关进程
echo "🛑 停止所有MCP相关进程..."
pkill -f "node.*start-web-server.js" 2>/dev/null || true
pkill -f "node.*app.js" 2>/dev/null || true
pkill -f "mcp-manage" 2>/dev/null || true
pm2 delete mcp-manager 2>/dev/null || true
sleep 3

# 2. 检查端口占用
echo "🔍 检查端口11451占用情况..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep :11451 || echo "端口11451未被占用"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep :11451 || echo "端口11451未被占用"
else
    echo "无法检查端口状态，继续执行..."
fi

# 3. 强制杀死占用端口的进程
echo "💀 强制释放端口11451..."
if command -v fuser >/dev/null 2>&1; then
    fuser -k 11451/tcp 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
    lsof -ti:11451 | xargs kill -9 2>/dev/null || true
fi

sleep 2

# 4. 确定正确的项目目录
CURRENT_DIR=$(pwd)
echo "📁 当前目录: $CURRENT_DIR"

# 检查是否在正确的目录
if [[ ! -f "package.json" ]] || [[ ! -d "public" ]] || [[ ! -d "src" ]]; then
    echo "❌ 当前目录不是MCP Manager项目目录"
    
    # 尝试找到正确的目录
    if [[ -d "/root/mcp-manage" ]]; then
        echo "📂 找到项目目录: /root/mcp-manage"
        cd /root/mcp-manage
    elif [[ -d "/root/mcp/mcp-manage" ]]; then
        echo "📂 找到项目目录: /root/mcp/mcp-manage"
        cd /root/mcp/mcp-manage
    else
        echo "❌ 无法找到MCP Manager项目目录"
        exit 1
    fi
fi

PROJECT_DIR=$(pwd)
echo "✅ 项目目录确认: $PROJECT_DIR"

# 5. 验证文件结构
echo "🔍 验证文件结构..."
if [[ ! -f "public/index.html" ]]; then
    echo "❌ public/index.html 不存在"
    exit 1
fi

if [[ ! -f "src/app.js" ]]; then
    echo "❌ src/app.js 不存在"
    exit 1
fi

echo "✅ 文件结构验证通过"

# 6. 设置正确的权限
echo "🔐 设置文件权限..."
chmod -R 755 public/
chmod -R 755 src/
chmod 644 public/*
chmod 644 src/*
chmod +x start-web-server.js 2>/dev/null || true

# 7. 检查Node.js和npm
echo "🔍 检查Node.js环境..."
node --version || { echo "❌ Node.js未安装"; exit 1; }
npm --version || { echo "❌ npm未安装"; exit 1; }

# 8. 安装依赖（如果需要）
if [[ ! -d "node_modules" ]]; then
    echo "📦 安装依赖..."
    npm install
fi

# 9. 创建启动脚本
echo "📝 创建启动脚本..."
cat > start-server.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 启动 MCP Manager..."
echo "📁 项目目录: $(pwd)"
echo "🌐 端口: 11451"
node start-web-server.js
EOF

chmod +x start-server.sh

# 10. 测试启动
echo "🧪 测试服务器启动..."
timeout 10s node start-web-server.js &
SERVER_PID=$!
sleep 5

# 检查服务器是否启动成功
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ 服务器启动测试成功"
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
else
    echo "❌ 服务器启动测试失败"
fi

echo ""
echo "🎯 修复完成！"
echo ""
echo "🚀 启动服务器："
echo "   cd $PROJECT_DIR"
echo "   ./start-server.sh"
echo ""
echo "🌐 访问地址: http://72.11.154.203:11451"
echo ""
echo "📊 健康检查: http://72.11.154.203:11451/transport/health"