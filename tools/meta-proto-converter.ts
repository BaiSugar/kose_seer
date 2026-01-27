#!/usr/bin/env ts-node
/**
 * Meta和Proto双向转换工具
 * 
 * 功能：
 * 1. Proto → Meta: 从Proto类自动生成元数据
 * 2. Meta → Proto: 从元数据自动生成Proto类骨架
 * 
 * 使用方法：
 * npm run tools:proto-to-meta [proto文件路径]  # 生成元数据
 * npm run tools:meta-to-proto [cmdID]          # 生成Proto骨架
 */

import * as fs from 'fs';
import * as path from 'path';

// ==================== 类型定义 ====================

interface ProtoField {
  name: string;
  type: string;
  length?: number;
  comment?: string;
  defaultValue?: string;
}

interface ProtoInfo {
  className: string;
  cmdID: string;
  cmdName: string;
  description: string;
  fields: ProtoField[];
  isRequest: boolean;
  filePath?: string;
}

interface MetaField {
  name: string;
  type: string;
  length?: number;
  desc?: string;
}

interface MetaInfo {
  cmdID: number;
  name: string;
  desc: string;
  request?: MetaField[];
  response?: MetaField[];
}

// ==================== Proto → Meta ====================

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
  
  // 匹配字段定义（支持多行注释）
  const fieldRegex = /(?:\/\*\*\s*\n\s*\*\s*(.+?)\s*\n\s*\*\/\s*\n\s*)?(\w+):\s*(number|string|Buffer|boolean)\s*=\s*(.+?);/g;
  let match;
  
  while ((match = fieldRegex.exec(content)) !== null) {
    const [, comment, name, type, defaultValue] = match;
    
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
      comment: comment?.trim(),
      defaultValue: defaultValue.trim()
    });
  }
  
  return {
    className,
    cmdID,
    cmdName: cmdID,
    description,
    fields,
    isRequest,
    filePath
  };
}

/**
 * 生成元数据代码
 */
function generateMetadataCode(protos: ProtoInfo[]): string {
  const lines: string[] = [];
  
  lines.push("import { CommandID } from '../CommandID';");
  lines.push("import { ICommandMeta } from './CommandMetaRegistry';");
  lines.push("");
  lines.push("/**");
  lines.push(" * 自动生成的元数据");
  lines.push(" * 生成时间: " + new Date().toLocaleString('zh-CN'));
  lines.push(" * 来源: Proto文件自动扫描");
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

// ==================== Meta → Proto ====================

/**
 * 从元数据生成Proto类代码
 */
function generateProtoCode(meta: MetaInfo, isRequest: boolean): string {
  const lines: string[] = [];
  const className = `${toPascalCase(meta.name)}${isRequest ? 'Req' : 'Rsp'}Proto`;
  const fields = isRequest ? meta.request : meta.response;
  
  // 导入
  lines.push("import { BaseProto } from '../../../base/BaseProto';");
  if (!isRequest) {
    lines.push("import { BufferWriter } from '../../../../utils';");
  }
  lines.push("import { CommandID } from '../../../../protocol/CommandID';");
  lines.push("");
  
  // 类注释
  lines.push("/**");
  lines.push(` * [CMD: ${meta.name} (${meta.cmdID})] ${meta.desc}`);
  lines.push(" * ");
  lines.push(" * 此文件由工具自动生成，请根据实际需求修改");
  lines.push(" */");
  
  // 类定义
  lines.push(`export class ${className} extends BaseProto {`);
  
  // 字段定义
  if (fields && fields.length > 0) {
    for (const field of fields) {
      if (field.desc) {
        lines.push(`  /** ${field.desc} */`);
      }
      const defaultValue = getDefaultValue(field.type);
      lines.push(`  ${field.name}: ${getTypeScriptType(field.type)} = ${defaultValue};`);
    }
    lines.push("");
  }
  
  // 构造函数
  lines.push("  constructor() {");
  if (isRequest) {
    lines.push("    super(0); // 请求Proto不需要cmdId");
  } else {
    lines.push(`    super(CommandID.${meta.name});`);
  }
  lines.push("  }");
  lines.push("");
  
  // serialize方法
  lines.push("  serialize(): Buffer {");
  if (isRequest) {
    lines.push("    // TODO: 实现序列化逻辑");
    lines.push("    return Buffer.alloc(0);");
  } else {
    if (!fields || fields.length === 0) {
      lines.push("    return Buffer.alloc(0);");
    } else {
      // 计算buffer大小
      let bufferSize = 0;
      for (const field of fields) {
        bufferSize += getFieldSize(field);
      }
      
      lines.push(`    const writer = new BufferWriter(${bufferSize});`);
      for (const field of fields) {
        lines.push(`    ${generateWriteCode(field)}`);
      }
      lines.push("    return writer.ToBuffer();");
    }
  }
  lines.push("  }");
  
  // fromBuffer方法（仅请求Proto需要）
  if (isRequest && fields && fields.length > 0) {
    lines.push("");
    lines.push(`  static fromBuffer(buffer: Buffer): ${className} {`);
    lines.push(`    const proto = new ${className}();`);
    lines.push(`    if (buffer.length >= ${calculateMinBufferSize(fields)}) {`);
    
    let offset = 0;
    for (const field of fields) {
      lines.push(`      ${generateReadCode(field, offset)}`);
      offset += getFieldSize(field);
    }
    
    lines.push("    }");
    lines.push("    return proto;");
    lines.push("  }");
  }
  
  // setter方法（响应Proto）
  if (!isRequest && fields && fields.length > 0) {
    for (const field of fields) {
      lines.push("");
      lines.push(`  set${toPascalCase(field.name)}(value: ${getTypeScriptType(field.type)}): this {`);
      lines.push(`    this.${field.name} = value;`);
      lines.push("    return this;");
      lines.push("  }");
    }
  }
  
  lines.push("}");
  
  return lines.join('\n');
}

// ==================== 辅助函数 ====================

function toPascalCase(str: string): string {
  return str.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function getTypeScriptType(metaType: string): string {
  if (metaType === 'string') return 'string';
  if (metaType === 'hex') return 'Buffer';
  if (metaType === 'uint8' || metaType === 'uint16' || metaType === 'uint32') return 'number';
  return 'any';
}

function getDefaultValue(metaType: string): string {
  if (metaType === 'string') return "''";
  if (metaType === 'hex') return 'Buffer.alloc(0)';
  return '0';
}

function getFieldSize(field: MetaField): number {
  if (field.type === 'string') return field.length || 16;
  if (field.type === 'hex') return field.length || 16;
  if (field.type === 'uint8') return 1;
  if (field.type === 'uint16') return 2;
  if (field.type === 'uint32') return 4;
  return 4;
}

function calculateMinBufferSize(fields: MetaField[]): number {
  return fields.reduce((sum, field) => sum + getFieldSize(field), 0);
}

function generateWriteCode(field: MetaField): string {
  if (field.type === 'string') {
    return `writer.buildString(this.${field.name}, ${field.length || 16});`;
  }
  if (field.type === 'hex') {
    return `writer.WriteBuffer(this.${field.name});`;
  }
  if (field.type === 'uint8') {
    return `writer.WriteUInt8(this.${field.name});`;
  }
  if (field.type === 'uint16') {
    return `writer.WriteUInt16(this.${field.name});`;
  }
  if (field.type === 'uint32') {
    return `writer.WriteUInt32(this.${field.name});`;
  }
  return `// TODO: Write ${field.name}`;
}

function generateReadCode(field: MetaField, offset: number): string {
  if (field.type === 'string') {
    const length = field.length || 16;
    return `proto.${field.name} = buffer.toString('utf8', ${offset}, ${offset + length}).replace(/\\0/g, '').trim();`;
  }
  if (field.type === 'hex') {
    const length = field.length || 16;
    return `proto.${field.name} = buffer.slice(${offset}, ${offset + length});`;
  }
  if (field.type === 'uint8') {
    return `proto.${field.name} = buffer.readUInt8(${offset});`;
  }
  if (field.type === 'uint16') {
    return `proto.${field.name} = buffer.readUInt16BE(${offset});`;
  }
  if (field.type === 'uint32') {
    return `proto.${field.name} = buffer.readUInt32BE(${offset});`;
  }
  return `// TODO: Read ${field.name}`;
}

function scanProtoDirectory(dir: string): ProtoInfo[] {
  const protos: ProtoInfo[] = [];
  
  function scan(currentDir: string): void {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('Proto.ts')) {
        const proto = parseProtoFile(fullPath);
        if (proto && proto.cmdID) {
          proto.filePath = fullPath;
          protos.push(proto);
        }
      }
    }
  }
  
  scan(dir);
  return protos;
}

/**
 * 从元数据文件中查找指定命令
 */
function findMetaByCommand(cmdName: string): MetaInfo | null {
  const metaDir = path.join(__dirname, '../src/shared/protocol/meta');
  const files = fs.readdirSync(metaDir).filter(f => f.endsWith('.meta.ts') && f !== 'CommandMetaRegistry.ts');
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(metaDir, file), 'utf-8');
    
    // 查找包含指定命令的元数据对象
    const pattern = new RegExp(
      `{[^}]*cmdID:\\s*CommandID\\.${cmdName}[\\s\\S]*?(?=\\n\\s*},?\\s*(?:{|\\];))`,
      'g'
    );
    
    const match = pattern.exec(content);
    if (match) {
      console.log(`✅ 在 ${file} 中找到 ${cmdName}`);
      
      try {
        // 解析元数据对象
        const metaText = match[0] + '\n  }';
        
        // 提取cmdID
        const cmdIDMatch = metaText.match(/cmdID:\s*CommandID\.(\w+)/);
        if (!cmdIDMatch) return null;
        
        // 提取name
        const nameMatch = metaText.match(/name:\s*['"](\w+)['"]/);
        const name = nameMatch ? nameMatch[1] : cmdName;
        
        // 提取desc
        const descMatch = metaText.match(/desc:\s*['"]([^'"]+)['"]/);
        const desc = descMatch ? descMatch[1] : name;
        
        // 提取request字段
        let request: MetaField[] | undefined;
        const requestMatch = metaText.match(/request:\s*\[([\s\S]*?)\]/);
        if (requestMatch) {
          request = parseMetaFields(requestMatch[1]);
        }
        
        // 提取response字段
        let response: MetaField[] | undefined;
        const responseMatch = metaText.match(/response:\s*\[([\s\S]*?)\]/);
        if (responseMatch) {
          response = parseMetaFields(responseMatch[1]);
        }
        
        return {
          cmdID: 0, // 实际值不重要，只用于生成代码
          name,
          desc,
          request,
          response
        };
      } catch (error) {
        console.error(`❌ 解析元数据失败: ${error}`);
        return null;
      }
    }
  }
  
  console.log(`❌ 未找到命令 ${cmdName}`);
  return null;
}

/**
 * 解析元数据字段数组
 */
function parseMetaFields(fieldsText: string): MetaField[] {
  const fields: MetaField[] = [];
  
  // 匹配每个字段对象 { name: 'xxx', type: 'xxx', ... }
  const fieldPattern = /{([^}]+)}/g;
  let match;
  
  while ((match = fieldPattern.exec(fieldsText)) !== null) {
    const fieldText = match[1];
    
    // 提取name
    const nameMatch = fieldText.match(/name:\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    
    // 提取type
    const typeMatch = fieldText.match(/type:\s*['"]([^'"]+)['"]/);
    if (!typeMatch) continue;
    const type = typeMatch[1];
    
    // 提取length（可选）
    const lengthMatch = fieldText.match(/length:\s*(\d+)/);
    const length = lengthMatch ? parseInt(lengthMatch[1]) : undefined;
    
    // 提取desc（可选）
    const descMatch = fieldText.match(/desc:\s*['"]([^'"]+)['"]/);
    const desc = descMatch ? descMatch[1] : undefined;
    
    fields.push({ name, type, length, desc });
  }
  
  return fields;
}

// ==================== 主函数 ====================

function protoToMeta(protoPath?: string, testMode: boolean = false) {
  console.log('🔍 Proto → Meta: 扫描Proto文件...');
  
  let protos: ProtoInfo[];
  
  if (protoPath) {
    // 解析单个文件
    const proto = parseProtoFile(protoPath);
    if (!proto) {
      console.log('❌ 无法解析Proto文件');
      return;
    }
    protos = [proto];
  } else {
    // 扫描整个目录
    const protoDir = path.join(__dirname, '../src/shared/proto/packets');
    protos = scanProtoDirectory(protoDir);
  }
  
  console.log(`✅ 找到 ${protos.length} 个Proto定义`);
  
  if (protos.length === 0) {
    console.log('⚠️  没有找到Proto文件');
    return;
  }
  
  console.log('📝 生成元数据...');
  const metadata = generateMetadataCode(protos);
  
  // 根据模式选择输出路径
  const outputDir = testMode 
    ? path.join(__dirname, '../test-output')
    : path.join(__dirname, '../src/shared/protocol/meta');
  
  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'generated.meta.ts');
  fs.writeFileSync(outputPath, metadata, 'utf-8');
  
  console.log(`✅ 元数据已生成: ${outputPath}`);
  console.log('');
  console.log('📋 生成的Proto:');
  for (const proto of protos) {
    console.log(`  - ${proto.className} (${proto.cmdName})`);
  }
  
  if (!testMode) {
    console.log('');
    console.log('💡 提示: 请在 meta/index.ts 中导入并注册生成的元数据');
    console.log('   import { GeneratedMetadata } from \'./generated.meta\';');
    console.log('   CmdMeta.RegisterBatch(GeneratedMetadata);');
  } else {
    console.log('');
    console.log('📁 测试模式: 文件已生成到 test-output/ 目录');
    console.log('💡 检查格式无误后，使用正式模式生成到 src/ 目录');
  }
}

function metaToProto(cmdName: string, testMode: boolean = false) {
  console.log(`🔍 Meta → Proto: 查找命令 ${cmdName}...`);
  
  const meta = findMetaByCommand(cmdName);
  
  if (!meta) {
    console.log('❌ 未找到对应的元数据');
    console.log('💡 提示: 请先在 meta/*.meta.ts 中定义元数据');
    return;
  }
  
  console.log('📝 生成Proto代码...');
  
  // 根据模式选择输出路径
  const baseDir = testMode 
    ? path.join(__dirname, '../test-output/proto')
    : path.join(__dirname, '../src/shared/proto/packets');
  
  // 生成请求Proto
  if (meta.request && meta.request.length > 0) {
    const reqCode = generateProtoCode(meta, true);
    const reqClassName = `${toPascalCase(meta.name)}ReqProto`;
    const reqPath = path.join(baseDir, `req/${reqClassName}.ts`);
    fs.mkdirSync(path.dirname(reqPath), { recursive: true });
    fs.writeFileSync(reqPath, reqCode, 'utf-8');
    console.log(`✅ 请求Proto已生成: ${reqPath}`);
  }
  
  // 生成响应Proto
  if (meta.response && meta.response.length > 0) {
    const rspCode = generateProtoCode(meta, false);
    const rspClassName = `${toPascalCase(meta.name)}RspProto`;
    const rspPath = path.join(baseDir, `rsp/${rspClassName}.ts`);
    fs.mkdirSync(path.dirname(rspPath), { recursive: true });
    fs.writeFileSync(rspPath, rspCode, 'utf-8');
    console.log(`✅ 响应Proto已生成: ${rspPath}`);
  }
  
  if (testMode) {
    console.log('');
    console.log('📁 测试模式: 文件已生成到 test-output/proto/ 目录');
    console.log('💡 检查格式无误后，使用正式模式生成到 src/ 目录');
  }
}

function showHelp() {
  console.log('Meta和Proto双向转换工具');
  console.log('');
  console.log('用法:');
  console.log('  npm run tools:proto-to-meta [--test] [proto文件路径]  # Proto → Meta');
  console.log('  npm run tools:meta-to-proto [--test] <cmdName>        # Meta → Proto');
  console.log('');
  console.log('选项:');
  console.log('  --test    测试模式，生成到 test-output/ 目录');
  console.log('');
  console.log('示例:');
  console.log('  npm run tools:proto-to-meta --test                    # 测试：扫描所有Proto生成元数据');
  console.log('  npm run tools:proto-to-meta                           # 正式：生成到src目录');
  console.log('  npm run tools:meta-to-proto --test LOGIN              # 测试：从LOGIN元数据生成Proto');
  console.log('  npm run tools:meta-to-proto LOGIN                     # 正式：生成到src目录');
}

// 运行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 检查是否是测试模式
  const testMode = args.includes('--test');
  const filteredArgs = args.filter(arg => arg !== '--test');
  const command = filteredArgs[0];
  
  if (!command || command === '--help' || command === '-h') {
    showHelp();
  } else if (command === 'proto-to-meta') {
    protoToMeta(filteredArgs[1], testMode);
  } else if (command === 'meta-to-proto') {
    if (!filteredArgs[1]) {
      console.log('❌ 请指定命令名称');
      console.log('示例: npm run tools:meta-to-proto LOGIN');
    } else {
      metaToProto(filteredArgs[1], testMode);
    }
  } else {
    // 默认：Proto → Meta
    protoToMeta(command, testMode);
  }
}

export { protoToMeta, metaToProto, parseProtoFile, generateProtoCode };
