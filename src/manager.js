import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// 假设服务器注册信息存储在 config/mcp-registry.json
const REGISTRY_PATH = path.resolve(process.cwd(), 'config/mcp-registry.json');
// 假设服务器将被安装到项目根目录下的 mcp-servers/ 文件夹
const INSTALL_DIR = path.resolve(process.cwd(), 'mcp-servers');

async function readRegistry() {
  try {
    const data = await fs.readFile(REGISTRY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('错误：无法读取 MCP 服务器注册表。');
    process.exit(1);
  }
}

export async function install(serverName) {
  console.log(`正在尝试安装 '${serverName}'...`);
  const registry = await readRegistry();
  const server = registry.servers.find(s => s.name === serverName);

  if (!server) {
    console.error(`错误：在注册表中未找到服务器 '${serverName}'。`);
    return;
  }

  try {
    await fs.mkdir(INSTALL_DIR, { recursive: true });
    const targetDir = path.join(INSTALL_DIR, serverName);
    console.log(`正在从 ${server.repository} 克隆到 ${targetDir}...`);
    execSync(`git clone ${server.repository} ${targetDir}`, { stdio: 'inherit' });
    console.log(`'${serverName}' 安装成功。`);
  } catch (error) {
    console.error(`安装 '${serverName}' 时出错:`, error.message);
  }
}

export async function uninstall(serverName) {
  console.log(`正在尝试卸载 '${serverName}'...`);
  try {
    const targetDir = path.join(INSTALL_DIR, serverName);
    await fs.rm(targetDir, { recursive: true, force: true });
    console.log(`'${serverName}' 卸载成功。`);
  } catch (error) {
    console.error(`卸载 '${serverName}' 时出错:`, error.message);
  }
}

export async function update(serverName) {
  console.log(`正在尝试更新 '${serverName}'...`);
  try {
    const targetDir = path.join(INSTALL_DIR, serverName);
    console.log(`正在为 '${serverName}' 拉取最新更改，目录: ${targetDir}...`);
    execSync('git pull', { cwd: targetDir, stdio: 'inherit' });
    console.log(`'${serverName}' 更新成功。`);
  } catch (error) {
    console.error(`更新 '${serverName}' 时出错:`, error.message);
  }
}

export async function status() {
  console.log('正在检查已安装的 MCP 服务器状态...');
  try {
    await fs.access(INSTALL_DIR);
    const installedDirs = await fs.readdir(INSTALL_DIR);
    if (installedDirs.length === 0) {
      console.log('当前没有安装任何服务器。');
      return;
    }
    console.log('已安装的服务器:');
    installedDirs.forEach(dir => console.log(`- ${dir}`));
  } catch (error) {
    console.log('当前没有安装任何服务器。');
  }
}
import pm2 from 'pm2';

const PM2_APP_NAME = 'mcp-manager-web';

// 辅助函数，用于连接和断开 PM2
function connectPM2() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) {
        console.error('连接 PM2 失败:', err);
        return reject(err);
      }
      resolve();
    });
  });
}

function disconnectPM2() {
  pm2.disconnect();
}

export async function start() {
  console.log(`正在尝试使用 PM2 启动 '${PM2_APP_NAME}'...`);
  try {
    await connectPM2();
    const scriptPath = path.resolve(process.cwd(), 'bin/web-server.js');
    
    pm2.start({
      script: scriptPath,
      name: PM2_APP_NAME,
      exec_mode: 'fork',
      instances: 1,
    }, (err, apps) => {
      if (err) {
        console.error(`使用 PM2 启动失败:`, err);
      } else {
        console.log(`'${PM2_APP_NAME}' 已成功启动并由 PM2守护。`);
        console.log('你可以安全地关闭 SSH 连接了。');
      }
      disconnectPM2();
    });
  } catch (error) {
    console.error('执行 start 命令时出错:', error);
    disconnectPM2();
  }
}

export async function stop() {
  console.log(`正在尝试停止 '${PM2_APP_NAME}'...`);
  try {
    await connectPM2();
    pm2.stop(PM2_APP_NAME, (err, proc) => {
      if (err) {
        console.error(`停止 '${PM2_APP_NAME}' 时出错:`, err);
      } else {
        console.log(`'${PM2_APP_NAME}' 已成功停止。`);
      }
      disconnectPM2();
    });
  } catch (error) {
    console.error('执行 stop 命令时出错:', error);
    disconnectPM2();
  }
}

export async function restart() {
  console.log(`正在尝试重启 '${PM2_APP_NAME}'...`);
  try {
    await connectPM2();
    pm2.restart(PM2_APP_NAME, (err, proc) => {
      if (err) {
        console.error(`重启 '${PM2_APP_NAME}' 时出错:`, err);
      } else {
        console.log(`'${PM2_APP_NAME}' 已成功重启。`);
      }
      disconnectPM2();
    });
  } catch (error) {
    console.error('执行 restart 命令时出错:', error);
    disconnectPM2();
  }
}

export async function list() {
  console.log('正在获取由 PM2 管理的服务列表...');
  try {
    await connectPM2();
    pm2.list((err, list) => {
      if (err) {
        console.error('获取列表失败:', err);
      } else {
        if (list.length === 0) {
          console.log('PM2 当前没有管理任何服务。');
        } else {
          // 格式化输出，使其更易读
          console.table(list.map(proc => ({
            name: proc.name,
            id: proc.pm_id,
            status: proc.pm2_env.status,
            cpu: proc.monit.cpu,
            memory: `${(proc.monit.memory / 1024 / 1024).toFixed(2)} MB`,
            uptime: `${((Date.now() - proc.pm2_env.pm_uptime) / 1000 / 3600).toFixed(2)}h`
          })));
        }
      }
      disconnectPM2();
    });
  } catch (error) {
    console.error('执行 list 命令时出错:', error);
    disconnectPM2();
  }
}