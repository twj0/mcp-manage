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

echo -e "${GREEN}### mcp-manage 一键安装脚本 ###${NC}"

# 步骤 1: 检查依赖 (Git, Node.js, npm)
echo -e "\n${YELLOW}--- 步骤 1: 检查系统依赖 ---${NC}"
if ! command_exists git; then
    echo -e "${RED}错误: Git 未安装。请先安装 Git 再运行此脚本。${NC}"
    exit 1
fi
if ! command_exists node; then
    echo -e "${RED}错误: Node.js 未安装。请先安装 Node.js (建议 v18+) 再运行此脚本。${NC}"
    exit 1
fi
if ! command_exists npm; then
    echo -e "${RED}错误: npm 未安装。请确保您的 Node.js 安装包含了 npm。${NC}"
    exit 1
fi
echo -e "${GREEN}依赖检查通过。${NC}"

# 步骤 2: 克隆仓库
echo -e "\n${YELLOW}--- 步骤 2: 从 GitHub 克隆 mcp-manage 仓库 (使用大陆加速) ---${NC}"
REPO_URL="https://ghproxy.com/https://github.com/twj0/mcp-manage.git"
INSTALL_DIR="mcp-manage"
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}目录 '$INSTALL_DIR' 已存在。正在检查是否为 Git 仓库...${NC}"
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo -e "${YELLOW}是 Git 仓库。尝试更新...${NC}"
        cd "$INSTALL_DIR" || exit
        git pull
        if [ $? -ne 0 ]; then
            echo -e "${RED}git pull 失败。请检查错误信息。可能需要手动解决。${NC}"
            exit 1
        fi
    else
        echo -e "${RED}目录 '$INSTALL_DIR' 不是一个有效的 Git 仓库。将删除并重新克隆...${NC}"
        rm -rf "$INSTALL_DIR"
        git clone --progress "$REPO_URL" "$INSTALL_DIR"
        if [ $? -ne 0 ]; then
            echo -e "${RED}git clone 失败。请检查网络连接或 URL 是否正确。${NC}"
            exit 1
        fi
        cd "$INSTALL_DIR" || exit
    fi
else
    git clone --progress "$REPO_URL" "$INSTALL_DIR"
    if [ $? -ne 0 ]; then
        echo -e "${RED}git clone 失败。请检查网络连接或 URL 是否正确。${NC}"
        exit 1
    fi
    cd "$INSTALL_DIR" || exit
fi
echo -e "${GREEN}仓库已克隆/更新到 '$INSTALL_DIR' 目录。${NC}"

# 步骤 3: 安装依赖
echo -e "\n${YELLOW}--- 步骤 3: 安装项目依赖 (npm install) ---${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}npm install 失败。请检查错误信息并重试。${NC}"
    exit 1
fi
echo -e "${GREEN}项目依赖安装成功。${NC}"

# 步骤 4: 设置全局命令
echo -e "\n${YELLOW}--- 步骤 4: 设置 'mcp-manager' 全局命令 (npm link) ---${NC}"
# 需要 sudo 权限来创建符号链接
if command_exists sudo; then
    sudo npm link
else
    npm link
fi
if [ $? -ne 0 ]; then
    echo -e "${RED}npm link 失败。请尝试使用 'sudo npm link' 或检查您的权限配置。${NC}"
    exit 1
fi
echo -e "${GREEN}'mcp-manager' 全局命令已设置。${NC}"

# 步骤 5: 启动 Web UI 服务
echo -e "\n${YELLOW}--- 步骤 5: 使用 PM2 启动并守护 Web 管理界面 ---${NC}"
mcp-manager start
if [ $? -ne 0 ]; then
    echo -e "${RED}启动服务失败。请运行 'mcp-manager list' 查看状态。${NC}"
    exit 1
fi

echo -e "\n${GREEN}===================================================${NC}"
echo -e "${GREEN}🎉 mcp-manage 安装并启动成功! 🎉${NC}"
echo -e "${GREEN}===================================================${NC}"
echo -e "\n您现在可以通过以下方式管理服务:"
echo -e "  - ${YELLOW}mcp-manager list${NC}    : 查看服务状态"
echo -e "  - ${YELLOW}mcp-manager stop${NC}     : 停止服务"
echo -e "  - ${YELLOW}mcp-manager restart${NC}  : 重启服务"
echo -e "\n${GREEN}图形化用户管理面板通常运行在端口 3456 上。${NC}"
echo -e "请在浏览器中访问: ${YELLOW}http://<您的服务器IP>:3456${NC}"
echo -e "\n安装脚本执行完毕。"