#!/usr/bin/env node
import { Command } from 'commander';
import { 
  install, 
  uninstall, 
  update, 
  status,
  start,
  stop,
  restart,
  list
} from './src/manager.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const program = new Command();

program
  .name('mcp-manager')
  .description('一个用于管理和运行 MCP 服务器的命令行工具。')
  .version(pkg.version);

// 安装管理命令
program
  .command('install <serverName>')
  .description('从注册表安装一个 MCP 服务器。')
  .action(install);

program
  .command('uninstall <serverName>')
  .description('卸载一个本地已安装的 MCP 服务器。')
  .action(uninstall);

program
  .command('update <serverName>')
  .description('从代码仓库更新一个已安装的 MCP 服务器。')
  .action(update);

program
  .command('status')
  .description('显示本地已安装的 MCP 服务器的状态。')
  .action(status);

// PM2 服务管理命令
program
  .command('start')
  .description('使用 PM2 在后台启动 Web 管理界面。')
  .action(start);

program
  .command('stop')
  .description('使用 PM2 停止在后台运行的 Web 管理界面。')
  .action(stop);

program
  .command('restart')
  .description('使用 PM2 重启在后台运行的 Web 管理界面。')
  .action(restart);

program
  .command('list')
  .description('列出由 PM2 管理的所有服务状态。')
  .action(list);

// 解析命令行参数
program.parse(process.argv);

// 如果用户没有输入任何子命令，则显示帮助信息
if (program.args.length === 0) {
  program.help();
}