#!/usr/bin/env node

/**
 * MCP Manager Web服务器启动文件
 * 提供完整的MCP代理服务和Web管理界面
 * 
 * 功能特性:
 * - 多传输协议支持 (SSE, HTTP JSON-RPC, WebSocket, stdio)
 * - 统一MCP代理服务
 * - Web管理界面
 * - 实时监控和诊断
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import config from './src/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 启动Web服务器
 */
async function startWebServer() {
    try {
        console.log('🚀 启动 MCP Manager Web 服务器...');
        console.log(`📍 环境: ${config.app.environment}`);
        console.log(`🌐 端口: ${config.server.port}`);
        
        // 动态导入并启动应用
        const { default: App } = await import('./src/app.js');
        
        const appInstance = new App();
        await appInstance.start();
        
        console.log('');
        console.log('✅ MCP Manager 启动成功！');
        console.log('');
        console.log('📡 可用的传输协议端点:');
        console.log(`   🔄 HTTP JSON-RPC: http://localhost:${config.server.port}/mcp`);
        console.log(`   📡 Server-Sent Events: http://localhost:${config.server.port}/sse`);
        console.log(`   ⚡ WebSocket: ws://localhost:${config.server.port}/ws`);
        console.log('');
        console.log('🎛️ 管理界面:');
        console.log(`   🌐 Web界面: http://localhost:${config.server.port}`);
        console.log('');
        console.log('📊 监控端点:');
        console.log(`   ❤️  健康检查: http://localhost:${config.server.port}/transport/health`);
        console.log(`   📈 连接统计: http://localhost:${config.server.port}/transport/stats`);
        console.log(`   ℹ️  服务信息: http://localhost:${config.server.port}/transport/info`);
        console.log('');
        console.log('🔧 使用说明:');
        console.log('   - AI客户端可通过任意传输协议访问所有MCP工具');
        console.log('   - 工具名称格式: {server_name}_{tool_name}');
        console.log('   - 通过Web界面管理MCP服务器配置');
        console.log('');
        console.log('⏹️  按 Ctrl+C 停止服务器');
        
    } catch (error) {
        console.error('❌ 启动 Web 服务器失败:', error);
        console.error('');
        console.error('🔍 可能的解决方案:');
        console.error('   1. 检查端口是否被占用');
        console.error('   2. 确认配置文件格式正确');
        console.error('   3. 检查依赖是否完整安装');
        process.exit(1);
    }
}

/**
 * 处理未捕获的异常
 */
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    process.exit(1);
});

// 如果直接运行此脚本，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    startWebServer();
}

export default startWebServer;