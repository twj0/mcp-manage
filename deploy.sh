#!/bin/bash

# 检查git是否安装
if ! command -v git &> /dev/null
then
    echo "Git 未安装，请先安装 Git。"
    exit 1
fi

# 检查Node.js和npm是否安装
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null
then
    echo "Node.js 或 npm 未安装，请先安装它们。"
    exit 1
fi

# 克隆项目
echo "正在从 GitHub 克隆项目..."
git clone https://github.com/twj0/mcp-manage.git
cd mcp-manage

# 安装依赖
echo "正在安装项目依赖..."
npm install

# 后台静默运行
echo "正在后台启动服务..."
nohup node start-web-server.js > mcp-manage.log 2>&1 &

# 创建全局删除命令
echo "正在创建全局删除命令 'del-mcp-manage'..."
sudo tee /usr/local/bin/del-mcp-manage > /dev/null <<'EOF'
#!/bin/bash
echo "正在停止 mcp-manage 服务..."
pkill -f start-web-server.js
echo "正在删除 mcp-manage 项目文件夹..."
rm -rf ~/mcp-manage
echo "正在删除全局命令 'del-mcp-manage'..."
sudo rm /usr/local/bin/del-mcp-manage
echo "mcp-manage 已成功删除。"
EOF

# 赋予删除命令可执行权限
sudo chmod +x /usr/local/bin/del-mcp-manage

echo "部署完成！"
echo "您现在可以通过 http://<您的服务器IP>:3000 访问 mcp-manage。"
echo "您可以使用 'del-mcp-manage' 命令来删除此项目。"