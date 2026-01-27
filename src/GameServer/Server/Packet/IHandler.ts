import { Socket } from 'net';
import { HeadInfo } from '../../../shared/protocol';
import { CryptoHandler } from '../../../shared/crypto';

// 前向声明，避免循环依赖
export type PlayerInstance = import('../../Game/Player/PlayerInstance').PlayerInstance;

/**
 * 客户端会话接口
 */
export interface IClientSession {
  Socket: Socket;
  UserID: number;
  Address: string;
  Player?: PlayerInstance;  // 玩家实例（登录后设置）
  Crypto?: CryptoHandler;    // 加密处理器
  EncryptionEnabled?: boolean; // 加密是否已启用
}

/**
 * 命令处理器接口
 */
export interface IHandler {
  /**
   * 处理命令 (支持同步和异步)
   */
  Handle(session: IClientSession, head: HeadInfo, body: Buffer): void | Promise<void>;
}
