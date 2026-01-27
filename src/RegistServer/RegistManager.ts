/**
 * 注册管理器
 * 处理用户注册相关业务逻辑
 */
import { createHash } from 'crypto';
import { AccountRepository } from '../DataBase';
import { EmailCodeRepository } from '../DataBase';
import { Logger } from '../shared/utils';
import { EmailService } from '../shared/services';

/**
 * 注册结果码 (与客户端 ParseLoginSocketError.as 保持一致)
 */
export enum RegisterResult {
  SUCCESS = 0,
  EMAIL_EXISTS = 6000,           // 邮箱已存在
  CODE_SENT = 6001,              // 验证码已发送 (非错误)
  INVALID_CODE = 6002,           // 验证码错误或已过期
  EMAIL_FORMAT_ERROR = 700003,   // 暂不支持此邮箱注册
  EMAIL_ILLEGAL_CHAR = 700004,   // 邮箱包含非法字符
  PASSWORD_ERROR = 5003,         // 密码错误
  SYSTEM_ERROR = 5001,           // 系统错误
  TOO_MANY_REGISTRATIONS = -20012 // 今天注册的米米号太多了
}

export class RegistManager {
  private _accountRepo: AccountRepository;
  private _emailCodeRepo: EmailCodeRepository;

  constructor() {
    this._accountRepo = new AccountRepository();
    this._emailCodeRepo = new EmailCodeRepository();
  }

  /**
   * 处理注册请求
   * @param password 密码 (明文)
   * @param emailAddress 邮箱地址
   * @param emailCode 用户输入的验证码
   * @param emailCodeRes 服务器返回的验证码响应
   * @returns 新注册的米米号，失败返回 null
   */
  public async HandleRegister(
    password: string,
    emailAddress: string,
    emailCode: string,
    emailCodeRes: string
  ): Promise<{ result: RegisterResult; userId: number }> {
    // 1. 验证邮箱格式
    if (!this.isValidEmail(emailAddress)) {
      Logger.Warn(`[RegistManager] 邮箱格式错误: "${emailAddress}"`);
      return { result: RegisterResult.EMAIL_FORMAT_ERROR, userId: 0 };
    }

    // 2. 验证密码长度 (至少6位)
    if (!password || password.length < 6) {
      Logger.Warn(`[RegistManager] 密码长度不足: 长度=${password?.length || 0}`);
      return { result: RegisterResult.PASSWORD_ERROR, userId: 0 };
    }

    try {
      // 3. 检查邮箱是否已注册
      const emailExists = await this._accountRepo.EmailExists(emailAddress);
      if (emailExists) {
        Logger.Warn(`[RegistManager] 邮箱已注册: ${emailAddress}`);
        return { result: RegisterResult.EMAIL_EXISTS, userId: 0 };
      }

      // 4. 验证验证码
      const codeInfo = await this._emailCodeRepo.VerifyCode(emailAddress, emailCode);
      if (!codeInfo) {
        Logger.Warn(`[RegistManager] 验证码无效或已过期: ${emailAddress}`);
        return { result: RegisterResult.INVALID_CODE, userId: 0 };
      }

      // 5. 验证验证码响应是否匹配
      if (codeInfo.codeRes !== emailCodeRes) {
        Logger.Warn(`[RegistManager] 验证码响应不匹配: ${emailAddress}`);
        return { result: RegisterResult.INVALID_CODE, userId: 0 };
      }

      // 6. 对密码进行MD5加密后存储
      const passwordMD5 = createHash('md5').update(password).digest('hex');

      // 7. 创建账号
      const userId = await this._accountRepo.CreateAccount(emailAddress, passwordMD5);
      Logger.Info(`[RegistManager] 注册成功: userId=${userId}, email=${emailAddress}`);

      // 7. 标记验证码已使用
      await this._emailCodeRepo.MarkAllAsUsedByEmail(emailAddress);

      return { result: RegisterResult.SUCCESS, userId };

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistManager] 注册失败', error);
      return { result: RegisterResult.SYSTEM_ERROR, userId: 0 };
    }
  }

  /**
   * 生成并发送验证码
   * @param emailAddress 邮箱地址
   * @returns 验证码响应信息，失败返回 null
   */
  public async SendEmailCode(emailAddress: string): Promise<{
    success: boolean;
    codeRes?: string;
    error?: RegisterResult;
  }> {
    // 1. 验证邮箱格式
    if (!this.isValidEmail(emailAddress)) {
      return { success: false, error: RegisterResult.EMAIL_FORMAT_ERROR };
    }

    // 2. 检查发送频率 (60秒冷却)
    const canSend = await this._emailCodeRepo.CanSendCode(emailAddress, 60);
    if (!canSend) {
      Logger.Warn(`[RegistManager] 验证码发送过于频繁: ${emailAddress}`);
      return { success: false, error: RegisterResult.SYSTEM_ERROR };
    }

    try {
      // 3. 创建验证码
      const codeInfo = await this._emailCodeRepo.CreateCode(emailAddress, 300); // 5分钟有效期

      // 4. 发送验证码邮件
      await EmailService.Instance.SendVerificationCode(emailAddress, codeInfo.code);
      Logger.Info(`[RegistManager] 验证码已生成: email=${emailAddress}, code=${codeInfo.code}, codeRes=${codeInfo.codeRes}`);

      return {
        success: true,
        codeRes: codeInfo.codeRes
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistManager] 生成验证码失败', error);
      return { success: false, error: RegisterResult.SYSTEM_ERROR };
    }
  }

  /**
   * 清理过期验证码
   */
  public async CleanupExpiredCodes(): Promise<number> {
    try {
      const count = await this._emailCodeRepo.DeleteExpired();
      if (count > 0) {
        Logger.Info(`[RegistManager] 清理过期验证码: ${count} 条`);
      }
      return count;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistManager] 清理过期验证码失败', error);
      return 0;
    }
  }

  /**
   * 检查邮箱是否已注册
   * @param emailAddress 邮箱地址
   * @returns 是否已注册
   */
  public async CheckEmailExists(emailAddress: string): Promise<{
    success: boolean;
    exists?: boolean;
    error?: RegisterResult;
  }> {
    // 验证邮箱格式
    if (!this.isValidEmail(emailAddress)) {
      return { success: false, error: RegisterResult.EMAIL_FORMAT_ERROR };
    }

    try {
      const exists = await this._accountRepo.EmailExists(emailAddress);
      return { success: true, exists };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[RegistManager] 检查邮箱失败', error);
      return { success: false, error: RegisterResult.SYSTEM_ERROR };
    }
  }

  /**
   * 验证邮箱格式
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
