import { existsSync, mkdirSync, appendFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ICapturedPacket } from './ProxyServer';

/**
 * 数据包日志记录器
 * 将捕获的数据包写入日志文件
 */
export class PacketLogger {
  private _logDir: string;
  private _currentLogFile: string = '';
  private _enabled: boolean = true;

  constructor(logDir?: string) {
    this._logDir = logDir || join(process.cwd(), 'logs', 'proxy');
    this.EnsureLogDir();
    this.CreateNewLogFile();
  }

  /**
   * 确保日志目录存在
   */
  private EnsureLogDir(): void {
    if (!existsSync(this._logDir)) {
      mkdirSync(this._logDir, { recursive: true });
    }
  }

  /**
   * 创建新的日志文件
   */
  private CreateNewLogFile(): void {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];  // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');  // HH-MM-SS
    const fileName = `proxy_${dateStr}_${timeStr}.log`;
    this._currentLogFile = join(this._logDir, fileName);

    // 写入文件头
    const header = [
      '================================================================================',
      `KOSE Proxy Packet Log`,
      `Started: ${now.toLocaleString()}`,
      '================================================================================',
      '',
    ].join('\n');

    writeFileSync(this._currentLogFile, header, 'utf8');
  }

  /**
   * 记录数据包
   */
  public LogPacket(packet: ICapturedPacket): void {
    if (!this._enabled) return;

    const time = new Date(packet.timestamp);
    const timeStr = time.toLocaleTimeString() + '.' + String(time.getMilliseconds()).padStart(3, '0');
    const arrow = packet.direction === 'C2S' ? '>>>' : '<<<';
    const directionText = packet.direction === 'C2S' ? 'Client → Server' : 'Server → Client';

    const lines: string[] = [
      '--------------------------------------------------------------------------------',
      `[#${packet.id}] ${timeStr} ${arrow} ${directionText}`,
      `CMD: ${packet.cmdID} (${packet.cmdName}) ${packet.cmdDesc ? `[${packet.cmdDesc}]` : ''}`,
      `UserID: ${packet.userID} | Result: ${packet.result} | BodyLen: ${packet.bodyLength}`,
      `Format: ${packet.formatString}`,
    ];

    // 字段信息
    if (packet.fields.length > 0) {
      lines.push('Fields:');
      for (const field of packet.fields) {
        const desc = field.desc ? ` // ${field.desc}` : '';
        lines.push(`  ${field.name} = ${field.value}${desc}`);
      }
    }

    // Body Hex
    if (packet.bodyHex) {
      lines.push(`Body (Hex): ${packet.bodyHex}`);
    }

    // 原始数据
    lines.push(`Raw (Hex): ${packet.rawHex}`);
    lines.push('');

    const logContent = lines.join('\n');
    appendFileSync(this._currentLogFile, logContent, 'utf8');
  }

  /**
   * 写入分隔线（用于会话开始/结束）
   */
  public LogSessionStart(clientAddr: string, remoteAddr: string): void {
    if (!this._enabled) return;

    const now = new Date();
    const lines = [
      '',
      '================================================================================',
      `SESSION START: ${now.toLocaleString()}`,
      `Client: ${clientAddr}`,
      `Remote: ${remoteAddr}`,
      '================================================================================',
      '',
    ].join('\n');

    appendFileSync(this._currentLogFile, lines, 'utf8');
  }

  /**
   * 写入会话结束
   */
  public LogSessionEnd(clientAddr: string): void {
    if (!this._enabled) return;

    const now = new Date();
    const lines = [
      '',
      `================================================================================`,
      `SESSION END: ${now.toLocaleString()}`,
      `Client: ${clientAddr}`,
      `================================================================================`,
      '',
    ].join('\n');

    appendFileSync(this._currentLogFile, lines, 'utf8');
  }

  /**
   * 启用/禁用日志
   */
  public SetEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  /**
   * 获取当前日志文件路径
   */
  public get CurrentLogFile(): string {
    return this._currentLogFile;
  }

  /**
   * 获取日志目录
   */
  public get LogDir(): string {
    return this._logDir;
  }

  /**
   * 是否启用
   */
  public get IsEnabled(): boolean {
    return this._enabled;
  }
}
