import { GMAuthAccessor } from '../../DataBase/accessors/GMAuthAccessor';
import { Logger } from '../../shared/utils/Logger';
import crypto from 'crypto';

export interface GMWhitelistEntry {
  userId: number;
  email: string;
  permissions: string[];
  createdAt: number;
  createdBy: number;
  note?: string;
}

/**
 * GM 认证服务
 */
export class AuthService {
  private accessor = GMAuthAccessor.Instance;

  /**
   * 验证用户登录并创建 GM Session
   */
  public async login(email: string, password: string, ipAddress: string): Promise<string | null> {
    try {
      // 验证账号密码
      const account = await this.accessor.ValidateAccount(email, password);
      if (!account) {
        Logger.Warn(`[AuthService] 登录失败: 邮箱或密码错误 ${email}`);
        return null;
      }

      // 生成 token
      const token = this.generateToken();
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 86400; // 24小时过期

      // 保存 session
      await this.accessor.CreateSession(token, account.id, account.email, ipAddress, expiresAt);

      Logger.Info(`[AuthService] 用户登录成功: ${email} (${account.id}) from ${ipAddress}`);
      return token;
    } catch (error) {
      Logger.Error('[AuthService] 登录失败', error as Error);
      return null;
    }
  }

  /**
   * 验证 token 并返回用户信息
   */
  public async validateToken(token: string): Promise<{ userId: number; email: string } | null> {
    return this.accessor.ValidateSession(token);
  }

  /**
   * 登出
   */
  public async logout(token: string): Promise<void> {
    try {
      await this.accessor.DeleteSession(token);
      Logger.Info(`[AuthService] 用户登出: token=${token.substring(0, 8)}...`);
    } catch (error) {
      Logger.Error('[AuthService] 登出失败', error as Error);
    }
  }

  /**
   * 检查用户是否在白名单中
   */
  public async isInWhitelist(userId: number): Promise<boolean> {
    return this.accessor.IsInWhitelist(userId);
  }

  /**
   * 检查用户是否有指定权限
   */
  public async hasPermission(userId: number, permission: string): Promise<boolean> {
    return this.accessor.HasPermission(userId, permission);
  }

  /**
   * 获取白名单列表
   */
  public async getWhitelist(): Promise<GMWhitelistEntry[]> {
    return this.accessor.GetWhitelist();
  }

  /**
   * 添加白名单
   */
  public async addToWhitelist(userId: number, email: string, permissions: string[], createdBy: number, note?: string): Promise<void> {
    await this.accessor.AddToWhitelist(userId, email, permissions, createdBy, note);
    Logger.Info(`[AuthService] 添加白名单: ${email} (${userId}), permissions=${permissions.join(',')}`);
  }

  /**
   * 从白名单移除
   */
  public async removeFromWhitelist(userId: number): Promise<void> {
    await this.accessor.RemoveFromWhitelist(userId);
    Logger.Info(`[AuthService] 移除白名单: userId=${userId}`);
  }

  /**
   * 清理过期的 session
   */
  public async cleanExpiredSessions(): Promise<void> {
    await this.accessor.CleanExpiredSessions();
  }

  /**
   * 生成随机 token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
