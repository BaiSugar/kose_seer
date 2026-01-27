/**
 * Gateway会话管理器
 */
import { Socket } from 'net';
import { PacketParser } from '../shared/protocol';
import { Logger } from '../shared/utils';

/**
 * Gateway会话信息
 */
export interface IGatewaySession {
  id: string;
  socket: Socket;
  address: string;
  parser: PacketParser;
  serverType: 'login' | 'game';
  policyHandled: boolean;
  userId?: number;
  createdAt: number;
}

/**
 * Gateway会话管理器
 */
export class GatewaySessionManager {
  private _sessions: Map<string, IGatewaySession> = new Map();
  private _sessionIdCounter: number = 0;

  /**
   * 创建会话
   */
  public CreateSession(socket: Socket, serverType: 'login' | 'game'): IGatewaySession {
    const address = `${socket.remoteAddress}:${socket.remotePort}`;
    const id = `${serverType}_${++this._sessionIdCounter}_${Date.now()}`;

    const session: IGatewaySession = {
      id,
      socket,
      address,
      parser: new PacketParser(),
      serverType,
      policyHandled: false,
      createdAt: Date.now(),
    };

    this._sessions.set(id, session);
    Logger.Debug(`[GatewaySessionManager] 创建会话: ${id} (${address})`);

    return session;
  }

  /**
   * 移除会话
   */
  public RemoveSession(id: string): void {
    const session = this._sessions.get(id);
    if (session) {
      this._sessions.delete(id);
      Logger.Debug(`[GatewaySessionManager] 移除会话: ${id}`);
    }
  }

  /**
   * 获取会话
   */
  public GetSession(id: string): IGatewaySession | undefined {
    return this._sessions.get(id);
  }

  /**
   * 根据用户ID查找会话
   */
  public FindSessionByUserId(userId: number): IGatewaySession | undefined {
    for (const session of this._sessions.values()) {
      if (session.userId === userId) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * 获取所有会话
   */
  public GetAllSessions(): IGatewaySession[] {
    return Array.from(this._sessions.values());
  }

  /**
   * 获取会话数量
   */
  public GetSessionCount(): number {
    return this._sessions.size;
  }

  /**
   * 清理超时会话
   */
  public CleanupTimeoutSessions(timeoutMs: number = 300000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [id, session] of this._sessions) {
      if (now - session.createdAt > timeoutMs && !session.userId) {
        toRemove.push(id);
      }
    }

    for (const id of toRemove) {
      const session = this._sessions.get(id);
      if (session) {
        session.socket.destroy();
        this._sessions.delete(id);
        Logger.Info(`[GatewaySessionManager] 清理超时会话: ${id}`);
      }
    }
  }
}
