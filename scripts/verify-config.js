#!/usr/bin/env node

// MCP 配置验证脚本
// 用于验证 IDE 中的 MCP 配置是否正确

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取不同系统的配置文件路径
function getConfigPaths() {
    const home = os.homedir();
    const platform = process.platform;
    
    const paths = {
        windows: {
            cursor: join(home, 'AppData/Roaming/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            vscode: join(home, 'AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            claude: join(home, 'AppData/Roaming/Claude/claude_desktop_config.json')
        },
        darwin: {
            cursor: join(home, 'Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            vscode: join(home, 'Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            claude: join(home, 'Library/Application Support/Claude/claude_desktop_config.json')
        },
        linux: {
            cursor: join(home, '.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            vscode: join(home, '.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
            claude: join(home, '.config/Claude/claude_desktop_config.json')
        }
    };
    
    return paths[platform] || paths.linux;
}

async function checkFile(path, name) {
    try {
        const data = await fs.readFile(path, 'utf8');
        const config = JSON.parse(data);
        
        console.log(`✅ ${name}: 配置文件存在且格式正确`);
        
        if (config.mcpServers && config.mcpServers['mcp-manager']) {
            console.log(`  ✅ 找到 mcp-manager 配置`);
            const mcpConfig = config.mcpServers['mcp-manager'];
            console.log(`  📋 命令: ${mcpConfig.command}`);
            console.log(`  📋 参数: ${JSON.stringify(mcpConfig.args)}`);
            
            // 检查文件是否存在
            if (mcpConfig.args && mcpConfig.args[0]) {
                try {
                    await fs.access(mcpConfig.args[0]);
                    console.log(`  ✅ MCP 服务器文件存在: ${mcpConfig.args[0]}`);
                } catch {
                    console.log(`  ⚠️  MCP 服务器文件不存在: ${mcpConfig.args[0]}`);
                }
            }
        } else {
            console.log(`  ⚠️  未找到 mcp-manager 配置`);
        }
        
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`⚠️  ${name}: 配置文件不存在`);
            console.log(`  📁 路径: ${path}`);
        } else if (error instanceof SyntaxError) {
            console.log(`❌ ${name}: JSON 格式错误`);
            console.log(`  📁 路径: ${path}`);
            console.log(`  🔍 错误: ${error.message}`);
        } else {
            console.log(`❌ ${name}: 读取错误`);
            console.log(`  🔍 错误: ${error.message}`);
        }
        return false;
    }
}

async function generateConfig() {
    const mcpServerPath = join(__dirname, 'mcp-server.js');
    const config = {
        mcpServers: {
            "mcp-manager": {
                command: "node",
                args: [mcpServerPath]
            }
        }
    };
    
    console.log('\n📝 推荐的配置内容:');
    console.log(JSON.stringify(config, null, 2));
    
    return config;
}

async function main() {
    console.log('🔍 MCP 配置验证工具\n');
    
    const configPaths = getConfigPaths();
    console.log(`🖥️  检测到系统: ${process.platform}\n`);
    
    let hasValidConfig = false;
    
    // 检查各个配置文件
    for (const [app, path] of Object.entries(configPaths)) {
        console.log(`检查 ${app.toUpperCase()} 配置...`);
        const isValid = await checkFile(path, app.toUpperCase());
        if (isValid) hasValidConfig = true;
        console.log('');
    }
    
    if (!hasValidConfig) {
        console.log('❌ 未找到有效的 MCP 配置\n');
        await generateConfig();
        
        console.log('\n📖 配置步骤:');
        console.log('1. 复制上面的 JSON 配置');
        console.log('2. 打开相应的配置文件');
        console.log('3. 粘贴配置内容');
        console.log('4. 保存文件并重启 IDE');
        
        console.log('\n📁 配置文件位置:');
        for (const [app, path] of Object.entries(configPaths)) {
            console.log(`  ${app.toUpperCase()}: ${path}`);
        }
    } else {
        console.log('✅ 找到有效的 MCP 配置！');
        
        // 测试 mcp-server 是否可执行
        console.log('\n🧪 测试 MCP 服务器...');
        try {
            const { spawn } = await import('child_process');
            const mcpServerPath = join(__dirname, 'mcp-server.js');
            
            const testProcess = spawn('node', ['-c', mcpServerPath], {
                stdio: 'pipe'
            });
            
            testProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ MCP 服务器语法检查通过');
                } else {
                    console.log('❌ MCP 服务器语法检查失败');
                }
            });
            
        } catch (error) {
            console.log('⚠️  无法测试 MCP 服务器');
        }
    }
    
    console.log('\n💡 提示:');
    console.log('- 修改配置后需要重启 IDE');
    console.log('- 可以在 AI 助手中输入 "请使用 launch_manager 工具" 来测试');
    console.log('- 更多帮助请查看 IDE_CONFIGURATION_GUIDE.md');
}

main().catch(console.error);