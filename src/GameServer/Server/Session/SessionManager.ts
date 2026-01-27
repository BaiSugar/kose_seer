import { Socket } from 'net';
import { PacketParser } from '../../../shared/protocol';
import { IClientSession } from '../Packet/IHandler';
import { Logger } from '../../../shared/utils';
import { CryptoHandler } from '../../../shared/crypto';

/**
 * 内部会话接口，包含解析器
 */
export interface IInternalSession extends IClientSession {
  Parser: PacketParser;
  PolicyHandled: boolean;
}

/**
 * 客户端会话管理器
 */
export class SessionManager {
  private _sessions: Map<string, IInternalSession> = new Map();
  private _protocolVersion: string;

  constructor(protocolVersion: string = '1') {
    this._protocolVersion = protocolVersion;
  }

  /**
   * 创建新会话
   */
  public CreateSession(socket: Socket): IInternalSession {
    const address = `${socket.remoteAddress}:${socket.remotePort}`;

    const session: IInternalSession = {
      Socket: socket,
      Parser: new PacketParser(this._protocolVersion),
      UserID: 0,
      Address: address,
      PolicyHandled: false,
      Crypto: new CryptoHandler(),
      EncryptionEnabled: false,
    };

    this._sessions.set(address, session);
    Logger.Info(`客户端接入: ${address}`);

    return session;
  }

  /**
   * 移除会话
   */
  public RemoveSession(address: string): void {
    this._sessions.delete(address);
    Logger.Info(`客户端断开: ${address}`);
  }

  /**
   * 获取会话
   */
  public GetSession(address: string): IInternalSession | undefined {
    return this._sessions.get(address);
  }

  /**
   * 获取所有会话
   */
  public GetAllSessions(): IInternalSession[] {
    return Array.from(this._sessions.values());
  }

  /**
   * 获取在线人数
   */
  public get OnlineCount(): number {
    return this._sessions.size;
  }
}
