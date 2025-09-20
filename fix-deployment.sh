#!/bin/bash

# MCP Manager 部署修复脚本
# 用于修复部署后的文件路径和权限问题

echo "🔧 修复 MCP Manager 部署问题..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 项目目录: $SCRIPT_DIR"

# 检查并修复public目录
PUBLIC_DIR="$SCRIPT_DIR/public"
echo "📁 检查public目录: $PUBLIC_DIR"

if [ ! -d "$PUBLIC_DIR" ]; then
    echo "❌ public目录不存在，正在创建..."
    mkdir -p "$PUBLIC_DIR"
else
    echo "✅ public目录存在"
fi

# 检查关键文件
FILES=("index.html" "styles.css" "app.js")
for file in "${FILES[@]}"; do
    filepath="$PUBLIC_DIR/$file"
    if [ -f "$filepath" ]; then
        echo "✅ $file 存在 ($(stat -c%s "$filepath") bytes)"
        # 确保文件可读
        chmod 644 "$filepath"
    else
        echo "❌ $file 不存在"
    fi
done

# 检查src目录
SRC_DIR="$SCRIPT_DIR/src"
if [ ! -d "$SRC_DIR" ]; then
    echo "❌ src目录不存在"
    exit 1
else
    echo "✅ src目录存在"
fi

# 检查配置文件
CONFIG_FILE="$SCRIPT_DIR/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ config.json不存在"
    # 从示例创建默认配置
    if [ -f "$SCRIPT_DIR/config/default.json" ]; then
        echo "📋 从默认配置创建config.json..."
        cp "$SCRIPT_DIR/config/default.json" "$CONFIG_FILE"
    fi
else
    echo "✅ config.json存在"
fi

# 检查node_modules
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "❌ node_modules不存在，正在安装依赖..."
    cd "$SCRIPT_DIR"
    npm install
else
    echo "✅ node_modules存在"
fi

# 设置正确的权限
echo "🔐 设置文件权限..."
chmod -R 755 "$SCRIPT_DIR"
chmod -R 644 "$SCRIPT_DIR/public"/*
chmod +x "$SCRIPT_DIR/start-web-server.js"
chmod +x "$SCRIPT_DIR/index.js"

# 检查端口是否被占用
PORT=11451
if netstat -tuln | grep -q ":$PORT "; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "🔄 尝试停止现有进程..."
    pkill -f "node.*start-web-server.js" || true
    sleep 2
fi

# 测试启动
echo "🧪 测试服务器启动..."
cd "$SCRIPT_DIR"
timeout 10s node start-web-server.js &
SERVER_PID=$!
sleep 3

# 检查服务器是否启动成功
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|404"; then
    echo "✅ 服务器启动成功"
    kill $SERVER_PID 2>/dev/null || true
else
    echo "❌ 服务器启动失败"
    kill $SERVER_PID 2>/dev/null || true
fi

echo ""
echo "🎯 修复完成！现在可以启动服务器："
echo "   cd $SCRIPT_DIR"
echo "   npm start"
echo ""
echo "🌐 访问地址: http://$(hostname -I | awk '{print $1}'):$PORT"