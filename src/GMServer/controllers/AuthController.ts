import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Logger } from '../../shared/utils/Logger';

/**
 * 认证控制器
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * 登录
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
        return;
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const token = await this.authService.login(email, password, ipAddress);

      if (!token) {
        res.status(401).json({ success: false, error: '邮箱或密码错误' });
        return;
      }

      res.json({ success: true, data: { token } });
    } catch (error) {
      Logger.Error('[AuthController] 登录失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 登出
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token as string;
      
      if (token) {
        await this.authService.logout(token);
      }

      res.json({ success: true, message: '登出成功' });
    } catch (error) {
      Logger.Error('[AuthController] 登出失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取当前用户信息
   */
  public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const email = (req as any).email;
      const isLocal = (req as any).isLocal;

      // 获取权限
      let permissions: string[] = [];
      if (isLocal) {
        permissions = ['*']; // 本地访问拥有所有权限
      } else {
        const isInWhitelist = await this.authService.isInWhitelist(userId);
        if (isInWhitelist) {
          // 获取具体权限
          const whitelist = await this.authService.getWhitelist();
          const entry = whitelist.find(e => e.userId === userId);
          permissions = entry?.permissions || [];
        }
      }

      res.json({
        success: true,
        data: {
          userId,
          email,
          isLocal,
          permissions
        }
      });
    } catch (error) {
      Logger.Error('[AuthController] 获取用户信息失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 获取白名单列表
   */
  public getWhitelist = async (req: Request, res: Response): Promise<void> => {
    try {
      const whitelist = await this.authService.getWhitelist();
      res.json({ success: true, data: whitelist });
    } catch (error) {
      Logger.Error('[AuthController] 获取白名单失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 添加白名单
   */
  public addToWhitelist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, email, permissions, note } = req.body;
      const createdBy = (req as any).userId;

      if (!userId || !email || !permissions) {
        res.status(400).json({ success: false, error: '缺少必要参数' });
        return;
      }

      await this.authService.addToWhitelist(userId, email, permissions, createdBy, note);
      res.json({ success: true, message: '添加白名单成功' });
    } catch (error) {
      Logger.Error('[AuthController] 添加白名单失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };

  /**
   * 移除白名单
   */
  public removeFromWhitelist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body;

      if (!userId) {
        res.status(400).json({ success: false, error: '缺少userId参数' });
        return;
      }

      await this.authService.removeFromWhitelist(userId);
      res.json({ success: true, message: '移除白名单成功' });
    } catch (error) {
      Logger.Error('[AuthController] 移除白名单失败', error as Error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  };
}
