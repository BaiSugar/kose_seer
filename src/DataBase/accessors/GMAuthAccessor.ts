/**
 * GM 认证访问器
 * 提供 GM 认证相关的数据库操作
 */

import { DatabaseManager } from '../DatabaseManager';
import { Logger } from '../../shared/utils';

export interface GMWhitelistEntry {
  userId: number;
  email: string;
  permissions: string[];
  createdAt: number;
  createdBy: number;
  note?: string;
}

export interface GMSession {
  token: string;
  userId: number;
  email: string;
  ipAddress: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * GM 认证访问器
 */
export class GMAuthAccessor {
  private static _instance: GMAuthAccessor;

  private constructor() {}

  public static get Instance(): GMAuthAccessor {
    if (!GMAuthAccessor._instance) {
      GMAuthAccessor._instance = new GMAuthAccessor();
    }
    return GMAuthAccessor._instance;
  }

  /**
   * 验证账号密码（使用邮箱登录）
   */
  public async ValidateAccount(email: string, password: string): Promise<{ id: number; email: string } | null> {
    try {
      const accounts = await DatabaseManager.Instance.Query<any>(
        'SELECT id, email, password_hash FROM accounts WHERE email = ?',
        [email]
      );
      
      if (accounts.length === 0) {
        return null;
      }

      const account = accounts[0];
      
      // 验证密码（这里假设传入的password已经是MD5哈希）
      // 如果前端传的是明文，需要在这里进行MD5哈希
      if (account.password_hash !== password) {
        return null;
      }
      
      return { id: account.id, email: account.email };
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 验证账号失败', error as Error);
      return null;
    }
  }

  /**
   * 创建 GM Session
   */
  public async CreateSession(token: string, userId: number, email: string, ipAddress: string, expiresAt: number): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      await DatabaseManager.Instance.Query(
        `INSERT INTO gm_sessions (token, user_id, email, ip_address, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [token, userId, email, ipAddress, now, expiresAt]
      );
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 创建Session失败', error as Error);
      throw error;
    }
  }

  /**
   * 验证 Session Token
   */
  public async ValidateSession(token: string): Promise<{ userId: number; email: string } | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const sessions = await DatabaseManager.Instance.Query<any>(
        `SELECT user_id, email FROM gm_sessions WHERE token = ? AND expires_at > ?`,
        [token, now]
      );
      
      if (sessions.length === 0) {
        return null;
      }
      
      return { userId: sessions[0].user_id, email: sessions[0].email };
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 验证Session失败', error as Error);
      return null;
    }
  }

  /**
   * 删除 Session
   */
  public async DeleteSession(token: string): Promise<void> {
    try {
      await DatabaseManager.Instance.Query('DELETE FROM gm_sessions WHERE token = ?', [token]);
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 删除Session失败', error as Error);
      throw error;
    }
  }

  /**
   * 检查用户是否在白名单中
   */
  public async IsInWhitelist(userId: number): Promise<boolean> {
    try {
      const entries = await DatabaseManager.Instance.Query<any>(
        'SELECT user_id FROM gm_whitelist WHERE user_id = ?',
        [userId]
      );
      return entries.length > 0;
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 检查白名单失败', error as Error);
      return false;
    }
  }

  /**
   * 检查用户是否有指定权限
   */
  public async HasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      const entries = await DatabaseManager.Instance.Query<any>(
        'SELECT permissions FROM gm_whitelist WHERE user_id = ?',
        [userId]
      );
      
      if (entries.length === 0) {
        return false;
      }
      
      const permissions = JSON.parse(entries[0].permissions) as string[];
      return permissions.includes(permission) || permissions.includes('*');
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 检查权限失败', error as Error);
      return false;
    }
  }

  /**
   * 获取白名单列表
   */
  public async GetWhitelist(): Promise<GMWhitelistEntry[]> {
    try {
      const rows = await DatabaseManager.Instance.Query<any>(
        `SELECT user_id, email, permissions, created_at, created_by, note
         FROM gm_whitelist
         ORDER BY created_at DESC`
      );
      
      return rows.map(row => ({
        userId: row.user_id,
        email: row.email,
        permissions: JSON.parse(row.permissions),
        createdAt: row.created_at,
        createdBy: row.created_by,
        note: row.note
      }));
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 获取白名单失败', error as Error);
      return [];
    }
  }

  /**
   * 添加到白名单
   */
  public async AddToWhitelist(userId: number, email: string, permissions: string[], createdBy: number, note?: string): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      await DatabaseManager.Instance.Query(
        `INSERT OR REPLACE INTO gm_whitelist (user_id, email, permissions, created_at, created_by, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, JSON.stringify(permissions), now, createdBy, note || '']
      );
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 添加白名单失败', error as Error);
      throw error;
    }
  }

  /**
   * 从白名单移除
   */
  public async RemoveFromWhitelist(userId: number): Promise<void> {
    try {
      await DatabaseManager.Instance.Query('DELETE FROM gm_whitelist WHERE user_id = ?', [userId]);
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 移除白名单失败', error as Error);
      throw error;
    }
  }

  /**
   * 清理过期的 Session
   */
  public async CleanExpiredSessions(): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      await DatabaseManager.Instance.Query('DELETE FROM gm_sessions WHERE expires_at <= ?', [now]);
    } catch (error) {
      Logger.Error('[GMAuthAccessor] 清理过期Session失败', error as Error);
      throw error;
    }
  }
}
