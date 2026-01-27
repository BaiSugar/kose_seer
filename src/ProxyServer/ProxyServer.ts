import { createServer, Server } from 'net';
import { createConnection } from 'net';
import { Logger } from '../shared/utils';
import { HeadInfo, GetCommandName, CmdMeta, CommandID } from '../shared/protocol';
import { WebServer } from './WebServer';
import { PacketLogger } from './PacketLogger';
import { Config } from '../shared/config/ServerConfig';

/**
 * 捕获的数据包信息
 */
export interface ICapturedPacket {
  id: number;
  timestamp: number;
  direction: 'C2S' | 'S2C';  // Client to Server / Server to Client
  cmdID: number;
  cmdName: string;
  cmdDesc: string;
  userID: number;
  result: number;
  bodyLength: number;
  bodyHex: string;
  fields: { name: string; value: string; desc: string }[];
  rawHex: string;
  formatString: string;  // 字段格式字符串，如 "maxOnlineID(4) + isVIP(4) + ..."
}

/**
 * 代理服务器
 * 用于监测客户端与远程服务器之间的通信
 */
export class ProxyServer {
  private _server: Server;
  private _webServer: WebServer;
  private _packetLogger: PacketLogger;
  private _running: boolean = false;
  private _packetID: number = 0;
  private _capturedPackets: ICapturedPacket[] = [];
  private _version: string = '1';
  private _headLength: number = 17;

  constructor() {
    this._server = createServer();
    this._webServer = new WebServer(this, Config.Proxy.webPort);
    this._packetLogger = new PacketLogger();
    this.SetupConnectionHandler();
    
    Logger.Info('[ProxyServer] 使用 CommandMetaRegistry 进行协议解析');
  }

  /**
   * 设置连接处理
   */
  private SetupConnectionHandler(): void {
    this._server.on('connection', (clientSocket) => {
      const clientAddr = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;
      Logger.Info(`[Proxy] 客户端连接: ${clientAddr}`);

      let clientBuffer: Buffer = Buffer.alloc(0);
      let serverBuffer: Buffer = Buffer.alloc(0);
      let remoteSocket: ReturnType<typeof createConnection> | null = null;
      let remoteConnected = false;
      let pendingData: Buffer[] = [];
      let isGameServer = false;  // 是否连接到游戏服务器

      /**
       * 根据第一个数据包决定连接到哪个服务器
       */
      const connectToRemote = (firstPacket: Buffer) => {
        // 检查是否是策略文件请求
        const dataStr = firstPacket.toString('utf8');
        if (dataStr.startsWith('<policy-file-request/>')) {
          // 策略文件请求，默认连接登录服务器
          isGameServer = false;
        } else if (firstPacket.length >= 9) {
          // 解析命令ID
          const cmdID = firstPacket.readUInt32BE(5);
          // LOGIN_IN (1001) 是游戏登录，连接游戏服务器
          if (cmdID === CommandID.LOGIN_IN) {
            isGameServer = true;
            Logger.Info(`[Proxy] 检测到 LOGIN_IN 请求，连接游戏服务器`);
          }
        }

        const host = isGameServer ? Config.Proxy.gameServer.host : Config.Proxy.loginServer.host;
        const port = isGameServer ? Config.Proxy.gameServer.port : Config.Proxy.loginServer.port;

        Logger.Info(`[Proxy] 连接到${isGameServer ? '游戏' : '登录'}服务器: ${host}:${port}`);

        remoteSocket = createConnection({ host, port });

        remoteSocket.on('connect', () => {
          Logger.Info(`[Proxy] 已连接远程服务器: ${host}:${port}`);
          remoteConnected = true;
          this._packetLogger.LogSessionStart(clientAddr, `${host}:${port}`);

          // 发送缓存的数据
          for (const data of pendingData) {
            Logger.Info(`[Proxy] 发送缓存数据 ${data.length} 字节`);
            remoteSocket!.write(data);
          }
          pendingData = [];
        });

        // 服务器 -> 客户端
        remoteSocket.on('data', (data) => {
          Logger.Info(`[Proxy] S2C 收到 ${data.length} 字节: ${data.toString('hex').substring(0, 100)}`);
          // 只在登录服务器连接时修改服务器列表
          const modifiedData = isGameServer ? data : this.ModifyServerListResponse(data);
          serverBuffer = this.ParseAndCapture(serverBuffer, modifiedData, 'S2C');
          clientSocket.write(modifiedData);
        });

        remoteSocket.on('error', (err) => {
          Logger.Error(`[Proxy] 远程服务器错误`, err);
          clientSocket.destroy();
        });

        remoteSocket.on('close', (hadError) => {
          Logger.Info(`[Proxy] 远程服务器断开 (hadError=${hadError})`);
          clientSocket.destroy();
        });

        remoteSocket.on('end', () => {
          Logger.Info(`[Proxy] 远程服务器发送 FIN (正常关闭)`);
        });
      };

      // 客户端 -> 服务器
      clientSocket.on('data', (data) => {
        Logger.Info(`[Proxy] C2S 收到 ${data.length} 字节: ${data.toString('hex').substring(0, 100)}`);

        // 第一次收到数据时，根据数据包类型决定连接哪个服务器
        if (!remoteSocket) {
          pendingData.push(data);
          connectToRemote(data);
          return;
        }

        // 如果远程连接还没建立，缓存数据
        if (!remoteConnected) {
          Logger.Info(`[Proxy] 远程连接未建立，缓存数据`);
          pendingData.push(data);
          return;
        }

        // 解析并记录数据包
        clientBuffer = this.ParseAndCapture(clientBuffer, data, 'C2S');
        // 转发到远程服务器
        remoteSocket.write(data);
      });

      // 错误处理
      clientSocket.on('error', (err) => {
        Logger.Error(`[Proxy] 客户端错误: ${clientAddr}`, err);
        remoteSocket?.destroy();
      });

      // 关闭处理
      clientSocket.on('close', (hadError) => {
        Logger.Info(`[Proxy] 客户端断开: ${clientAddr} (hadError=${hadError})`);
        this._packetLogger.LogSessionEnd(clientAddr);
        remoteSocket?.destroy();
      });
    });
  }

  /**
   * 修改服务器列表响应中的IP/端口
   * 将远程服务器IP替换为代理服务器IP
   */
  private ModifyServerListResponse(data: Buffer): Buffer {
    // 检查数据长度是否足够解析包头
    if (data.length < this._headLength) {
      return data;
    }

    const packetLength = data.readUInt32BE(0);
    if (packetLength < this._headLength || packetLength > data.length) {
      return data;
    }

    // 解析命令ID (包头结构: Length(4) + Version(1) + CmdID(4) + UserID(4) + Result(4) = 17字节)
    const cmdID = data.readUInt32BE(5);

    // 只处理 COMMEND_ONLINE (105) 和 RANGE_ONLINE (106)
    if (cmdID !== CommandID.COMMEND_ONLINE && cmdID !== CommandID.RANGE_ONLINE) {
      return data;
    }

    Logger.Info(`[Proxy] 检测到服务器列表响应 CMD=${cmdID}，准备修改IP/端口`);

    // 复制数据以便修改
    const modified = Buffer.from(data);

    // 服务器信息结构: onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4) = 30字节
    // COMMEND_ONLINE 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
    // RANGE_ONLINE 响应: onlineCnt(4) + servers...

    let offset = this._headLength;  // 跳过包头

    if (cmdID === CommandID.COMMEND_ONLINE) {
      // 跳过 maxOnlineID(4) + isVIP(4) + onlineCnt(4)
      offset += 12;
    } else {
      // RANGE_ONLINE: 跳过 onlineCnt(4)
      offset += 4;
    }

    // 获取服务器数量
    const serverCountOffset = cmdID === CommandID.COMMEND_ONLINE
      ? this._headLength + 8  // maxOnlineID(4) + isVIP(4) 之后
      : this._headLength;     // 包头之后

    if (serverCountOffset + 4 > data.length) {
      return data;
    }

    const serverCount = data.readUInt32BE(serverCountOffset);
    Logger.Info(`[Proxy] 服务器数量: ${serverCount}`);

    // 代理服务器IP (填充到16字节)
    const proxyIP = Config.Proxy.listenHost;
    const proxyIPBuffer = Buffer.alloc(16, 0);
    proxyIPBuffer.write(proxyIP, 'utf8');

    // 代理服务器端口
    const proxyPort = Config.Proxy.listenPort;

    // 遍历每个服务器信息并替换IP/端口
    for (let i = 0; i < serverCount && offset + 30 <= modified.length; i++) {
      // 服务器信息: onlineID(4) + userCnt(4) + ip(16) + port(2) + friends(4)
      const ipOffset = offset + 8;   // 跳过 onlineID + userCnt
      const portOffset = offset + 24; // 跳过 onlineID + userCnt + ip

      // 读取原始IP和端口用于日志
      const originalIP = data.subarray(ipOffset, ipOffset + 16).toString('utf8').replace(/\0/g, '');
      const originalPort = data.readUInt16BE(portOffset);

      Logger.Info(`[Proxy] 服务器[${i}] 原始: ${originalIP}:${originalPort} -> 替换为: ${proxyIP}:${proxyPort}`);

      // 替换IP
      proxyIPBuffer.copy(modified, ipOffset);
      // 替换端口
      modified.writeUInt16BE(proxyPort, portOffset);

      offset += 30;  // 移动到下一个服务器信息
    }

    return modified;
  }

  /**
   * 解析并捕获数据包
   */
  private ParseAndCapture(buffer: Buffer, data: Buffer, direction: 'C2S' | 'S2C'): Buffer {
    buffer = Buffer.concat([buffer, data]);

    while (buffer.length >= 4) {
      const packetLength = buffer.readUInt32BE(0);

      // 检查包长度是否合法
      if (packetLength < this._headLength || packetLength > 8388608) {
        // 可能是策略文件请求
        if (buffer.toString('utf8', 0, Math.min(23, buffer.length)).startsWith('<policy-file-request/>')) {
          const endIndex = buffer.indexOf(0);
          if (endIndex > 0) {
            buffer = buffer.subarray(endIndex + 1);
            continue;
          }
        }
        // 跳过无效数据
        buffer = Buffer.alloc(0);
        break;
      }

      // 数据不完整
      if (buffer.length < packetLength) break;

      // 提取完整数据包
      const packet = buffer.subarray(0, packetLength);
      buffer = buffer.subarray(packetLength);

      // 解析数据包
      this.CapturePacket(packet, direction);
    }

    return buffer;
  }

  /**
   * 捕获单个数据包
   */
  private CapturePacket(packet: Buffer, direction: 'C2S' | 'S2C'): void {
    const head = HeadInfo.Parse(packet, this._version);
    if (!head) return;

    const body = packet.subarray(this._headLength);
    const cmdName = GetCommandName(head.CmdID);
    const meta = CmdMeta.Get(head.CmdID);
    
    // 使用 CommandMetaRegistry 解析字段
    const isRequest = direction === 'C2S';
    const bodyStr = CmdMeta.ParseBody(head.CmdID, body, isRequest);
    const formatString = CmdMeta.GetFormatString(head.CmdID, isRequest);
    
    // 将解析后的字符串转换为字段数组（用于兼容现有接口）
    const fields = this.ParseBodyStringToFields(bodyStr);

    const captured: ICapturedPacket = {
      id: ++this._packetID,
      timestamp: Date.now(),
      direction,
      cmdID: head.CmdID,
      cmdName,
      cmdDesc: meta?.desc || '',
      userID: head.UserID,
      result: head.Result,
      bodyLength: body.length,
      bodyHex: body.toString('hex'),
      fields,
      rawHex: packet.toString('hex'),
      formatString
    };

    this._capturedPackets.push(captured);

    // 限制存储数量
    if (this._capturedPackets.length > 10000) {
      this._capturedPackets.shift();
    }

    // 写入日志文件
    this._packetLogger.LogPacket(captured);

    // 通知 WebServer 推送更新
    this._webServer.BroadcastPacket(captured);

    // 日志输出
    const arrow = direction === 'C2S' ? '>>>' : '<<<';
    Logger.Info(`[Proxy] ${arrow} ${cmdName}(${head.CmdID}) ${meta?.desc || ''} | UserID=${head.UserID} | BodyLen=${body.length}`);

    // 输出解析后的字段
    if (bodyStr && bodyStr !== '(空)') {
      Logger.Info(`[Proxy]     字段: ${bodyStr}`);
      // 如果是PEOPLE_WALK，额外输出原始body hex用于调试
      if (head.CmdID === 2101) {
        Logger.Info(`[Proxy]     原始Body Hex: ${body.toString('hex')}`);
      }
    }
    
    // 输出格式字符串
    if (formatString && formatString !== '(未定义)' && formatString !== '(空)') {
      Logger.Info(`[Proxy]     格式: ${formatString}`);
    }
  }

  /**
   * 将解析后的字符串转换为字段数组
   * 例如: "field1=123, field2="abc"" => [{name: "field1", value: "123", desc: ""}, ...]
   */
  private ParseBodyStringToFields(bodyStr: string): { name: string; value: string; desc: string }[] {
    if (!bodyStr || bodyStr === '(空)' || bodyStr === '(未定义)') {
      return [];
    }

    const fields: { name: string; value: string; desc: string }[] = [];
    
    // 改进的字段解析：处理包含逗号的值（如数组、对象等）
    let bracketDepth = 0;
    let inQuotes = false;
    let fieldStart = 0;
    
    for (let i = 0; i < bodyStr.length; i++) {
      const char = bodyStr[i];
      
      // 跟踪引号状态
      if (char === '"' && (i === 0 || bodyStr[i - 1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      
      // 跟踪括号深度（用于数组和对象）
      if (!inQuotes) {
        if (char === '[' || char === '{') {
          bracketDepth++;
        } else if (char === ']' || char === '}') {
          bracketDepth--;
        }
      }
      
      // 只在不在引号内、括号深度为0时，逗号才是分隔符
      if (char === ',' && !inQuotes && bracketDepth === 0) {
        const part = bodyStr.substring(fieldStart, i).trim();
        if (part) {
          const eqIndex = part.indexOf('=');
          if (eqIndex > 0) {
            const name = part.substring(0, eqIndex);
            const value = part.substring(eqIndex + 1);
            fields.push({ name, value, desc: '' });
          }
        }
        fieldStart = i + 1;
      }
    }
    
    // 处理最后一个字段
    const lastPart = bodyStr.substring(fieldStart).trim();
    if (lastPart) {
      const eqIndex = lastPart.indexOf('=');
      if (eqIndex > 0) {
        const name = lastPart.substring(0, eqIndex);
        const value = lastPart.substring(eqIndex + 1);
        fields.push({ name, value, desc: '' });
      }
    }

    return fields;
  }



  /**
   * 获取所有捕获的数据包
   */
  public GetCapturedPackets(): ICapturedPacket[] {
    return this._capturedPackets;
  }

  /**
   * 清空捕获的数据包
   */
  public ClearPackets(): void {
    this._capturedPackets = [];
    this._packetID = 0;
  }

  /**
   * 启动服务器
   */
  public Start(): void {
    if (this._running) return;

    this._server.listen(Config.Proxy.listenPort, Config.Proxy.listenHost, () => {
      this._running = true;
      Logger.Info(`[ProxyServer] 代理启动 ${Config.Proxy.listenHost}:${Config.Proxy.listenPort}`);
      Logger.Info(`[ProxyServer] 登录服务器: ${Config.Proxy.loginServer.host}:${Config.Proxy.loginServer.port}`);
      Logger.Info(`[ProxyServer] 游戏服务器: ${Config.Proxy.gameServer.host}:${Config.Proxy.gameServer.port}`);
      Logger.Info(`[ProxyServer] 日志文件: ${this._packetLogger.CurrentLogFile}`);
    });

    this._webServer.Start();
  }

  /**
   * 停止服务器
   */
  public Stop(): void {
    if (!this._running) return;

    this._server.close(() => {
      this._running = false;
      Logger.Info('[ProxyServer] 已停止');
    });

    this._webServer.Stop();
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
