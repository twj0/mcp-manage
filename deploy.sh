#!/bin/bash

# 设置颜色变量
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 查找npm路径
find_npm() {
    if command_exists npm; then
        echo "npm"
    elif [ -x "/usr/local/bin/npm" ]; then
        echo "/usr/local/bin/npm"
    elif [ -x "/usr/bin/npm" ]; then
        echo "/usr/bin/npm"
    else
        return 1
    fi
}

echo -e "${GREEN}### mcp-manager 全自动部署脚本 ###${NC}"

# 步骤 0: 检查用户权限
echo -e "\n${YELLOW}--- 步骤 0: 检查用户权限 ---${NC}"
echo -e "${GREEN}用户权限检查通过。${NC}"

# 步骤 1: 检查并安装系统依赖 (Git, Node.js, npm, PM2)
echo -e "\n${YELLOW}--- 步骤 1: 检查并安装系统依赖 ---${NC}"

# 更新系统包
echo -e "${YELLOW}📦 更新系统包...${NC}"
sudo apt update
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: apt update 失败。请检查网络连接或软件源配置。${NC}"
    exit 1
fi
echo -e "${GREEN}系统包更新成功。${NC}"

# 检查并安装 Git
if ! command_exists git; then
    echo -e "${YELLOW}📦 安装 Git...${NC}"
    sudo apt install -y git
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: Git 安装失败。${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}Git 检查通过。${NC}"

# 检查并安装 Node.js 18.x
if ! command_exists node || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    echo -e "${YELLOW}📦 安装 Node.js 18.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: Node.js 安装失败。${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}Node.js 版本: $(node --version)${NC}"
NPM_CMD=$(find_npm)
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: npm 未安装或未找到。请确保您的 Node.js 安装包含了 npm。${NC}"
    exit 1
fi
echo -e "${GREEN}npm 版本: $($NPM_CMD --version)${NC}"

# 检查并安装 PM2
if ! command_exists pm2; then
    echo -e "${YELLOW}📦 安装 PM2...${NC}"
    sudo "$NPM_CMD" install -g pm2
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: PM2 安装失败。${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}PM2 检查通过。${NC}"
echo -e "${GREEN}所有系统依赖检查并安装成功。${NC}"

# 步骤 2: 克隆或更新 mcp-manager 仓库
echo -e "\n${YELLOW}--- 步骤 2: 从 GitHub 克隆或更新 mcp-manager 仓库 ---${NC}"

REPO_URLS=(
    "https://ghfast.top/https://github.com/twj0/mcp-manage.git"
    "https://ghproxy.com/https://github.com/twj0/mcp-manage.git"
    "https://ghproxy.cn/https://github.com/twj0/mcp-manage.git"
    "https://mirror.ghproxy.com/https://github.com/twj0/mcp-manage.git"
    "https://gh.api.99988866.xyz/https://github.com/twj0/mcp-manage.git"
    "https://gitclone.com/github.com/twj0/mcp-manage.git"
    "https://hub.fgit.ml/twj0/mcp-manage.git"
    "https://ghps.cc/https://github.com/twj0/mcp-manage.git"
)
INSTALL_DIR="mcp-manager" # 确保目录名与项目根目录一致

clone_repo() {
    local url=$1
    echo -e "${YELLOW}尝试使用镜像源: $url${NC}"
    timeout 60 git clone --depth=1 --progress "$url" "$INSTALL_DIR"
    return $?
}

update_repo() {
    echo -e "${YELLOW}是 Git 仓库。尝试更新...${NC}"
    cd "$INSTALL_DIR" || return 1
    timeout 60 git pull
    local result=$?
    cd - > /dev/null  # 返回原目录
    return $result
}

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}目录 '$INSTALL_DIR' 已存在。正在检查是否为 Git 仓库...${NC}"
    if [ -d "$INSTALL_DIR/.git" ]; then
        update_repo
        if [ $? -ne 0 ]; then
            echo -e "${RED}git pull 失败。请检查错误信息。可能需要手动解决。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}目录 '$INSTALL_DIR' 不是一个有效的 Git 仓库。将删除并重新克隆...${NC}"
        rm -rf "$INSTALL_DIR"
        
        cloned=false
        for url in "${REPO_URLS[@]}"; do
            clone_repo "$url" && cloned=true && break
            echo -e "${RED}使用镜像源 $url 克隆失败，尝试下一个镜像源...${NC}"
        done
        
        if [ "$cloned" = false ]; then
            echo -e "${RED}所有镜像源都克隆失败。请检查网络连接或稍后重试。${NC}"
            echo -e "${YELLOW}建议手动尝试以下命令:${NC}"
            for url in "${REPO_URLS[@]}"; do
                echo -e "${YELLOW}  git clone --depth=1 $url $INSTALL_DIR${NC}"
            done
            exit 1
        fi
    fi
else
    cloned=false
    for url in "${REPO_URLS[@]}"; do
        clone_repo "$url" && cloned=true && break
        echo -e "${RED}使用镜像源 $url 克隆失败，尝试下一个镜像源...${NC}"
    done
    
    if [ "$cloned" = false ]; then
        echo -e "${RED}所有镜像源都克隆失败。请检查网络连接或稍后重试。${NC}"
        echo -e "${YELLOW}建议手动尝试以下命令:${NC}"
        for url in "${REPO_URLS[@]}"; do
            echo -e "${YELLOW}  git clone --depth=1 $url $INSTALL_DIR${NC}"
        done
        exit 1
    fi
fi
echo -e "${GREEN}仓库已克隆/更新到 '$INSTALL_DIR' 目录。${NC}"

# 步骤 3: 进入项目目录并安装依赖
echo -e "\n${YELLOW}--- 步骤 3: 进入项目目录并安装依赖 ---${NC}"
if ! cd "$INSTALL_DIR"; then
    echo -e "${RED}无法进入项目目录 '$INSTALL_DIR'${NC}"
    exit 1
fi
echo -e "${YELLOW}当前工作目录: $(pwd)${NC}"

echo -e "${YELLOW}📦 安装项目依赖 (npm install)...${NC}"
"$NPM_CMD" install
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: npm install 失败。请检查错误信息并重试。${NC}"
    exit 1
fi
echo -e "${GREEN}项目依赖安装成功。${NC}"

# 步骤 4: 创建必要目录和配置文件
echo -e "\n${YELLOW}--- 步骤 4: 创建必要目录和配置文件 ---${NC}"
echo -e "${YELLOW}📁 创建必要目录 (logs, config)...${NC}"
mkdir -p logs config
echo -e "${GREEN}必要目录创建成功。${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 创建环境配置文件 (.env)...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  已创建 .env 文件。请根据需要编辑此文件配置环境变量。${NC}"
else
    echo -e "${GREEN}.env 文件已存在，跳过创建。${NC}"
fi

# 步骤 5: 配置防火墙
echo -e "\n${YELLOW}--- 步骤 5: 配置防火墙 (如果启用了 ufw) ---${NC}"
if command_exists ufw && sudo ufw status | grep -q "Status: active"; then
    echo -e "${YELLOW}🔥 配置防火墙，允许 3456/tcp 端口...${NC}"
    sudo ufw allow 3456/tcp
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 防火墙规则添加失败。请手动检查 ufw 配置。${NC}"
    else
        echo -e "${GREEN}防火墙规则添加成功。${NC}"
    fi
else
    echo -e "${YELLOW}ufw 未启用或未安装，跳过防火墙配置。${NC}"
fi

# 步骤 6: 启动并守护 MCP Manager 服务
echo -e "\n${YELLOW}--- 步骤 6: 启动并守护 MCP Manager 服务 ---${NC}"

echo -e "${YELLOW}🛑 停止可能存在的旧进程...${NC}"
pm2 delete mcp-manager 2>/dev/null || true
echo -e "${GREEN}旧进程停止完成。${NC}"

echo -e "${YELLOW}🚀 启动 MCP Manager Web 管理界面...${NC}"
pm2 start start-web-server.js --name "mcp-manager"
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: MCP Manager 服务启动失败。请检查日志。${NC}"
    exit 1
fi
echo -e "${GREEN}MCP Manager 服务启动成功。${NC}"

echo -e "${YELLOW}⚙️  配置开机自启...${NC}"
pm2 startup | grep -E '^sudo' | bash || true
pm2 save
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: PM2 开机自启配置失败。请手动检查。${NC}"
else
    echo -e "${GREEN}PM2 开机自启配置成功。${NC}"
fi

# 步骤 7: 显示部署结果
echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}🎉 MCP Manager 全自动部署完成! 🎉${NC}"
echo -e "${GREEN}===================================================${NC}"
echo -e "\n📊 应用状态:"
pm2 status

echo -e "\n🌐 访问地址:"
echo -e "   - Web 界面: http://$(hostname -I | awk '{print $1}'):3456"
echo -e "   - 本地访问: http://localhost:3456"

echo -e "\n🔧 管理命令:"
echo -e "   - 查看状态: pm2 status"
echo -e "   - 查看日志: pm2 logs mcp-manager"
echo -e "   - 重启应用: pm2 restart mcp-manager"
echo -e "   - 停止应用: pm2 stop mcp-manager"

echo -e "\n📝 配置文件:"
echo -e "   - 环境配置: .env"
echo -e "   - MCP 配置: config/config.json (首次运行后生成)"

echo -e "\n🔍 如需配置 Nginx 反向代理或 SSL，请参考 DEPLOYMENT.md"
echo -e "\n部署脚本执行完毕。"