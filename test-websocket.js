import WebSocket from 'ws';

// 创建WebSocket连接
const ws = new WebSocket('ws://localhost:3457/ws');

ws.on('open', function open() {
    console.log('✅ WebSocket连接已建立');
    
    // 发送初始化请求
    const initRequest = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "clientInfo": {"name": "websocket-test-client", "version": "1.0.0"}
        }
    };
    
    console.log('📤 发送初始化请求...');
    ws.send(JSON.stringify(initRequest));
});

ws.on('message', function message(data) {
    console.log('📥 收到消息:', JSON.parse(data.toString()));
    
    // 如果收到初始化响应，发送工具列表请求
    const response = JSON.parse(data.toString());
    if (response.id === 1 && response.result) {
        console.log('✅ 初始化成功，请求工具列表...');
        const toolsRequest = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        };
        ws.send(JSON.stringify(toolsRequest));
    } else if (response.id === 2) {
        console.log('✅ 工具列表获取完成');
        console.log('🔧 可用工具数量:', response.result?.tools?.length || 0);
        ws.close();
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket错误:', err);
});

ws.on('close', function close() {
    console.log('🔌 WebSocket连接已关闭');
    process.exit(0);
});

console.log('🔌 正在连接 WebSocket...');