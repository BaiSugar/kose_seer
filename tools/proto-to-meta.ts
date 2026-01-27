#!/usr/bin/env ts-node
/**
 * Proto到元数据自动生成工具
 * 
 * 功能：
 * 1. 扫描Proto文件
 * 2. 提取字段定义
 * 3. 生成对应的元数据定义
 * 
 * 使用方法：
 * npm run tools:proto-to-meta
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProtoField {
  name: string;
  type: string;
  length?: number;
  comment?: string;
}

interface ProtoInfo {
  className: string;
  cmdID: string;
  cmdName: string;
  description: string;
  fields: ProtoField[];
  isRequest: boolean;
}

/**
 * 解析Proto文件
 */
function parseProtoFile(filePath: string): ProtoInfo | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 提取类名
  const classMatch = content.match(/export class (\w+) extends BaseProto/);
  if (!classMatch) return null;
  const className = classMatch[1];
  
  // 判断是请求还是响应
  const isRequest = className.includes('Req');
  
  // 提取命令ID
  const cmdIDMatch = content.match(/CommandID\.(\w+)/);
  const cmdID = cmdIDMatch ? cmdIDMatch[1] : '';
  
  // 提取描述
  const descMatch = content.match(/\/\*\*\s*\n\s*\*\s*\[CMD:.*?\]\s*(.+?)\s*\n/);
  const description = descMatch ? descMatch[1] : className;
  
  // 提取字段
  const fields: ProtoField[] = [];
  const fieldRegex = /(\w+):\s*(number|string|Buffer|boolean)\s*=\s*.+?;(?:\s*\/\/\s*(.+))?/g;
  let match;
  
  while ((match = fieldRegex.exec(content)) !== null) {
    const [, name, type, comment] = match;
    
    // 跳过特殊字段
    if (['cmdId', 'result'].includes(name)) continue;
    
    // 转换类型
    let metaType = 'uint32';
    let length: number | undefined;
    
    if (type === 'string') {
      metaType = 'string';
      // 尝试从buildString中提取长度
      const lengthMatch = content.match(new RegExp(`buildString\\(this\\.${name},\\s*(\\d+)\\)`));
      length = lengthMatch ? parseInt(lengthMatch[1]) : 16;
    } else if (type === 'Buffer') {
      metaType = 'hex';
      // 尝试从Buffer.alloc中提取长度
      const lengthMatch = content.match(new RegExp(`${name}.*?Buffer\\.alloc\\((\\d+)\\)`));
      length = lengthMatch ? parseInt(lengthMatch[1]) : 16;
    } else if (type === 'boolean') {
      metaType = 'uint8';
    }
    
    fields.push({
      name,
      type: metaType,
      length,
      comment: comment?.trim()
    });
  }
  
  return {
    className,
    cmdID,
    cmdName: cmdID,
    description,
    fields,
    isRequest
  };
}

/**
 * 生成元数据代码
 */
function generateMetadata(protos: ProtoInfo[]): string {
  const lines: string[] = [];
  
  lines.push("import { CommandID } from '../CommandID';");
  lines.push("import { ICommandMeta } from './CommandMetaRegistry';");
  lines.push("");
  lines.push("/**");
  lines.push(" * 自动生成的元数据");
  lines.push(" * 生成时间: " + new Date().toISOString());
  lines.push(" */");
  lines.push("export const GeneratedMetadata: ICommandMeta[] = [");
  
  for (const proto of protos) {
    lines.push("  {");
    lines.push(`    cmdID: CommandID.${proto.cmdName},`);
    lines.push(`    name: '${proto.cmdName}',`);
    lines.push(`    desc: '${proto.description}',`);
    
    if (proto.fields.length > 0) {
      const fieldType = proto.isRequest ? 'request' : 'response';
      lines.push(`    ${fieldType}: [`);
      
      for (const field of proto.fields) {
        const parts: string[] = [];
        parts.push(`name: '${field.name}'`);
        parts.push(`type: '${field.type}'`);
        if (field.length) {
          parts.push(`length: ${field.length}`);
        }
        if (field.comment) {
          parts.push(`desc: '${field.comment}'`);
        }
        
        lines.push(`      { ${parts.join(', ')} },`);
      }
      
      lines.push("    ]");
    }
    
    lines.push("  },");
  }
  
  lines.push("];");
  
  return lines.join('\n');
}

/**
 * 扫描Proto目录
 */
function scanProtoDirectory(dir: string): ProtoInfo[] {
  const protos: ProtoInfo[] = [];
  
  function scan(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('Proto.ts')) {
        const proto = parseProtoFile(fullPath);
        if (proto && proto.cmdID) {
          protos.push(proto);
        }
      }
    }
  }
  
  scan(dir);
  return protos;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 扫描Proto文件...');
  
  const protoDir = path.join(__dirname, '../src/shared/proto/packets');
  const protos = scanProtoDirectory(protoDir);
  
  console.log(`✅ 找到 ${protos.length} 个Proto定义`);
  
  if (protos.length === 0) {
    console.log('⚠️  没有找到Proto文件');
    return;
  }
  
  console.log('📝 生成元数据...');
  const metadata = generateMetadata(protos);
  
  const outputPath = path.join(__dirname, '../src/shared/protocol/meta/generated.meta.ts');
  fs.writeFileSync(outputPath, metadata, 'utf-8');
  
  console.log(`✅ 元数据已生成: ${outputPath}`);
  console.log('');
  console.log('📋 生成的Proto:');
  for (const proto of protos) {
    console.log(`  - ${proto.className} (${proto.cmdName})`);
  }
  console.log('');
  console.log('💡 提示: 请在 meta/index.ts 中导入并注册生成的元数据');
  console.log('   import { GeneratedMetadata } from \'./generated.meta\';');
  console.log('   CmdMeta.RegisterBatch(GeneratedMetadata);');
}

// 运行
if (require.main === module) {
  main();
}
