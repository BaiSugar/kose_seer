import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ServerConfig } from '../../shared/config/ServerConfig';
import { Logger } from '../../shared/utils/Logger';

const authService = new AuthService();

/**
 * GM 基础认证中间件
 * - 本地模式（配置 localMode=true）：无需认证
 * - 远程模式（配置 localMode=false）：需要 token
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 检查是否是本地模式
    const isLocalMode = ServerConfig.Instance.GM.localMode ?? false;
    
    if (isLocalMode) {
      // 本地模式：无需认证，直接通过
      (req as any).isLocal = true;
      (req as any).userId = 0;
      (req as any).email = 'local';
      next();
      return;
    }

    // 远程模式：需要 token
    const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token as string;
    
    if (!token) {
      Logger.Warn('[GMAuth] 远程模式访问未提供token');
      res.status(401).json({ success: false, error: '需要登录' });
      return;
    }

    // 验证 token
    const user = await authService.validateToken(token);
    if (!user) {
      Logger.Warn(`[GMAuth] 无效的token: ${token.substring(0, 8)}...`);
      res.status(401).json({ success: false, error: 'Token无效或已过期' });
      return;
    }

    // 将用户信息附加到请求
    (req as any).isLocal = false;
    (req as any).userId = user.userId;
    (req as any).email = user.email;
    
    Logger.Debug(`[GMAuth] 用户 ${user.email} (${user.userId}) 通过认证`);
    next();
  } catch (error) {
    Logger.Error('[GMAuth] 认证失败', error as Error);
    res.status(500).json({ success: false, error: '认证失败' });
  }
}

/**
 * 白名单权限中间件
 * 需要用户在白名单中，并且有指定权限
 */
export function whitelistMiddleware(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 本地模式直接通过
      if ((req as any).isLocal) {
        next();
        return;
      }

      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
      }

      // 检查白名单和权限
      const hasPermission = await authService.hasPermission(userId, permission);
      if (!hasPermission) {
        Logger.Warn(`[GMAuth] 用户 ${userId} 无权限: ${permission}`);
        res.status(403).json({ success: false, error: `需要权限: ${permission}` });
        return;
      }

      Logger.Debug(`[GMAuth] 用户 ${userId} 权限验证通过: ${permission}`);
      next();
    } catch (error) {
      Logger.Error('[GMAuth] 权限验证失败', error as Error);
      res.status(500).json({ success: false, error: '权限验证失败' });
    }
  };
}
