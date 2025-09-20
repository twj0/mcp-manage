#!/usr/bin/env node

/**
 * 修复public文件路径问题的脚本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixPublicFiles() {
    console.log('🔧 检查和修复public文件...');
    
    const publicDir = path.join(__dirname, 'public');
    const indexPath = path.join(publicDir, 'index.html');
    const stylesPath = path.join(publicDir, 'styles.css');
    const appPath = path.join(publicDir, 'app.js');
    
    try {
        // 检查public目录
        if (!fs.existsSync(publicDir)) {
            console.log('❌ public目录不存在，正在创建...');
            fs.mkdirSync(publicDir, { recursive: true });
        } else {
            console.log('✅ public目录存在');
        }
        
        // 检查index.html
        if (!fs.existsSync(indexPath)) {
            console.log('❌ index.html不存在');
            return false;
        } else {
            console.log('✅ index.html存在');
            const stats = fs.statSync(indexPath);
            console.log(`   文件大小: ${stats.size} bytes`);
            console.log(`   修改时间: ${stats.mtime}`);
        }
        
        // 检查styles.css
        if (!fs.existsSync(stylesPath)) {
            console.log('❌ styles.css不存在');
        } else {
            console.log('✅ styles.css存在');
        }
        
        // 检查app.js
        if (!fs.existsSync(appPath)) {
            console.log('❌ app.js不存在');
        } else {
            console.log('✅ app.js存在');
        }
        
        // 检查文件权限
        try {
            fs.accessSync(indexPath, fs.constants.R_OK);
            console.log('✅ index.html可读');
        } catch (error) {
            console.log('❌ index.html不可读:', error.message);
            return false;
        }
        
        console.log('');
        console.log('📁 Public目录结构:');
        const files = fs.readdirSync(publicDir);
        files.forEach(file => {
            const filePath = path.join(publicDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   ${file} (${stats.size} bytes)`);
        });
        
        console.log('');
        console.log('✅ Public文件检查完成');
        return true;
        
    } catch (error) {
        console.error('❌ 检查过程中出错:', error);
        return false;
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    fixPublicFiles().then(success => {
        if (success) {
            console.log('🎉 所有文件检查通过！');
            process.exit(0);
        } else {
            console.log('💥 发现问题，请检查文件结构');
            process.exit(1);
        }
    }).catch(error => {
        console.error('💥 脚本执行失败:', error);
        process.exit(1);
    });
}

export default fixPublicFiles;