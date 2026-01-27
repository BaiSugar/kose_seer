import { HeadInfo } from './HeadInfo';
import { GetCommandName } from './CommandID';
import { CmdMeta } from './CommandMeta';
import { Logger } from '../utils';

/**
 * 数据包解析器
 */
export class PacketParser {
  private _buffer: Buffer = Buffer.alloc(0);
  private _version: string = '1';
  private _headLength: number;

  constructor(version: string = '1') {
    this._version = version;
    this._headLength = HeadInfo.GetHeadLength(version);
  }

  /**
   * 追加数据
   */
  public Append(data: Buffer): void {
    this._buffer = Buffer.concat([this._buffer, data]);
    Logger.Debug(`[收包] 接收 ${data.length} 字节, 缓冲区累计 ${this._buffer.length} 字节`);
  }

  /**
   * 尝试解析一个完整的数据包
   */
  public TryParse(): { head: HeadInfo; body: Buffer } | null {
    if (this._buffer.length < 4)
      return null;

    const packetLength = this._buffer.readUInt32BE(0);

    // 检查包长度是否合法
    if (packetLength < this._headLength || packetLength > 8388608) {
      Logger.Error(`[收包] 非法包长度: ${packetLength}, 原始数据: ${this._buffer.subarray(0, Math.min(32, this._buffer.length)).toString('hex')}`);
      this._buffer = Buffer.alloc(0);
      return null;
    }

    // 数据不完整
    if (this._buffer.length < packetLength)
      return null;

    // 解析包头
    const head = HeadInfo.Parse(this._buffer, this._version);
    if (!head)
      return null;

    // 提取包体
    const body = this._buffer.subarray(this._headLength, packetLength);

    // 打印解析日志 - 使用元数据智能解析
    const cmdName = GetCommandName(head.CmdID);
    const meta = CmdMeta.Get(head.CmdID);
    const desc = meta?.desc ? ` [${meta.desc}]` : '';

    Logger.Info(`[收包] ${cmdName}(${head.CmdID})${desc} | UserID=${head.UserID} | Seq=${head.Result} | BodyLen=${body.length}`);

    // 使用元数据智能解析Body
    if (body.length > 0) {
      const bodyStr = CmdMeta.ParseBody(head.CmdID, body, true);
      Logger.Debug(`[收包] Body: ${bodyStr}`);
    }

    // 移除已解析的数据
    this._buffer = this._buffer.subarray(packetLength);

    return { head, body };
  }

  /**
   * 清空缓冲区
   */
  public Clear(): void {
    this._buffer = Buffer.alloc(0);
  }
}
