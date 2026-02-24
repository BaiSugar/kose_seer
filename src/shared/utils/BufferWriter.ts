/**
 * Buffer 写入器 - 简化二进制数据写入
 */
export class BufferWriter {
  private _buffer: Buffer;
  private _offset: number = 0;

  constructor(size: number = 1024) {
    this._buffer = Buffer.alloc(size);
  }

  /**
   * 写入无符号32位整数 (大端)
   */
  public WriteUInt32(value: number): this {
    this.EnsureCapacity(4);
    this._buffer.writeUInt32BE(value, this._offset);
    this._offset += 4;
    return this;
  }

  /**
   * 写入有符号32位整数 (大端)
   */
  public WriteInt32(value: number): this {
    this.EnsureCapacity(4);
    this._buffer.writeInt32BE(value, this._offset);
    this._offset += 4;
    return this;
  }

  /**
   * 写入无符号16位整数 (大端)
   */
  public WriteUInt16(value: number): this {
    this.EnsureCapacity(2);
    this._buffer.writeUInt16BE(value, this._offset);
    this._offset += 2;
    return this;
  }

  /**
   * 写入无符号8位整数
   */
  public WriteUInt8(value: number): this {
    this.EnsureCapacity(1);
    this._buffer.writeUInt8(value, this._offset);
    this._offset += 1;
    return this;
  }

  /**
   * 写入布尔值 (1 字节)
   */
  public WriteBoolean(value: boolean): this {
    return this.WriteUInt8(value ? 1 : 0);
  }

  /**
   * 写入有符号8位整数
   */
  public WriteInt8(value: number): this {
    this.EnsureCapacity(1);
    this._buffer.writeInt8(value, this._offset);
    this._offset += 1;
    return this;
  }

  /**
   * 写入定长字符串 (不足补0)
   */
  public WriteString(value: string, length: number): this {
    this.EnsureCapacity(length);
    const strBuffer = Buffer.from(value, 'utf8');
    strBuffer.copy(this._buffer, this._offset, 0, Math.min(strBuffer.length, length));
    this._offset += length;
    return this;
  }

  /**
   * 写入变长字符串 (前置长度)
   */
  public WriteVarString(value: string): this {
    const strBuffer = Buffer.from(value, 'utf8');
    this.WriteUInt16(strBuffer.length);
    this.EnsureCapacity(strBuffer.length);
    strBuffer.copy(this._buffer, this._offset);
    this._offset += strBuffer.length;
    return this;
  }

  /**
   * 写入 UTF 字符串 (ActionScript 格式：前置 uint16 长度)
   */
  public WriteUTF(value: string): this {
    return this.WriteVarString(value);
  }

  /**
   * 写入 32 位浮点数 (大端)
   */
  public WriteFloat(value: number): this {
    this.EnsureCapacity(4);
    this._buffer.writeFloatBE(value, this._offset);
    this._offset += 4;
    return this;
  }

  /**
   * 写入原始字节
   */
  public WriteBytes(data: Buffer): this {
    this.EnsureCapacity(data.length);
    data.copy(this._buffer, this._offset);
    this._offset += data.length;
    return this;
  }

  /**
   * 获取已写入的数据
   */
  public ToBuffer(): Buffer {
    return this._buffer.subarray(0, this._offset);
  }

  /**
   * 获取当前偏移量
   */
  public get Offset(): number {
    return this._offset;
  }

  /**
   * 确保容量足够
   */
  private EnsureCapacity(additionalBytes: number): void {
    const required = this._offset + additionalBytes;
    if (required > this._buffer.length) {
      const newSize = Math.max(this._buffer.length * 2, required);
      const newBuffer = Buffer.alloc(newSize);
      this._buffer.copy(newBuffer);
      this._buffer = newBuffer;
    }
  }
}
