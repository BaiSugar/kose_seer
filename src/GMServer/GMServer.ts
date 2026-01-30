import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes';
import { Logger } from '../shared/utils/Logger';
import { ServerConfig } from '../shared/config/ServerConfig';

/**
 * GM Server - 游戏管理后台服务器
 * 
 * 模块化架构：
 * - Controller: 处理 HTTP 请求和响应
 * - Service: 业务逻辑层
 * - Route: 路由定义
 * 
 * API 模块：
 * - /api/players - 玩家管理
 * - /api/items - 物品管理
 * - /api/pets - 精灵管理
 * - /api/currency - 货币管理
 * - /api/server - 服务器管理
 * - /api/logs - 日志管理
 * - /api/config - 配置管理
 * - /api/reload - 配置重载
 */
export class GMServer {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = ServerConfig.Instance.GM?.port || 3002;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 配置中间件
   */
  private setupMiddleware(): void {
    // CORS 跨域支持
    this.app.use(cors());
    
    // JSON 解析
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 请求日志
    this.app.use((req, res, next) => {
      Logger.Debug(`[GMServer] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * 配置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'gm-server',
        version: '2.0.0',
        timestamp: Date.now()
      });
    });

    // API 路由（模块化）
    this.app.use('/api', apiRouter);

    // 404 处理
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'API 不存在',
        path: req.path
      });
    });

    // 错误处理
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      Logger.Error('[GMServer] 请求处理错误', err);
      res.status(500).json({
        success: false,
        error: err.message || '服务器内部错误'
      });
    });
  }

  /**
   * 启动服务器
   */
  public start(): void {
    this.app.listen(this.port, () => {
      Logger.Info(`[GMServer] ========================================`);
      Logger.Info(`[GMServer] GM 服务器启动成功`);
      Logger.Info(`[GMServer] 地址: http://localhost:${this.port}`);
      Logger.Info(`[GMServer] API 文档: http://localhost:${this.port}/api/docs`);
      Logger.Info(`[GMServer] 健康检查: http://localhost:${this.port}/health`);
      Logger.Info(`[GMServer] ========================================`);
    });
  }
}
