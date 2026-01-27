/**
 * 数据包对比工具
 * 用于对比实际数据包和 meta 定义，找出未解析的字段
 */

import { CmdMeta } from '../src/shared/protocol/meta';

/**
 * 分析数据包
 */
function analyzePacket(cmdId: number, bodyHex: string, isRequest: boolean = false) {
  const body = Buffer.from(bodyHex, 'hex');
  const meta = CmdMeta.Get(cmdId);
  
  console.log('='.repeat(80));
  console.log(`命令ID: ${cmdId}`);
  console.log(`命令名: ${meta?.name || '未定义'}`);
  console.log(`描述: ${meta?.desc || '无'}`);
  console.log(`方向: ${isRequest ? '请求' : '响应'}`);
  console.log(`数据长度: ${body.length} 字节`);
  console.log('='.repeat(80));
  console.log('');
  
  if (!meta) {
    console.log('❌ 未找到协议定义');
    console.log('');
    console.log('原始数据 (Hex):');
    console.log(formatHex(body));
    console.log('');
    console.log('原始数据 (UTF-8 尝试):');
    console.log(body.toString('utf8').replace(/\0/g, '·'));
    return;
  }
  
  const fields = isRequest ? meta.request : meta.response;
  if (!fields || fields.length === 0) {
    console.log('⚠️  协议定义为空');
    console.log('');
    console.log('原始数据 (Hex):');
    console.log(formatHex(body));
    return;
  }
  
  console.log('📋 字段定义:');
  let offset = 0;
  const fieldValues: Map<string, number> = new Map();
  
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    
    if (offset >= body.length) {
      console.log(`  ${i + 1}. ${field.name} (${field.type}): ⚠️ 数据不足`);
      continue;
    }
    
    try {
      const result = readField(body, offset, field, fieldValues);
      if (result) {
        console.log(`  ${i + 1}. ${field.name} (${field.type}): ${result.displayValue}`);
        if (field.desc) {
          console.log(`      描述: ${field.desc}`);
        }
        console.log(`      偏移: ${offset} - ${offset + result.size - 1} (${result.size} 字节)`);
        
        // 存储数值
        if (['uint8', 'uint16', 'uint32', 'int32'].includes(field.type)) {
          fieldValues.set(field.name, result.rawValue as number);
        }
        
        offset += result.size;
      } else {
        console.log(`  ${i + 1}. ${field.name} (${field.type}): ❌ 解析失败`);
      }
    } catch (err) {
      console.log(`  ${i + 1}. ${field.name} (${field.type}): ❌ 异常 - ${err}`);
    }
    
    console.log('');
  }
  
  // 检查剩余数据
  if (offset < body.length) {
    const remaining = body.subarray(offset);
    console.log('⚠️  剩余未解析数据:');
    console.log(`  长度: ${remaining.length} 字节`);
    console.log(`  偏移: ${offset} - ${body.length - 1}`);
    console.log('');
    console.log('  Hex:');
    console.log(formatHex(remaining, '    '));
    console.log('');
    console.log('  UTF-8 尝试:');
    const utf8Str = remaining.toString('utf8').replace(/\0/g, '·');
    console.log(`    ${utf8Str.substring(0, 200)}${utf8Str.length > 200 ? '...' : ''}`);
    console.log('');
    
    // 尝试分析剩余数据的模式
    console.log('  📊 数据分析:');
    analyzeRemainingData(remaining);
  } else {
    console.log('✅ 所有数据已解析完毕');
  }
}

/**
 * 读取字段
 */
function readField(
  body: Buffer,
  offset: number,
  field: any,
  fieldValues: Map<string, number>
): { displayValue: string; rawValue: any; size: number } | null {
  if (offset >= body.length) return null;
  
  switch (field.type) {
    case 'uint8':
      if (offset + 1 > body.length) return null;
      const u8 = body.readUInt8(offset);
      return { displayValue: String(u8), rawValue: u8, size: 1 };
      
    case 'uint16':
      if (offset + 2 > body.length) return null;
      const u16 = body.readUInt16BE(offset);
      return { displayValue: String(u16), rawValue: u16, size: 2 };
      
    case 'uint32':
      if (offset + 4 > body.length) return null;
      const u32 = body.readUInt32BE(offset);
      return { displayValue: String(u32), rawValue: u32, size: 4 };
      
    case 'int32':
      if (offset + 4 > body.length) return null;
      const i32 = body.readInt32BE(offset);
      return { displayValue: String(i32), rawValue: i32, size: 4 };
      
    case 'string': {
      let len = field.length || 16;
      if (field.lengthField && fieldValues) {
        len = fieldValues.get(field.lengthField) || len;
      }
      if (offset + len > body.length) return null;
      const str = body.subarray(offset, offset + len).toString('utf8').replace(/\0/g, '');
      return { displayValue: `"${str}"`, rawValue: str, size: len };
    }
    
    case 'varstring': {
      if (offset + 2 > body.length) return null;
      const len = body.readUInt16BE(offset);
      if (offset + 2 + len > body.length) return null;
      const str = body.subarray(offset + 2, offset + 2 + len).toString('utf8');
      return { displayValue: `"${str}" (len=${len})`, rawValue: str, size: 2 + len };
    }
    
    case 'bytes':
    case 'hex': {
      let len = field.length;
      if (field.lengthField && fieldValues) {
        len = fieldValues.get(field.lengthField);
      }
      if (!len) {
        len = Math.min(32, body.length - offset);
      }
      if (offset + len > body.length) return null;
      const bytes = body.subarray(offset, offset + len);
      return { displayValue: bytes.toString('hex'), rawValue: bytes, size: len };
    }
    
    default:
      return null;
  }
}

/**
 * 格式化 Hex 输出
 */
function formatHex(buffer: Buffer, indent: string = '  '): string {
  const lines: string[] = [];
  const bytesPerLine = 16;
  
  for (let i = 0; i < buffer.length; i += bytesPerLine) {
    const chunk = buffer.subarray(i, Math.min(i + bytesPerLine, buffer.length));
    const hex = Array.from(chunk)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    const ascii = Array.from(chunk)
      .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
      .join('');
    
    lines.push(`${indent}${i.toString(16).padStart(4, '0')}: ${hex.padEnd(bytesPerLine * 3 - 1, ' ')} | ${ascii}`);
  }
  
  return lines.join('\n');
}

/**
 * 分析剩余数据
 */
function analyzeRemainingData(buffer: Buffer) {
  // 检查是否全为 0
  const allZero = buffer.every(b => b === 0);
  if (allZero) {
    console.log('    - 全为 0 (可能是填充数据)');
    return;
  }
  
  // 检查是否是 UTF-8 文本
  const utf8Str = buffer.toString('utf8');
  const validUtf8 = !utf8Str.includes('\ufffd');
  if (validUtf8 && utf8Str.match(/[\x20-\x7E\u4e00-\u9fa5]/)) {
    console.log('    - 可能是 UTF-8 文本');
  }
  
  // 检查是否有重复模式
  if (buffer.length >= 8) {
    const pattern4 = buffer.subarray(0, 4);
    let repeats = 0;
    for (let i = 4; i < buffer.length; i += 4) {
      if (buffer.subarray(i, i + 4).equals(pattern4)) {
        repeats++;
      }
    }
    if (repeats > 2) {
      console.log(`    - 检测到 4 字节重复模式 (重复 ${repeats} 次)`);
    }
  }
  
  // 尝试解析为 uint32 数组
  if (buffer.length % 4 === 0 && buffer.length >= 4) {
    console.log('    - 可能是 uint32 数组:');
    const values: number[] = [];
    for (let i = 0; i < Math.min(buffer.length, 40); i += 4) {
      values.push(buffer.readUInt32BE(i));
    }
    console.log(`      [${values.join(', ')}${buffer.length > 40 ? ', ...' : ''}]`);
  }
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: ts-node tools/compare-packet.ts <cmdId> <bodyHex> [--request]');
    console.log('');
    console.log('示例:');
    console.log('  ts-node tools/compare-packet.ts 8002 "000100000000000000000001c3..."');
    console.log('  ts-node tools/compare-packet.ts 1001 "a1b2c3d4..." --request');
    return;
  }
  
  const cmdId = parseInt(args[0], 10);
  const bodyHex = args[1].replace(/\s/g, '');
  const isRequest = args.includes('--request');
  
  analyzePacket(cmdId, bodyHex, isRequest);
}

// 如果直接运行
if (require.main === module) {
  main();
}

export { analyzePacket };
