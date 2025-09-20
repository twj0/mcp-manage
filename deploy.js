#!/usr/bin/env node

/**
 * MCP Manager 部署脚本
 * 用于生产环境的一键部署和配置
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Deployer {
    constructor() {
        this.projectRoot = __dirname;
        this.configFile = join(this.projectRoot, 'config.json');
        this.packageFile = join(this.projectRoot, 'package.json');
    }

    /**
     * 执行命令
     */
    async executeCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                stdio: 'inherit',
                shell: true,
                ...options
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve(code);
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });

            child.on('error', reject);
        });
    }

    /**
     * 检查环境
     */
    async checkEnvironment() {
        console.log('🔍 检查部署环境...');

        // 检查Node.js版本
        try {
            await this.executeCommand('node', ['--version']);
        } catch (error) {
            throw new Error('Node.js 未安装或版本不兼容');
        }

        // 检查npm
        try {
            await this.executeCommand('npm', ['--version']);
        } catch (error) {
            throw new Error('npm 未安装');
        }

        // 检查PM2
        try {
            await this.executeCommand('pm2', ['--version']);
        } catch (error) {
            console.log('⚠️  PM2 未安装，将自动安装...');
            await this.executeCommand('npm', ['install', '-g', 'pm2']);
        }

        console.log('✅ 环境检查通过');
    }

    /**
     * 安装依赖
     */
    async installDependencies() {
        console.log('📦 安装项目依赖...');
        
        if (!existsSync(join(this.projectRoot, 'node_modules'))) {
            await this.executeCommand('npm', ['install']);
        } else {
            console.log('✅ 依赖已存在，跳过安装');
        }
    }

    /**
     * 检查配置文件
     */
    checkConfiguration() {
        console.log('⚙️  检查配置文件...');

        if (!existsSync(this.configFile)) {
            console.log('📝 创建默认配置文件...');
            const defaultConfig = {
                mcpServers: {
                    "feedback-enhance": {
                        "command": "node",
                        "args": [join(this.projectRoot, "examples", "feedback-enhance-mcp", "index.js")],
                        "env": {
                            "FEEDBACK_MODEL": "enhanced",
                            "ANALYSIS_DEPTH": "detailed"
                        }
                    }
                }
            };
            writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
        }

        console.log('✅ 配置文件检查完成');
    }

    /**
     * 启动服务
     */
    async startService() {
        console.log('🚀 启动 MCP Manager 服务...');

        const pm2Config = {
            name: 'mcp-manager',
            script: join(this.projectRoot, 'start-web-server.js'),
            cwd: this.projectRoot,
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
                PORT: process.env.PORT || 3456
            },
            log_file: join(this.projectRoot, 'logs', 'combined.log'),
            out_file: join(this.projectRoot, 'logs', 'out.log'),
            error_file: join(this.projectRoot, 'logs', 'error.log'),
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,
            max_restarts: 10,
            min_uptime: '10s'
        };

        // 创建logs目录
        const logsDir = join(this.projectRoot, 'logs');
        if (!existsSync(logsDir)) {
            await this.executeCommand('mkdir', [logsDir]);
        }

        // 写入PM2配置文件
        const pm2ConfigFile = join(this.projectRoot, 'ecosystem.config.js');
        const configContent = `module.exports = {
  apps: [${JSON.stringify(pm2Config, null, 4)}]
};`;
        writeFileSync(pm2ConfigFile, configContent);

        // 启动服务
        try {
            await this.executeCommand('pm2', ['start', pm2ConfigFile]);
            console.log('✅ 服务启动成功');
        } catch (error) {
            console.log('⚠️  服务可能已在运行，尝试重启...');
            await this.executeCommand('pm2', ['restart', 'mcp-manager']);
        }

        // 保存PM2配置
        await this.executeCommand('pm2', ['save']);
        await this.executeCommand('pm2', ['startup']);
    }

    /**
     * 显示部署信息
     */
    showDeploymentInfo() {
        const port = process.env.PORT || 3456;
        
        console.log('');
        console.log('🎉 MCP Manager 部署完成！');
        console.log('');
        console.log('📡 服务端点:');
        console.log(`   🌐 Web管理界面: http://localhost:${port}`);
        console.log(`   🔄 HTTP JSON-RPC: http://localhost:${port}/mcp`);
        console.log(`   ⚡ WebSocket: ws://localhost:${port}/ws`);
        console.log(`   📡 Server-Sent Events: http://localhost:${port}/sse`);
        console.log('');
        console.log('🔧 管理命令:');
        console.log('   查看状态: pm2 status');
        console.log('   查看日志: pm2 logs mcp-manager');
        console.log('   重启服务: pm2 restart mcp-manager');
        console.log('   停止服务: pm2 stop mcp-manager');
        console.log('');
        console.log('📊 监控端点:');
        console.log(`   ❤️  健康检查: http://localhost:${port}/transport/health`);
        console.log(`   📈 连接统计: http://localhost:${port}/transport/stats`);
        console.log(`   ℹ️  服务信息: http://localhost:${port}/transport/info`);
        console.log('');
    }

    /**
     * 执行部署
     */
    async deploy() {
        try {
            console.log('🚀 开始部署 MCP Manager...');
            console.log('');

            await this.checkEnvironment();
            await this.installDependencies();
            this.checkConfiguration();
            await this.startService();
            this.showDeploymentInfo();

        } catch (error) {
            console.error('❌ 部署失败:', error.message);
            process.exit(1);
        }
    }
}

// 如果直接运行此脚本，执行部署
if (import.meta.url === `file://${process.argv[1]}`) {
    const deployer = new Deployer();
    deployer.deploy();
}

export default Deployer;