/**
 * AMF3 解码器 - 解析 Flash ByteArray.writeObject() 序列化的数据
 *
 * AMF (Action Message Format) 是 Adobe Flash 使用的二进制序列化格式
 * AMF3 是较新的版本，更紧凑高效
 *
 * 参考: https://en.wikipedia.org/wiki/Action_Message_Format
 */

/**
 * AMF3 类型标记
 */
export enum AMF3Type {
  UNDEFINED = 0x00,
  NULL = 0x01,
  FALSE = 0x02,
  TRUE = 0x03,
  INTEGER = 0x04,
  DOUBLE = 0x05,
  STRING = 0x06,
  XML_DOC = 0x07,
  DATE = 0x08,
  ARRAY = 0x09,
  OBJECT = 0x0a,
  XML = 0x0b,
  BYTE_ARRAY = 0x0c,
  VECTOR_INT = 0x0d,
  VECTOR_UINT = 0x0e,
  VECTOR_DOUBLE = 0x0f,
  VECTOR_OBJECT = 0x10,
  DICTIONARY = 0x11,
}

/**
 * AMF3 解码器
 */
export class AMFDecoder {
  private _buffer: Buffer;
  private _offset: number = 0;
  private _stringRefs: string[] = [];
  private _objectRefs: unknown[] = [];
  private _traitRefs: AMFTrait[] = [];

  constructor(buffer: Buffer) {
    this._buffer = buffer;
  }

  /**
   * 解码 AMF3 数据
   */
  public Decode(): unknown {
    if (this._offset >= this._buffer.length) {
      return undefined;
    }
    try {
      return this.ReadValue();
    } catch (e) {
      // 如果解码失败，返回错误信息和已读取的偏移量
      const err = e instanceof Error ? e : new Error(String(e));
      throw new Error(`AMF decode failed at offset ${this._offset}/${this._buffer.length}: ${err.message}`);
    }
  }

  /**
   * 获取当前偏移量
   */
  public get Offset(): number {
    return this._offset;
  }

  /**
   * 读取一个值
   */
  private ReadValue(): unknown {
    const type = this.ReadUInt8();

    switch (type) {
      case AMF3Type.UNDEFINED:
        return undefined;
      case AMF3Type.NULL:
        return null;
      case AMF3Type.FALSE:
        return false;
      case AMF3Type.TRUE:
        return true;
      case AMF3Type.INTEGER:
        return this.ReadU29();
      case AMF3Type.DOUBLE:
        return this.ReadDouble();
      case AMF3Type.STRING:
        return this.ReadString();
      case AMF3Type.XML_DOC:
      case AMF3Type.XML:
        return this.ReadXML();
      case AMF3Type.DATE:
        return this.ReadDate();
      case AMF3Type.ARRAY:
        return this.ReadArray();
      case AMF3Type.OBJECT:
        return this.ReadObject();
      case AMF3Type.BYTE_ARRAY:
        return this.ReadByteArray();
      case AMF3Type.VECTOR_INT:
        return this.ReadVectorInt();
      case AMF3Type.VECTOR_UINT:
        return this.ReadVectorUInt();
      case AMF3Type.VECTOR_DOUBLE:
        return this.ReadVectorDouble();
      case AMF3Type.VECTOR_OBJECT:
        return this.ReadVectorObject();
      case AMF3Type.DICTIONARY:
        return this.ReadDictionary();
      default:
        throw new Error(`Unknown AMF3 type: 0x${type.toString(16)} at offset ${this._offset - 1}`);
    }
  }

  // ============================================================
  // 基础类型读取
  // ============================================================

  private ReadUInt8(): number {
    if (this._offset >= this._buffer.length) {
      throw new Error(`ReadUInt8: offset ${this._offset} >= buffer length ${this._buffer.length}`);
    }
    const value = this._buffer.readUInt8(this._offset);
    this._offset += 1;
    return value;
  }

  private ReadDouble(): number {
    if (this._offset + 8 > this._buffer.length) {
      throw new Error(`ReadDouble: need 8 bytes at offset ${this._offset}, but only ${this._buffer.length - this._offset} bytes available`);
    }
    const value = this._buffer.readDoubleBE(this._offset);
    this._offset += 8;
    return value;
  }

  /**
   * 读取 U29 变长整数
   * AMF3 使用变长编码，每字节最高位表示是否还有后续字节
   */
  private ReadU29(): number {
    let result = 0;
    let byte: number;

    // 最多读取4字节
    for (let i = 0; i < 4; i++) {
      byte = this.ReadUInt8();

      if (i < 3) {
        // 前3字节：取低7位
        result = (result << 7) | (byte & 0x7f);
        if ((byte & 0x80) === 0) {
          return result;
        }
      } else {
        // 第4字节：取全部8位
        result = (result << 8) | byte;
      }
    }

    // 处理符号位 (29位有符号整数)
    if (result >= 0x10000000) {
      result -= 0x20000000;
    }

    return result;
  }

  // ============================================================
  // 字符串读取
  // ============================================================

  private ReadString(): string {
    const ref = this.ReadU29();

    // 最低位为0表示引用
    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._stringRefs[index] ?? '';
    }

    // 最低位为1表示内联字符串
    const length = ref >> 1;
    if (length === 0) {
      return '';
    }

    const str = this._buffer.toString('utf8', this._offset, this._offset + length);
    this._offset += length;

    // 非空字符串加入引用表
    this._stringRefs.push(str);

    return str;
  }

  // ============================================================
  // 复杂类型读取
  // ============================================================

  private ReadDate(): Date {
    const ref = this.ReadU29();

    // 引用
    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as Date;
    }

    // 内联
    const timestamp = this.ReadDouble();
    const date = new Date(timestamp);
    this._objectRefs.push(date);
    return date;
  }

  private ReadArray(): unknown[] | Record<string, unknown> {
    const ref = this.ReadU29();

    // 引用
    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as unknown[];
    }

    const denseCount = ref >> 1;
    const result: Record<string, unknown> = {};

    // 先添加到引用表（处理循环引用）
    this._objectRefs.push(result);

    // 读取关联部分 (key-value pairs)
    let key = this.ReadString();
    while (key !== '') {
      result[key] = this.ReadValue();
      key = this.ReadString();
    }

    // 读取密集部分 (indexed array)
    const denseArray: unknown[] = [];
    for (let i = 0; i < denseCount; i++) {
      denseArray.push(this.ReadValue());
    }

    // 如果只有密集部分，返回数组
    if (Object.keys(result).length === 0) {
      // 替换引用表中的对象
      this._objectRefs[this._objectRefs.length - 1] = denseArray;
      return denseArray;
    }

    // 混合数组：将密集部分合并到对象中
    for (let i = 0; i < denseArray.length; i++) {
      result[i] = denseArray[i];
    }

    return result;
  }

  private ReadObject(): Record<string, unknown> {
    const ref = this.ReadU29();

    // 引用
    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as Record<string, unknown>;
    }

    // 读取 trait
    const trait = this.ReadTrait(ref);
    const obj: Record<string, unknown> = {};

    // 先添加到引用表
    this._objectRefs.push(obj);

    // 如果有类名，添加到对象
    if (trait.className) {
      obj['__class__'] = trait.className;
    }

    // 读取静态属性
    for (const propName of trait.properties) {
      obj[propName] = this.ReadValue();
    }

    // 读取动态属性
    if (trait.dynamic) {
      let key = this.ReadString();
      while (key !== '') {
        obj[key] = this.ReadValue();
        key = this.ReadString();
      }
    }

    return obj;
  }

  private ReadTrait(ref: number): AMFTrait {
    // trait 引用
    if ((ref & 3) === 1) {
      const index = ref >> 2;
      return this._traitRefs[index];
    }

    // 内联 trait
    const trait: AMFTrait = {
      className: '',
      dynamic: false,
      externalizable: false,
      properties: [],
    };

    trait.externalizable = (ref & 4) !== 0;
    trait.dynamic = (ref & 8) !== 0;
    const propCount = ref >> 4;

    trait.className = this.ReadString();

    // 读取属性名
    for (let i = 0; i < propCount; i++) {
      trait.properties.push(this.ReadString());
    }

    this._traitRefs.push(trait);
    return trait;
  }

  private ReadXML(): string {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as string;
    }

    const length = ref >> 1;
    const xml = this._buffer.toString('utf8', this._offset, this._offset + length);
    this._offset += length;

    this._objectRefs.push(xml);
    return xml;
  }

  private ReadByteArray(): Buffer {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as Buffer;
    }

    const length = ref >> 1;
    const data = this._buffer.subarray(this._offset, this._offset + length);
    this._offset += length;

    this._objectRefs.push(data);
    return data;
  }

  // ============================================================
  // Vector 类型读取
  // ============================================================

  private ReadVectorInt(): number[] {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as number[];
    }

    const count = ref >> 1;
    this.ReadUInt8(); // fixed flag

    const result: number[] = [];
    this._objectRefs.push(result);

    for (let i = 0; i < count; i++) {
      result.push(this._buffer.readInt32BE(this._offset));
      this._offset += 4;
    }

    return result;
  }

  private ReadVectorUInt(): number[] {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as number[];
    }

    const count = ref >> 1;
    this.ReadUInt8(); // fixed flag

    const result: number[] = [];
    this._objectRefs.push(result);

    for (let i = 0; i < count; i++) {
      result.push(this._buffer.readUInt32BE(this._offset));
      this._offset += 4;
    }

    return result;
  }

  private ReadVectorDouble(): number[] {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as number[];
    }

    const count = ref >> 1;
    this.ReadUInt8(); // fixed flag

    const result: number[] = [];
    this._objectRefs.push(result);

    for (let i = 0; i < count; i++) {
      result.push(this.ReadDouble());
    }

    return result;
  }

  private ReadVectorObject(): unknown[] {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as unknown[];
    }

    const count = ref >> 1;
    this.ReadUInt8(); // fixed flag
    this.ReadString(); // type name

    const result: unknown[] = [];
    this._objectRefs.push(result);

    for (let i = 0; i < count; i++) {
      result.push(this.ReadValue());
    }

    return result;
  }

  private ReadDictionary(): Map<unknown, unknown> {
    const ref = this.ReadU29();

    if ((ref & 1) === 0) {
      const index = ref >> 1;
      return this._objectRefs[index] as Map<unknown, unknown>;
    }

    const count = ref >> 1;
    this.ReadUInt8(); // weak keys flag

    const result = new Map<unknown, unknown>();
    this._objectRefs.push(result);

    for (let i = 0; i < count; i++) {
      const key = this.ReadValue();
      const value = this.ReadValue();
      result.set(key, value);
    }

    return result;
  }
}

/**
 * AMF Trait 定义
 */
interface AMFTrait {
  className: string;
  dynamic: boolean;
  externalizable: boolean;
  properties: string[];
}

/**
 * 解码 AMF3 数据的便捷函数
 */
export function DecodeAMF(buffer: Buffer): unknown {
  const decoder = new AMFDecoder(buffer);
  return decoder.Decode();
}

/**
 * 格式化 AMF 解码结果为可读字符串
 */
export function FormatAMFValue(value: unknown, indent: number = 0): string {
  const prefix = '  '.repeat(indent);

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (value instanceof Date) return `Date(${value.toISOString()})`;
  if (value instanceof Buffer) return `ByteArray(${value.length} bytes)`;
  if (value instanceof Map) {
    const entries = Array.from(value.entries());
    if (entries.length === 0) return 'Map{}';
    const items = entries.map(([k, v]) => `${prefix}  ${FormatAMFValue(k)}: ${FormatAMFValue(v, indent + 1)}`);
    return `Map{\n${items.join(',\n')}\n${prefix}}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    
    // 检查是否是Point对象数组
    const isPointArray = value.length > 0 && value.every((v) => 
      typeof v === 'object' && v !== null && 'x' in v && 'y' in v
    );
    
    if (isPointArray) {
      // Point数组用紧凑格式显示
      const points = value.map((v) => {
        const obj = v as Record<string, unknown>;
        return `Point(${obj.x}, ${obj.y})`;
      });
      return `[${points.join(', ')}]`;
    }
    
    // 简单数字数组用紧凑格式
    if (value.length <= 3 && value.every((v) => typeof v === 'number')) {
      return `[${value.join(', ')}]`;
    }
    
    // 其他数组展开显示
    const items = value.map((v) => `${prefix}  ${FormatAMFValue(v, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${prefix}]`;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    // 特殊处理 Point 对象 - 检查 x 和 y 是否为数字
    if ('x' in obj && 'y' in obj && keys.length <= 3) {
      const x = typeof obj.x === 'number' ? obj.x : obj.x;
      const y = typeof obj.y === 'number' ? obj.y : obj.y;
      return `Point(${x}, ${y})`;
    }

    const items = keys.map((k) => `${prefix}  ${k}: ${FormatAMFValue(obj[k], indent + 1)}`);
    return `{\n${items.join(',\n')}\n${prefix}}`;
  }

  return String(value);
}
