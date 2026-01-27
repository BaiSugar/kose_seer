#!/usr/bin/env ts-node
/**
 * Proto定义验证工具
 * 
 * 功能：
 * 1. 检查Proto命名规范
 * 2. 检查必需方法是否实现
 * 3. 检查字段注释完整性
 * 4. 检查CommandID是否正确使用
 * 
 * 使用方法：
 * npm run tools:validate-proto
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationError {
  file: string;
  line?: number;
  type: 'error' | 'warning';
  message: string;
}

const errors: ValidationError[] = [];

/**
 * 验证Proto文件
 */
function validateProtoFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const lines = content.split('\n');
  
  // 1. 检查命名规范
  const classMatch = content.match(/export class (\w+) extends BaseProto/);
  if (!classMatch) {
    errors.push({
      file: fileName,
      type: 'error',
      message: '未找到继承自BaseProto的类定义'
    });
    return;
  }
  
  const className = classMatch[1];
  
  // 检查命名后缀
  if (!className.endsWith('Proto')) {
    errors.push({
      file: fileName,
      type: 'error',
      message: `类名 ${className} 应该以 Proto 结尾`
    });
  }
  
  // 检查请求/响应命名
  const isRequest = className.includes('Req');
  const isResponse = className.includes('Rsp');
  const isCommon = !isRequest && !isResponse;
  
  if (!isCommon && !isRequest && !isResponse) {
    errors.push({
      file: fileName,
      type: 'warning',
      message: `类名 ${className} 应该包含 Req 或 Rsp 以表明是请求还是响应`
    });
  }
  
  // 2. 检查必需方法
  if (!content.includes('serialize(): Buffer')) {
    errors.push({
      file: fileName,
      type: 'error',
      message: '缺少 serialize() 方法'
    });
  }
  
  // 请求Proto应该有fromBuffer方法
  if (isRequest && !content.includes('static fromBuffer(buffer: Buffer)')) {
    errors.push({
      file: fileName,
      type: 'warning',
      message: '请求Proto建议实现 static fromBuffer() 方法'
    });
  }
  
  // 3. 检查CommandID使用
  const constructorMatch = content.match(/constructor\(\)\s*\{[\s\S]*?super\((.*?)\)/);
  if (constructorMatch) {
    const superArg = constructorMatch[1].trim();
    
    if (isResponse && !superArg.startsWith('CommandID.')) {
      errors.push({
        file: fileName,
        type: 'error',
        message: `响应Proto应该使用 CommandID 枚举，而不是硬编码: ${superArg}`
      });
    }
    
    if ((isRequest || isCommon) && superArg !== '0') {
      errors.push({
        file: fileName,
        type: 'warning',
        message: `请求/通用Proto的super参数应该是0，当前是: ${superArg}`
      });
    }
  }
  
  // 4. 检查字段注释
  const fieldRegex = /^\s*(\w+):\s*(number|string|Buffer|boolean|Array<.+?>)\s*=\s*.+?;(?:\s*\/\/\s*(.+))?$/gm;
  let match;
  let uncommentedFields = 0;
  
  while ((match = fieldRegex.exec(content)) !== null) {
    const [fullMatch, fieldName, , comment] = match;
    
    // 跳过特殊字段
    if (['cmdId', 'result'].includes(fieldName)) continue;
    
    if (!comment || comment.trim() === '') {
      uncommentedFields++;
      const lineNumber = content.substring(0, match.index).split('\n').length;
      errors.push({
        file: fileName,
        line: lineNumber,
        type: 'warning',
        message: `字段 ${fieldName} 缺少注释`
      });
    }
  }
  
  // 5. 检查文档注释
  if (!content.includes('/**') || !content.includes('[CMD:')) {
    errors.push({
      file: fileName,
      type: 'warning',
      message: '缺少文档注释，建议添加 [CMD: XXX (命令ID)] 格式的注释'
    });
  }
  
  // 6. 检查导入
  if (!content.includes("import { BaseProto } from")) {
    errors.push({
      file: fileName,
      type: 'error',
      message: '缺少 BaseProto 导入'
    });
  }
  
  if (isResponse && !content.includes("import { CommandID } from")) {
    errors.push({
      file: fileName,
      type: 'warning',
      message: '响应Proto建议导入 CommandID'
    });
  }
}

/**
 * 扫描Proto目录
 */
function scanProtoDirectory(dir: string): void {
  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('Proto.ts') && !file.includes('.test.')) {
        validateProtoFile(fullPath);
      }
    }
  }
  
  scan(dir);
}

/**
 * 打印验证结果
 */
function printResults(): void {
  if (errors.length === 0) {
    console.log('✅ 所有Proto定义都符合规范！');
    return;
  }
  
  const errorCount = errors.filter(e => e.type === 'error').length;
  const warningCount = errors.filter(e => e.type === 'warning').length;
  
  console.log(`\n发现 ${errorCount} 个错误和 ${warningCount} 个警告:\n`);
  
  // 按文件分组
  const byFile = new Map<string, ValidationError[]>();
  for (const error of errors) {
    if (!byFile.has(error.file)) {
      byFile.set(error.file, []);
    }
    byFile.get(error.file)!.push(error);
  }
  
  // 打印结果
  for (const [file, fileErrors] of byFile) {
    console.log(`📄 ${file}`);
    for (const error of fileErrors) {
      const icon = error.type === 'error' ? '❌' : '⚠️ ';
      const line = error.line ? `:${error.line}` : '';
      console.log(`  ${icon} ${error.message}${line}`);
    }
    console.log('');
  }
  
  // 总结
  console.log('─'.repeat(60));
  console.log(`总计: ${errorCount} 错误, ${warningCount} 警告`);
  
  if (errorCount > 0) {
    console.log('\n❌ 验证失败！请修复错误后重试。');
    process.exit(1);
  } else {
    console.log('\n⚠️  验证通过，但有警告。建议修复警告以提高代码质量。');
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 验证Proto定义...\n');
  
  const protoDir = path.join(__dirname, '../src/shared/proto');
  
  if (!fs.existsSync(protoDir)) {
    console.error('❌ Proto目录不存在:', protoDir);
    process.exit(1);
  }
  
  scanProtoDirectory(protoDir);
  printResults();
}

// 运行
if (require.main === module) {
  main();
}
