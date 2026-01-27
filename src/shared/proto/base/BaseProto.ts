import { BufferWriter } from '../../utils';

/**
 * Proto基类
 * 所有协议消息都继承此类
 */
export abstract class BaseProto {
  /**
   * 命令ID（通过构造函数传入）
   */
  protected readonly cmdId: number;

  /**
   * 结果码（默认0=成功）
   */
  protected result: number = 0;

  /**
   * 构造函数
   * @param cmdId 命令ID（子类通过super(cmdId)传入）
   */
  constructor(cmdId: number) {
    this.cmdId = cmdId;
  }

  /**
   * 获取命令ID
   */
  public getCmdId(): number {
    return this.cmdId;
  }

  /**
   * 获取结果码
   */
  public getResult(): number {
    return this.result;
  }

  /**
   * 设置结果码
   */
  public setResult(result: number): this {
    this.result = result;
    return this;
  }

  /**
   * 序列化为Buffer
   */
  abstract serialize(): Buffer;

  /**
   * 辅助方法：构建固定长度的字符串Buffer
   */
  protected buildString(str: string, length: number): Buffer {
    const buffer = Buffer.alloc(length);
    if (str) {
      Buffer.from(str, 'utf8').copy(buffer, 0, 0, Math.min(Buffer.byteLength(str, 'utf8'), length));
    }
    return buffer;
  }

  /**
   * 辅助方法：从Buffer读取字符串
   */
  protected readString(buffer: Buffer): string {
    return buffer.toString('utf8').replace(/\0/g, '').trim();
  }

  /**
   * 辅助方法：构建固定长度的Buffer
   */
  protected buildBuffer(data: string | Buffer | undefined, length: number): Buffer {
    const buffer = Buffer.alloc(length);
    if (data) {
      const source = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      source.copy(buffer, 0, 0, Math.min(source.length, length));
    }
    return buffer;
  }
}
