// 协议包头信息
export interface IHeadInfo {
  Length: number;     // 整包长度
  Version: string;    // 版本号
  CmdID: number;      // 命令ID
  UserID: number;     // 用户ID
  Result: number;     // 序列号/结果码
  Error?: number;     // 错误码 (仅版本2)
}

export class HeadInfo {
  private _length: number = 0;
  private _version: string = '1';
  private _cmdID: number = 0;
  private _userID: number = 0;
  private _result: number = 0;
  private _error: number = 0;

  public get Length(): number { return this._length; }
  public get Version(): string { return this._version; }
  public get CmdID(): number { return this._cmdID; }
  public get UserID(): number { return this._userID; }
  public get Result(): number { return this._result; }
  public get Error(): number { return this._error; }

  public static readonly HEAD_LENGTH_V1 = 17;  // 版本1头部长度
  public static readonly HEAD_LENGTH_V2 = 21;  // 版本2头部长度

  public static GetHeadLength(version: string): number {
    if (version === '1') return HeadInfo.HEAD_LENGTH_V1;
    if (version === '2') return HeadInfo.HEAD_LENGTH_V2;
    throw new Error('未知的协议版本');
  }

  public static Parse(buffer: Buffer, version: string = '1'): HeadInfo | null {
    const headLength = HeadInfo.GetHeadLength(version);
    if (buffer.length < headLength)
      return null;

    const head = new HeadInfo();
    let offset = 0;

    head._length = buffer.readUInt32BE(offset);
    offset += 4;

    head._version = buffer.toString('utf8', offset, offset + 1);
    offset += 1;

    head._cmdID = buffer.readUInt32BE(offset);
    offset += 4;

    head._userID = buffer.readUInt32BE(offset);
    offset += 4;

    head._result = buffer.readInt32BE(offset);
    offset += 4;

    if (version === '2') {
      head._error = buffer.readUInt32BE(offset);
    }

    return head;
  }
}
