import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { transportService } from './src/services/transportService.js';
import transportRoutes from './src/routes/transport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting transport layer test server...');

const app = express();
app.use(express.json());

// 根路径 - 提供测试页面
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MCP Manager - Transport Layer Test</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                .method { color: #007bff; font-weight: bold; }
                pre { background: #333; color: #fff; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <h1>🚀 MCP Manager - Transport Layer Test</h1>
            <p>传输层功能已成功启用！AI客户端现在可以通过以下方式访问：</p>
            
            <h2>📡 可用端点</h2>
            
            <div class="endpoint">
                <div><span class="method">GET</span> <strong>/sse</strong> - Server-Sent Events 连接</div>
                <p>用于建立 SSE 连接，接收服务器推送的消息</p>
            </div>
            
            <div class="endpoint">
                <div><span class="method">POST</span> <strong>/mcp</strong> - HTTP JSON-RPC 端点</div>
                <p>标准的 MCP JSON-RPC 接口，AI客户端可以直接发送请求</p>
            </div>
            
            <div class="endpoint">
                <div><span class="method">WebSocket</span> <strong>ws://localhost:3457/ws</strong> - WebSocket 连接</div>
                <p>双向实时通信，支持 JSON-RPC 消息</p>
            </div>
            
            <div class="endpoint">
                <div><span class="method">GET</span> <strong>/transport/health</strong> - 健康检查</div>
                <p>检查传输层服务状态</p>
            </div>
            
            <div class="endpoint">
                <div><span class="method">GET</span> <strong>/transport/info</strong> - 传输层信息</div>
                <p>获取所有可用端点和功能信息</p>
            </div>
            
            <h2>🧪 测试示例</h2>
            
            <h3>1. HTTP JSON-RPC 测试</h3>
            <pre>curl -X POST http://localhost:3457/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": { "tools": {} },
      "clientInfo": { "name": "test-client", "version": "1.0.0" }
    }
  }'</pre>
            
            <h3>2. 获取工具列表</h3>
            <pre>curl -X POST http://localhost:3457/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'</pre>
            
            <h3>3. WebSocket 测试 (JavaScript)</h3>
            <pre>const ws = new WebSocket('ws://localhost:3457/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": { "tools": {} }
    }
  }));
};
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};</pre>
            
            <p><strong>✅ 传输层功能已完成！</strong></p>
        </body>
        </html>
    `);
});

// 挂载传输层路由
app.use('/', transportRoutes);

const server = app.listen(3457, () => {
    console.log('✅ Transport layer test server running at http://localhost:3457');
    console.log('📡 Available endpoints:');
    console.log('   GET  /           - Test page (visit in browser)');
    console.log('   GET  /sse        - Server-Sent Events');
    console.log('   POST /mcp        - HTTP JSON-RPC');
    console.log('   WS   /ws         - WebSocket');
    console.log('   GET  /transport/health - Health check');
    console.log('   GET  /transport/info   - Transport info');
    console.log('');
    console.log('🌐 Visit http://localhost:3457 in your browser for testing instructions');
});

// 初始化WebSocket服务器
transportService.initializeWebSocketServer(server);

console.log('🔌 WebSocket server initialized on /ws');

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    transportService.cleanup();
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});