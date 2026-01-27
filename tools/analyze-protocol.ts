/**
 * 协议分析工具
 * 用于分析前端源码中的协议定义，并生成 meta 定义
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 解析 ActionScript 类文件，提取字段定义
 */
function parseASClass(filePath: string): {
  className: string;
  fields: Array<{ name: string; type: string; readMethod: string }>;
} | null {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 提取类名
  const classMatch = content.match(/public class (\w+)/);
  if (!classMatch) return null;
  
  const className = classMatch[1];
  const fields: Array<{ name: string; type: string; readMethod: string }> = [];
  
  // 查找构造函数
  const constructorMatch = content.match(/public function \w+\(param1:IDataInput[^)]*\)[^{]*\{([\s\S]*?)\n\s*\}/);
  if (!constructorMatch) return null;
  
  const constructorBody = constructorMatch[1];
  
  // 提取所有 read 调用
  const readPattern = /this\.(\w+)\s*=\s*param1\.(read\w+)\((.*?)\)/g;
  let match;
  
  while ((match = readPattern.exec(constructorBody)) !== null) {
    const fieldName = match[1];
    const readMethod = match[2];
    const args = match[3];
    
    fields.push({
      name: fieldName,
      type: inferTypeFromReadMethod(readMethod),
      readMethod: args ? `${readMethod}(${args})` : readMethod
    });
  }
  
  return { className, fields };
}

/**
 * 从 read 方法推断字段类型
 */
function inferTypeFromReadMethod(readMethod: string): string {
  const typeMap: Record<string, string> = {
    'readByte': 'uint8',
    'readUnsignedByte': 'uint8',
    'readShort': 'uint16',
    'readUnsignedShort': 'uint16',
    'readInt': 'int32',
    'readUnsignedInt': 'uint32',
    'readFloat': 'float',
    'readDouble': 'double',
    'readBoolean': 'uint8',
    'readUTF': 'varstring',
    'readUTFBytes': 'string',
    'readBytes': 'bytes'
  };
  
  return typeMap[readMethod] || 'unknown';
}

/**
 * 生成 meta 定义代码
 */
function generateMetaDefinition(
  cmdId: number,
  cmdName: string,
  className: string,
  fields: Array<{ name: string; type: string; readMethod: string }>
): string {
  const fieldDefs = fields.map(field => {
    let def = `      { name: '${field.name}', type: '${field.type}'`;
    
    // 添加描述
    def += `, desc: '${field.name}'`;
    
    // 如果是 readUTFBytes，需要 lengthField
    if (field.readMethod.includes('readUTFBytes')) {
      const lengthMatch = field.readMethod.match(/readUTFBytes\(this\.(\w+)\)/);
      if (lengthMatch) {
        def += `, lengthField: '${lengthMatch[1]}'`;
      }
    }
    
    def += ' }';
    return def;
  }).join(',\n');
  
  return `  {
    cmdID: CommandID.${cmdName},
    name: '${cmdName}',
    desc: '${className}',
    request: [],
    response: [
${fieldDefs}
    ]
  }`;
}

/**
 * 扫描前端源码目录，查找所有 Info 类
 */
function scanInfoClasses(sourceDir: string): Array<{
  filePath: string;
  className: string;
  fields: Array<{ name: string; type: string; readMethod: string }>;
}> {
  const results: Array<any> = [];
  
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('Info.as')) {
        const parsed = parseASClass(fullPath);
        if (parsed && parsed.fields.length > 0) {
          results.push({
            filePath: fullPath,
            ...parsed
          });
        }
      }
    }
  }
  
  scanDir(sourceDir);
  return results;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('用法:');
    console.log('  分析单个文件: ts-node tools/analyze-protocol.ts <file.as>');
    console.log('  扫描目录: ts-node tools/analyze-protocol.ts --scan <dir>');
    console.log('');
    console.log('示例:');
    console.log('  ts-node tools/analyze-protocol.ts ../src/core/com/robot/core/info/SystemMsgInfo.as');
    console.log('  ts-node tools/analyze-protocol.ts --scan ../src/core/com/robot/core/info');
    return;
  }
  
  if (args[0] === '--scan') {
    const sourceDir = args[1] || '../src/core/com/robot/core/info';
    console.log(`扫描目录: ${sourceDir}\n`);
    
    const classes = scanInfoClasses(sourceDir);
    console.log(`找到 ${classes.length} 个 Info 类:\n`);
    
    for (const cls of classes) {
      console.log(`\n=== ${cls.className} ===`);
      console.log(`文件: ${cls.filePath}`);
      console.log(`字段数: ${cls.fields.length}`);
      console.log('字段列表:');
      for (const field of cls.fields) {
        console.log(`  - ${field.name}: ${field.type} (${field.readMethod})`);
      }
    }
    
    // 生成汇总报告
    console.log('\n\n=== 汇总报告 ===');
    console.log(`总计: ${classes.length} 个协议类`);
    console.log(`总字段数: ${classes.reduce((sum, cls) => sum + cls.fields.length, 0)}`);
    
  } else {
    const filePath = args[0];
    console.log(`分析文件: ${filePath}\n`);
    
    const parsed = parseASClass(filePath);
    if (!parsed) {
      console.error('无法解析文件');
      return;
    }
    
    console.log(`类名: ${parsed.className}`);
    console.log(`字段数: ${parsed.fields.length}\n`);
    
    console.log('字段列表:');
    for (const field of parsed.fields) {
      console.log(`  ${field.name}: ${field.type} (${field.readMethod})`);
    }
    
    console.log('\n生成的 Meta 定义:\n');
    console.log(generateMetaDefinition(0, 'COMMAND_NAME', parsed.className, parsed.fields));
  }
}

main();
