#!/usr/bin/env node

// 包装脚本：自动安装依赖并启动 MCP 代理服务器
import { existsSync } from 'fs';
import { spawn, exec } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkAndInstallDependencies() {
  const packageJsonPath = join(__dirname, 'package.json');
  const nodeModulesPath = join(__dirname, 'node_modules', '@modelcontextprotocol');
  
  // 检查是否已安装 MCP SDK
  if (!existsSync(nodeModulesPath)) {
    console.error('正在安装 MCP SDK 依赖...');
    
    return new Promise((resolve, reject) => {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const installProcess = spawn(npm, ['install'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
      
      installProcess.on('close', (code) => {
        if (code === 0) {
          console.error('依赖安装完成');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
      
      installProcess.on('error', reject);
    });
  }
}

async function startMcpServer() {
  try {
    await checkAndInstallDependencies();
    
    // 动态导入 MCP 服务器
    const { default: mcpServerModule } = await import('./mcp-server.js');
    
  } catch (error) {
    console.error('启动 MCP 代理服务器失败:', error);
    
    // 如果动态导入失败，尝试直接执行
    const serverPath = join(__dirname, 'mcp-server.js');
    const node = spawn('node', [serverPath], {
      stdio: 'inherit'
    });
    
    node.on('error', (error) => {
      console.error('无法启动 MCP 服务器:', error);
      process.exit(1);
    });
  }
}

// 如果直接运行此脚本，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  startMcpServer();
}