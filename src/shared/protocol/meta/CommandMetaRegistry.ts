import { DecodeAMF, FormatAMFValue } from '../../utils/AMFDecoder';

/**
 * 字段类型定义
 */
export type FieldType =
  | 'uint8'      // 无符号8位
  | 'uint16'     // 无符号16位
  | 'uint32'     // 无符号32位
  | 'int32'      // 有符号32位
  | 'string'     // 定长字符串
  | 'varstring'  // 变长字符串
  | 'bytes'      // 原始字节
  | 'hex'        // 十六进制显示
  | 'amf'        // AMF3 序列化数据
  | 'array'      // 动态数组
  | 'bytearray'  // 字节数组（显示为数值数组）
  | 'boolarray'  // 布尔数组（显示为布尔值数组）
  | 'bitarray';  // 位数组（每字节展开为8个布尔值）

/**
 * 字段定义
 */
export interface IFieldDef {
  name: string;       // 字段名
  type: FieldType;    // 字段类型
  length?: number;    // 长度 (string/bytes类型需要)
  desc?: string;      // 字段描述
  // 动态数组支持
  arrayCountField?: string;   // 数组长度来源字段名
  arrayFields?: IFieldDef[];  // 数组元素的字段定义
  // 动态长度支持
  lengthField?: string;       // 长度来源字段名（用于动态长度的string/bytes）
  // 嵌套数组支持
  nestedArrays?: boolean;     // 是否包含嵌套数组（用于特殊处理）
}

/**
 * 命令元数据定义
 */
export interface ICommandMeta {
  cmdID: number;          // 命令ID
  name: string;           // 命令名称
  desc: string;           // 命令描述
  request?: IFieldDef[];  // 请求体字段定义
  response?: IFieldDef[]; // 响应体字段定义
}

/**
 * 命令元数据注册表
 */
export class CommandMetaRegistry {
  private _metas: Map<number, ICommandMeta> = new Map();

  /**
   * 注册命令元数据
   */
  public Register(meta: ICommandMeta): void {
    this._metas.set(meta.cmdID, meta);
  }

  /**
   * 批量注册命令元数据
   */
  public RegisterBatch(metas: ICommandMeta[]): void {
    for (const meta of metas) {
      this.Register(meta);
    }
  }

  /**
   * 获取命令元数据
   */
  public Get(cmdID: number): ICommandMeta | undefined {
    return this._metas.get(cmdID);
  }

  /**
   * 获取字段格式字符串
   * 例如: "maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers..."
   */
  public GetFormatString(cmdID: number, isRequest: boolean): string {
    const meta = this._metas.get(cmdID);
    if (!meta) {
      return '(未定义)';
    }

    const fields = isRequest ? meta.request : meta.response;
    if (!fields || fields.length === 0) {
      return '(空)';
    }

    const parts: string[] = [];
    for (const field of fields) {
      const size = this.GetFieldSize(field);
      parts.push(`${field.name}(${size})`);
    }

    return parts.join(' + ');
  }

  /**
   * 获取字段大小
   */
  private GetFieldSize(field: IFieldDef): string {
    switch (field.type) {
      case 'uint8':
        return '1';
      case 'uint16':
        return '2';
      case 'uint32':
      case 'int32':
        return '4';
      case 'string':
      case 'bytes':
      case 'hex':
        return String(field.length || '?');
      case 'varstring':
        return '2+n';
      case 'amf':
        return 'amf';
      case 'array':
        return `[${field.arrayCountField}]`;
      default:
        return '?';
    }
  }

  /**
   * 解析并格式化Body内容
   */
  public ParseBody(cmdID: number, body: Buffer, isRequest: boolean): string {
    const meta = this._metas.get(cmdID);
    if (!meta) {
      // 没有元数据定义，使用智能推断
      return this.ParseBodyWithInference(body);
    }

    const fields = isRequest ? meta.request : meta.response;
    if (!fields || fields.length === 0) {
      if (body.length === 0) return '(空)';
      // 有元数据但没有字段定义，使用智能推断
      return this.ParseBodyWithInference(body);
    }

    return this.ParseFields(body, fields);
  }

  /**
   * 智能推断并解析Body内容
   * 当没有元数据定义时，尝试推断字段类型
   */
  private ParseBodyWithInference(body: Buffer): string {
    if (body.length === 0) return '(空)';
    
    const results: string[] = [];
    let offset = 0;
    let fieldIndex = 0;

    try {
      while (offset < body.length) {
        const remaining = body.length - offset;
        
        // 尝试推断字段类型
        const inferred = this.InferFieldType(body, offset);
        
        if (inferred) {
          results.push(`field${fieldIndex}=${inferred.str} (${inferred.type})`);
          offset += inferred.size;
          fieldIndex++;
        } else {
          // 无法推断，显示剩余数据为十六进制
          const remainingData = body.subarray(offset);
          results.push(`remaining=hex:${remainingData.toString('hex')}`);
          break;
        }
      }
    } catch (e) {
      results.push(`推断失败@${offset}`);
    }

    return results.join(', ');
  }

  /**
   * 推断字段类型
   * 返回推断的类型、值和大小
   */
  private InferFieldType(body: Buffer, offset: number): { str: string; type: string; size: number } | null {
    const remaining = body.length - offset;
    if (remaining === 0) return null;

    // 1. 尝试 uint32 (最常见)
    if (remaining >= 4) {
      const value = body.readUInt32BE(offset);
      
      // 如果值看起来像合理的数字（< 1000000），可能是 uint32
      if (value < 1000000) {
        return { str: String(value), type: 'uint32', size: 4 };
      }
      
      // 如果值很大，可能是时间戳或ID
      if (value > 1000000000 && value < 2000000000) {
        return { str: String(value), type: 'uint32/timestamp', size: 4 };
      }
    }

    // 2. 尝试字符串 (检查是否包含可打印字符)
    if (remaining >= 16) {
      const strData = body.subarray(offset, offset + 16);
      const nullIndex = strData.indexOf(0);
      
      if (nullIndex > 0) {
        // 找到null终止符，可能是字符串
        const str = strData.subarray(0, nullIndex).toString('utf8');
        if (this.IsPrintableString(str)) {
          return { str: `"${str}"`, type: 'string(16)', size: 16 };
        }
      }
    }

    // 3. 尝试 uint16
    if (remaining >= 2) {
      const value = body.readUInt16BE(offset);
      if (value < 10000) {
        return { str: String(value), type: 'uint16', size: 2 };
      }
    }

    // 4. 尝试 uint8
    if (remaining >= 1) {
      const value = body.readUInt8(offset);
      if (value < 256) {
        return { str: String(value), type: 'uint8', size: 1 };
      }
    }

    // 5. 默认：显示为4字节十六进制
    const size = Math.min(4, remaining);
    const hex = body.subarray(offset, offset + size).toString('hex');
    return { str: `hex:${hex}`, type: 'bytes', size };
  }

  /**
   * 检查字符串是否可打印
   */
  private IsPrintableString(str: string): boolean {
    if (str.length === 0) return false;
    
    // 检查是否包含可打印字符
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // 可打印ASCII字符 (32-126) 或中文字符 (> 127)
      if ((code < 32 || code > 126) && code < 128) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 解析字段
   */
  private ParseFields(body: Buffer, fields: IFieldDef[]): string {
    const results: string[] = [];
    let offset = 0;
    const fieldValues: Map<string, number> = new Map(); // 存储已解析的字段值用于数组长度和动态长度

    try {
      for (const field of fields) {
        if (offset >= body.length) break;

        // 处理动态数组
        if (field.type === 'array' && field.arrayCountField && field.arrayFields) {
          const count = fieldValues.get(field.arrayCountField) || 0;
          
          // 检查是否有嵌套数组
          const hasNestedArray = field.arrayFields.some(f => f.type === 'array');
          
          for (let i = 0; i < count; i++) {
            // 为每个数组元素创建独立的字段值存储（用于嵌套数组的计数字段）
            const elementFieldValues = new Map(fieldValues);
            
            for (const subField of field.arrayFields) {
              if (offset >= body.length) break;
              
              // 处理嵌套数组
              if (subField.type === 'array' && subField.arrayCountField && subField.arrayFields) {
                const nestedCount = elementFieldValues.get(subField.arrayCountField) || 0;
                
                for (let j = 0; j < nestedCount; j++) {
                  for (const nestedField of subField.arrayFields) {
                    if (offset >= body.length) break;
                    const value = this.ReadField(body, offset, nestedField, elementFieldValues);
                    if (value !== null) {
                      results.push(`${field.name}[${i}].${subField.name}[${j}].${nestedField.name}=${value.str}`);
                      offset += value.size;
                    }
                  }
                }
              } else {
                const value = this.ReadField(body, offset, subField, elementFieldValues);
                if (value !== null) {
                  results.push(`${field.name}[${i}].${subField.name}=${value.str}`);
                  
                  // 存储数值类型的值（用于嵌套数组的计数）
                  if (subField.type === 'uint8' || subField.type === 'uint16' || subField.type === 'uint32' || subField.type === 'int32') {
                    elementFieldValues.set(subField.name, parseInt(value.str, 10));
                  }
                  
                  offset += value.size;
                }
              }
            }
          }
          continue;
        }

        const value = this.ReadField(body, offset, field, fieldValues);
        if (value !== null) {
          results.push(`${field.name}=${value.str}`);
          // 存储数值类型的值用于数组长度和动态长度
          if (field.type === 'uint8' || field.type === 'uint16' || field.type === 'uint32' || field.type === 'int32') {
            fieldValues.set(field.name, parseInt(value.str, 10));
          }
          offset += value.size;
        }
      }

      // 如果还有剩余数据，显示为十六进制
      if (offset < body.length) {
        const remainingData = body.subarray(offset);
        results.push(`remaining=hex:${remainingData.toString('hex')}`);
      }
    } catch {
      results.push(`解析失败@${offset}`);
    }

    return results.join(', ');
  }

  /**
   * 读取单个字段
   */
  private ReadField(body: Buffer, offset: number, field: IFieldDef, fieldValues?: Map<string, number>): { str: string; size: number } | null {
    if (offset >= body.length) return null;

    switch (field.type) {
      case 'uint8':
        if (offset + 1 > body.length) return null;
        return { str: String(body.readUInt8(offset)), size: 1 };

      case 'uint16':
        if (offset + 2 > body.length) return null;
        return { str: String(body.readUInt16BE(offset)), size: 2 };

      case 'uint32':
        if (offset + 4 > body.length) return null;
        return { str: String(body.readUInt32BE(offset)), size: 4 };

      case 'int32':
        if (offset + 4 > body.length) return null;
        return { str: String(body.readInt32BE(offset)), size: 4 };

      case 'string': {
        // 支持动态长度
        let len = field.length || 16;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField) || len;
        }
        if (offset + len > body.length) return null;
        const str = body.subarray(offset, offset + len).toString('utf8').replace(/\0/g, '');
        return { str: `"${str}"`, size: len };
      }

      case 'varstring': {
        if (offset + 2 > body.length) return null;
        const len = body.readUInt16BE(offset);
        if (offset + 2 + len > body.length) return null;
        const str = body.subarray(offset + 2, offset + 2 + len).toString('utf8');
        return { str: `"${str}"`, size: 2 + len };
      }

      case 'bytes': {
        // 支持动态长度
        let len = field.length || 16;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField) || len;
        }
        if (offset + len > body.length) return null;
        return { str: body.subarray(offset, offset + len).toString('hex'), size: len };
      }

      case 'bytearray': {
        // 字节数组 - 显示为数值数组
        let len = field.length || 16;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField) || len;
        }
        if (offset + len > body.length) return null;
        const bytes = body.subarray(offset, offset + len);
        const values = Array.from(bytes).map(b => b.toString());
        // 限制显示长度
        // if (values.length > 20) {
        //   return { 
        //     str: `[${values.slice(0, 20).join(',')},...+${values.length - 20}]`, 
        //     size: len 
        //   };
        // }
        return { str: `[${values.join(',')}]`, size: len };
      }

      case 'boolarray': {
        // 布尔数组 - 显示为布尔值数组
        let len = field.length || 16;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField) || len;
        }
        if (offset + len > body.length) return null;
        const bytes = body.subarray(offset, offset + len);
        const values = Array.from(bytes).map(b => b === 0 ? 'false' : 'true');
        // 限制显示长度
        // if (values.length > 20) {
        //   return { 
        //     str: `[${values.slice(0, 20).join(',')},...+${values.length - 20}]`, 
        //     size: len 
        //   };
        // }
        return { str: `[${values.join(',')}]`, size: len };
      }

      case 'bitarray': {
        // 位数组 - 每字节展开为8个布尔值
        let len = field.length || 16;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField) || len;
        }
        if (offset + len > body.length) return null;
        const bytes = body.subarray(offset, offset + len);
        const bits: string[] = [];
        
        // 将每个字节的8位展开
        for (const byte of bytes) {
          for (let i = 0; i < 8; i++) {
            const bit = (byte >> i) & 1;
            bits.push(bit === 0 ? 'false' : 'true');
          }
        }
        
        // 限制显示长度
        // if (bits.length > 20) {
        //   return { 
        //     str: `[${bits.slice(0, 20).join(',')},...+${bits.length - 20}bits]`, 
        //     size: len 
        //   };
        // }
        return { str: `[${bits.join(',')}]`, size: len };
      }

      case 'hex': {
        // 支持动态长度
        let len = field.length;
        if (field.lengthField && fieldValues) {
          len = fieldValues.get(field.lengthField);
        }
        if (!len) {
          len = Math.min(32, body.length - offset);
        }
        if (offset + len > body.length) return null;
        return { str: body.subarray(offset, offset + len).toString('hex'), size: len };
      }

      case 'amf': {
        // AMF 数据 - 支持动态长度或消耗剩余所有字节
        let amfLen = field.length;
        if (field.lengthField && fieldValues) {
          amfLen = fieldValues.get(field.lengthField) || 0;
        }
        
        const amfData = amfLen 
          ? body.subarray(offset, Math.min(offset + amfLen, body.length))
          : body.subarray(offset);
        
        if (amfData.length === 0) {
          return { str: '(empty)', size: 0 };
        }
        
        // 检查是否包含UTF-8替换字符（0xEF 0xBF 0xBD），这表示数据被破坏
        const hexStr = Buffer.from(amfData).toString('hex');
        const hasReplacementChar = hexStr.includes('efbfbd');
        
        try {
          const decoded = DecodeAMF(amfData);
          const formatted = FormatAMFValue(decoded);
          
          // 移除警告信息，直接返回格式化结果
          return { str: formatted, size: amfData.length };
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          const preview = hexStr.substring(0, 64);
          
          // 如果包含替换字符，说明是服务器端的UTF-8转换问题
          if (hasReplacementChar) {
            return { 
              str: `amf_corrupted(Server UTF-8 conversion error):hex:${preview}${hexStr.length > 64 ? '...' : ''}`, 
              size: amfData.length 
            };
          }
          
          return { 
            str: `amf_error(${errMsg}):hex:${preview}${hexStr.length > 64 ? '...' : ''}`, 
            size: amfData.length 
          };
        }
      }

      default:
        return null;
    }
  }

  /**
   * 格式化为十六进制
   */
  private FormatHex(body: Buffer): string {
    if (body.length === 0) return '(空)';
    if (body.length <= 32) {
      return `hex:${body.toString('hex')}`;
    }
    return `hex:${body.subarray(0, 32).toString('hex')}...(+${body.length - 32}字节)`;
  }
}
