import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { PacketRegister, PacketSendEmailCode, PacketRequestRegister } from '../../Server/Packet/Send/Register';
import { AccountRepository } from '../../../DataBase';
import { Logger } from '../../../shared/utils';
import { IClientSession } from '../../Server/Packet/IHandler';

/**
 * 注册结果码
 */
export enum RegisterResult {
  SUCCESS = 0,
  SYSTEM_ERROR = 5001,
  ACCOUNT_EXISTS = 5002,
  INVALID_CODE = 5012,
}

/**
 * 验证码信息
 */
interface IEmailCodeInfo {
  code: string;
  codeRes: string;
  expireTime: number;
}

/**
 * 注册管理器
 * 负责处理账号注册相关的业务逻辑
 */
export class RegisterManager {
  private _packetBuilder: PacketBuilder;
  private _packetRegister: PacketRegister;
  private _packetSendEmailCode: PacketSendEmailCode;
  private _packetRequestRegister: PacketRequestRegister;
  private _accountRepo: AccountRepository;
  private _emailCodes: Map<string, IEmailCodeInfo> = new Map();
  private _cleanupTimer: NodeJS.Timeout | null = null;

  constructor(packetBuilder: PacketBuilder) {
    this._packetBuilder = packetBuilder;
    this._packetRegister = new PacketRegister(packetBuilder);
    this._packetSendEmailCode = new PacketSendEmailCode(packetBuilder);
    this._packetRequestRegister = new PacketRequestRegister(packetBuilder);
    this._accountRepo = new AccountRepository();
    
    // 定期清理过期验证码（每5分钟）
    this._cleanupTimer = setInterval(() => this.CleanupExpiredCodes(), 300000);
  }

  /**
   * 清理资源（停止定时器）
   */
  public Cleanup(): void {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
      Logger.Debug('[RegisterManager] 清理定时器已停止');
    }
  }

  /**
   * 处理发送邮箱验证码
   * @param session 客户端会话
   * @param email 邮箱地址
   */
  public async HandleSendEmailCode(session: IClientSession, email: string): Promise<void> {
    try {
      Logger.Info(`[RegisterManager] 发送验证码请求: email=${email}`);

      // 1. 检查邮箱是否已注册
      const existingAccount = await this._accountRepo.FindByEmail(email);
      if (existingAccount) {
        Logger.Warn(`[RegisterManager] 邮箱已被注册，拒绝发送验证码: ${email}`);
        const packet = this._packetSendEmailCode.Build('', RegisterResult.ACCOUNT_EXISTS);
        session.Socket.write(packet);
        return;
      }

      // 2. 检查是否已有未过期的验证码
      const existingCode = this._emailCodes.get(email);
      let code: string;
      let codeRes: string;

      if (existingCode && existingCode.expireTime > Date.now()) {
        // 使用现有的未过期验证码
        code = existingCode.code;
        codeRes = existingCode.codeRes;
        const remainingTime = Math.ceil((existingCode.expireTime - Date.now()) / 1000);
        Logger.Info(`[RegisterManager] 使用现有验证码: email=${email}, code=${code}, 剩余有效期=${remainingTime}秒`);
      } else {
        // 生成新的6位数验证码
        code = Math.floor(100000 + Math.random() * 900000).toString();
        codeRes = code.padEnd(32, ' ');
        
        // 保存验证码（5分钟有效期）
        this._emailCodes.set(email, {
          code,
          codeRes,
          expireTime: Date.now() + 300000 // 5分钟
        });

        Logger.Info(`[RegisterManager] 生成新验证码: email=${email}, code=${code}, 有效期=5分钟`);
      }

      // 3. 发送响应，result=0表示成功
      const packet = this._packetSendEmailCode.Build(codeRes, RegisterResult.SUCCESS);
      session.Socket.write(packet);

      Logger.Info(`[RegisterManager] ✅ 验证码已发送: code=${code}, result=0 (成功)`);
      Logger.Info(`[RegisterManager] 📧 验证码内容: ${code}`);
      Logger.Info(`[RegisterManager] 💡 客户端将显示: "发送验证码成功，请查看邮箱"`);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[RegisterManager] 发送验证码失败: ${email}`, error);
      
      const packet = this._packetSendEmailCode.Build('', RegisterResult.SYSTEM_ERROR);
      session.Socket.write(packet);
    }
  }

  /**
   * 通过系统消息推送验证码
   * @param session 客户端会话
   * @param code 验证码
   */
  private async SendVerificationCodeMessage(session: IClientSession, code: string): Promise<void> {
    try {
      // 动态导入 PacketSystemMessage 避免循环依赖
      const { PacketSystemMessage } = await import('../../Server/Packet/Send/System/PacketSystemMessage');
      
      const message = `您的验证码是：${code}（5分钟内有效）`;
      const packetMessage = new PacketSystemMessage(message);
      const buffer = this._packetBuilder.Build(
        packetMessage.getCmdId(),
        0, // userID
        0, // result
        packetMessage.serialize()
      );
      session.Socket.write(buffer);
      
      Logger.Info(`[RegisterManager] 验证码已通过系统消息推送: ${code}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegisterManager] 推送验证码消息失败', error);
    }
  }

  /**
   * 处理账号注册
   * @param session 客户端会话
   * @param password 密码
   * @param email 邮箱
   * @param emailCode 验证码
   * @param emailCodeRes 验证码响应
   */
  public async HandleRegister(
    session: IClientSession,
    password: string,
    email: string,
    emailCode: string,
    emailCodeRes: string
  ): Promise<void> {
    try {
      Logger.Info(`[RegisterManager] 注册请求: email=${email}, code=${emailCode}, codeRes=${emailCodeRes}`);

      // 1. 验证邮箱验证码
      const savedCode = this._emailCodes.get(email);
      if (!savedCode) {
        Logger.Warn(`[RegisterManager] 验证码不存在: ${email}`);
        const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
        session.Socket.write(packet);
        return;
      }

      if (savedCode.expireTime < Date.now()) {
        Logger.Warn(`[RegisterManager] 验证码已过期: ${email}`);
        this._emailCodes.delete(email);
        const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
        session.Socket.write(packet);
        return;
      }

      // 只验证用户输入的验证码，不验证 codeRes
      // 因为验证码通过错误码返回，客户端无法正确保存 codeRes
      if (savedCode.code !== emailCode) {
        Logger.Warn(`[RegisterManager] 验证码错误: ${email}, expected=${savedCode.code}, got=${emailCode}`);
        const packet = this._packetRegister.Build(0, RegisterResult.INVALID_CODE);
        session.Socket.write(packet);
        return;
      }

      // 2. 检查邮箱是否已注册
      const existingAccount = await this._accountRepo.FindByEmail(email);
      if (existingAccount) {
        Logger.Warn(`[RegisterManager] 邮箱已被注册: ${email}`);
        const packet = this._packetRegister.Build(0, RegisterResult.ACCOUNT_EXISTS);
        session.Socket.write(packet);
        return;
      }

      // 3. 对密码进行 MD5 hash（客户端登录时会发送 MD5，所以注册时也要保存 MD5）
      const crypto = require('crypto');
      const passwordHash = crypto.createHash('md5').update(password).digest('hex');
      
      Logger.Debug(`[RegisterManager] 密码 hash: 明文长度=${password.length}, MD5=${passwordHash}`);

      // 4. 创建账号
      const userID = await this._accountRepo.CreateAccount(email, passwordHash);
      
      // 5. 清除验证码
      this._emailCodes.delete(email);

      Logger.Info(`[RegisterManager] 注册成功: email=${email}, userID=${userID}`);
      
      // 5. 返回成功响应（userID 作为响应）
      const packet = this._packetRegister.Build(userID, RegisterResult.SUCCESS);
      session.Socket.write(packet);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[RegisterManager] 注册失败: ${email}`, error);
      
      const packet = this._packetRegister.Build(0, RegisterResult.SYSTEM_ERROR);
      session.Socket.write(packet);
    }
  }

  /**
   * 处理请求注册（预留接口）
   * @param session 客户端会话
   */
  public async HandleRequestRegister(session: IClientSession): Promise<void> {
    try {
      Logger.Info('[RegisterManager] 请求注册');
      const packet = this._packetRequestRegister.Build();
      session.Socket.write(packet);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegisterManager] 请求注册失败', error);
      
      const packet = this._packetRequestRegister.Build(RegisterResult.SYSTEM_ERROR);
      session.Socket.write(packet);
    }
  }

  /**
   * 清理过期的验证码
   */
  private CleanupExpiredCodes(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [email, data] of this._emailCodes.entries()) {
      if (data.expireTime < now) {
        this._emailCodes.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      Logger.Debug(`[RegisterManager] 清理过期验证码: ${cleanedCount} 个`);
    }
  }
}
