#!/usr/bin/env node

/**
 * Web服务器启动文件 - 包含传输层功能
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startWebServer() {
    try {
        console.log('🚀 启动 MCP Manager Web 服务器...');
        
        // 动态导入并启动应用
        const { default: App } = await import('./src/app.js');
        
        const appInstance = new App();
        await appInstance.start();
        
        console.log('✅ Web 服务器启动成功！');
        console.log('📡 传输层功能已启用:');
        console.log('   - SSE: http://localhost:3456/sse');
        console.log('   - HTTP JSON-RPC: http://localhost:3456/mcp');
        console.log('   - WebSocket: ws://localhost:3456/ws');
        console.log('   - Web 管理界面: http://localhost:3456');
        
    } catch (error) {
        console.error('❌ 启动 Web 服务器失败:', error);
        process.exit(1);
    }
}

// 如果直接运行此脚本，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    startWebServer();
}

export default startWebServer;