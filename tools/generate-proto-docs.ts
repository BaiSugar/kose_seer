#!/usr/bin/env ts-node
/**
 * 协议文档生成工具
 * 
 * 功能：
 * 1. 扫描所有Proto定义
 * 2. 生成Markdown格式的协议文档
 * 3. 包含字段说明、类型、长度等信息
 * 
 * 使用方法：
 * npm run tools:generate-docs
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProtoField {
  name: string;
  type: string;
  defaultValue: string;
  comment: string;
  length?: number;
}

interface ProtoDoc {
  className: string;
  cmdID: string;
  cmdName: string;
  description: string;
  filePath: string;
  isRequest: boolean;
  isResponse: boolean;
  fields: ProtoField[];
}

/**
 * 解析Proto文件
 */
function parseProtoFile(filePath: string): ProtoDoc | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取类名
  const classMatch = content.match(/export class (\w+) extends BaseProto/);
  if (!classMatch) return null;
  const className = classMatch[1];
  
  // 判断类型
  const isRequest = className.includes('Req');
  const isResponse = className.includes('Rsp');
  
  // 提取命令ID
  const cmdIDMatch = content.match(/CommandID\.(\w+)/);
  const cmdID = cmdIDMatch ? cmdIDMatch[1] : 'N/A';
  
  // 提取描述
  const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*\[CMD:.*?\]\s*(.+?)\s*\n/);
  const description = descMatch ? descMatch[1] : '';
  
  // 提取字段
  const fields: ProtoField[] = [];
  const fieldRegex = /(\w+):\s*(number|string|Buffer|boolean|Array<.+?>)\s*=\s*(.+?);(?:\s*\/\/\s*(.+))?/g;
  let match;
  
  while ((match = fieldRegex.exec(content)) !== null) {
    const [, name, type, defaultValue, comment] = match;
    
    // 跳过特殊字段
    if (['cmdId', 'result'].includes(name)) continue;
    
    // 尝试提取长度
    let length: number | undefined;
    if (type === 'string') {
      const lengthMatch = content.match(new RegExp(`buildString\\(this\\.${name},\\s*(\\d+)\\)`));
      length = lengthMatch ? parseInt(lengthMatch[1]) : undefined;
    } else if (type === 'Buffer') {
      const lengthMatch = content.match(new RegExp(`${name}.*?Buffer\\.alloc\\((\\d+)\\)`));
      length = lengthMatch ? parseInt(lengthMatch[1]) : undefined;
    }
    
    fields.push({
      name,
      type,
      defaultValue: defaultValue.trim(),
      comment: comment?.trim() || '',
      length
    });
  }
  
  return {
    className,
    cmdID,
    cmdName: cmdID,
    description,
    filePath: path.relative(path.join(__dirname, '..'), filePath),
    isRequest,
    isResponse,
    fields
  };
}

/**
 * 扫描Proto目录
 */
function scanProtoDirectory(dir: string): ProtoDoc[] {
  const protos: ProtoDoc[] = [];
  
  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('Proto.ts')) {
        const proto = parseProtoFile(fullPath);
        if (proto) {
          protos.push(proto);
        }
      }
    }
  }
  
  scan(dir);
  return protos;
}

/**
 * 生成Markdown文档
 */
function generateMarkdown(protos: ProtoDoc[]): string {
  const lines: string[] = [];
  
  // 标题
  lines.push('# 协议文档');
  lines.push('');
  lines.push('> 自动生成于: ' + new Date().toLocaleString('zh-CN'));
  lines.push('');
  
  // 目录
  lines.push('## 目录');
  lines.push('');
  
  // 按模块分组
  const byModule = new Map<string, ProtoDoc[]>();
  for (const proto of protos) {
    const module = proto.filePath.split('/')[4] || 'other'; // packets/req/login -> login
    if (!byModule.has(module)) {
      byModule.set(module, []);
    }
    byModule.get(module)!.push(proto);
  }
  
  // 生成目录
  for (const [module, moduleProtos] of byModule) {
    lines.push(`- [${module}](#${module})`);
    for (const proto of moduleProtos) {
      lines.push(`  - [${proto.className}](#${proto.className.toLowerCase()})`);
    }
  }
  lines.push('');
  
  // 生成详细文档
  for (const [module, moduleProtos] of byModule) {
    lines.push(`## ${module}`);
    lines.push('');
    
    for (const proto of moduleProtos) {
      lines.push(`### ${proto.className}`);
      lines.push('');
      
      // 基本信息
      if (proto.description) {
        lines.push(`**描述:** ${proto.description}`);
        lines.push('');
      }
      
      lines.push(`**类型:** ${proto.isRequest ? '请求' : proto.isResponse ? '响应' : '通用'}`);
      lines.push('');
      
      if (proto.cmdID !== 'N/A') {
        lines.push(`**命令ID:** \`CommandID.${proto.cmdID}\``);
        lines.push('');
      }
      
      lines.push(`**文件路径:** \`${proto.filePath}\``);
      lines.push('');
      
      // 字段表格
      if (proto.fields.length > 0) {
        lines.push('**字段:**');
        lines.push('');
        lines.push('| 字段名 | 类型 | 默认值 | 长度 | 说明 |');
        lines.push('|--------|------|--------|------|------|');
        
        for (const field of proto.fields) {
          const lengthStr = field.length ? `${field.length}字节` : '-';
          lines.push(`| ${field.name} | ${field.type} | ${field.defaultValue} | ${lengthStr} | ${field.comment || '-'} |`);
        }
        lines.push('');
      } else {
        lines.push('*无字段*');
        lines.push('');
      }
      
      lines.push('---');
      lines.push('');
    }
  }
  
  // 统计信息
  lines.push('## 统计信息');
  lines.push('');
  lines.push(`- 总协议数: ${protos.length}`);
  lines.push(`- 请求Proto: ${protos.filter(p => p.isRequest).length}`);
  lines.push(`- 响应Proto: ${protos.filter(p => p.isResponse).length}`);
  lines.push(`- 通用Proto: ${protos.filter(p => !p.isRequest && !p.isResponse).length}`);
  lines.push(`- 模块数: ${byModule.size}`);
  lines.push('');
  
  return lines.join('\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 扫描Proto文件...');
  
  const protoDir = path.join(__dirname, '../src/shared/proto');
  const protos = scanProtoDirectory(protoDir);
  
  console.log(`✅ 找到 ${protos.length} 个Proto定义`);
  
  if (protos.length === 0) {
    console.log('⚠️  没有找到Proto文件');
    return;
  }
  
  console.log('📝 生成文档...');
  const markdown = generateMarkdown(protos);
  
  const outputPath = path.join(__dirname, '../docs/protocol-reference.md');
  fs.writeFileSync(outputPath, markdown, 'utf-8');
  
  console.log(`✅ 文档已生成: ${outputPath}`);
  console.log('');
  console.log('📊 统计:');
  console.log(`  - 总协议数: ${protos.length}`);
  console.log(`  - 请求Proto: ${protos.filter(p => p.isRequest).length}`);
  console.log(`  - 响应Proto: ${protos.filter(p => p.isResponse).length}`);
  console.log(`  - 通用Proto: ${protos.filter(p => !p.isRequest && !p.isResponse).length}`);
}

// 运行
if (require.main === module) {
  main();
}
