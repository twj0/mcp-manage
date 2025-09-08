#!/usr/bin/env node

// 测试 MCP 代理服务器功能
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMcpProxy() {
  console.log('🧪 开始测试 MCP 代理服务器...\n');
  
  const mcpServerPath = join(__dirname, 'mcp-server.js');
  
  // 启动 MCP 代理服务器
  const mcpServer = spawn('node', [mcpServerPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responseBuffer = '';
  
  mcpServer.stdout.on('data', (data) => {
    responseBuffer += data.toString();
    
    // 处理完整的 JSON 消息
    const lines = responseBuffer.split('\n');
    responseBuffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          console.log('📨 收到响应:', JSON.stringify(message, null, 2));
        } catch (e) {
          console.log('📄 输出:', line);
        }
      }
    }
  });
  
  mcpServer.stderr.on('data', (data) => {
    console.log('🔧 调试信息:', data.toString().trim());
  });
  
  mcpServer.on('error', (error) => {
    console.error('❌ 进程错误:', error);
  });
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📤 发送初始化请求...');
  
  // 发送初始化请求
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // 等待初始化完成
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n📤 请求工具列表...');
  
  // 请求工具列表
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };
  
  mcpServer.stdin.write(JSON.stringify(toolsRequest) + '\n');
  
  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n📤 测试启动管理器工具...');
  
  // 测试调用工具
  const callToolRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'launch_manager',
      arguments: {}
    }
  };
  
  mcpServer.stdin.write(JSON.stringify(callToolRequest) + '\n');
  
  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n✅ 测试完成');
  
  // 清理
  mcpServer.kill();
}

// 运行测试
testMcpProxy().catch(console.error);