import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { Logger } from '../shared/utils';
import { ICapturedPacket } from './ProxyServer';

// MIME 类型映射
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/**
 * Web GUI 服务器
 */
export class WebServer {
  private _httpServer: Server;
  private _wsServer: WebSocketServer | null = null;
  private _clients: Set<WebSocket> = new Set();
  private _proxyServer: { GetCapturedPackets(): ICapturedPacket[]; ClearPackets(): void };
  private _running: boolean = false;
  private _publicDir: string;
  private _webPort: number;

  constructor(proxyServer: { GetCapturedPackets(): ICapturedPacket[]; ClearPackets(): void }, webPort: number = 8080) {
    this._proxyServer = proxyServer;
    this._webPort = webPort;
    
    // 查找 public 目录
    // 开发环境: src/ProxyServer/public
    // 生产环境(npm start): dist/ProxyServer/public 或 src/ProxyServer/public
    // 打包环境(pkg): 可执行文件同级的 public 目录
    const possiblePaths = [
      join(__dirname, 'public'),                       // dist/ProxyServer/public
      join(__dirname, '../../src/ProxyServer/public'), // 从 dist 回到 src
      join(process.cwd(), 'src/ProxyServer/public'),   // 从工作目录
      join(process.cwd(), 'public'),                   // 打包后：可执行文件同级
      join(dirname(process.execPath), 'public'),       // 打包后：exe 同级
    ];
    
    this._publicDir = '';
    for (const testPath of possiblePaths) {
      if (existsSync(testPath)) {
        this._publicDir = testPath;
        Logger.Info(`[WebServer] 找到 public 目录: ${testPath}`);
        break;
      }
    }
    
    if (!this._publicDir) {
      Logger.Warn('[WebServer] 未找到 public 目录，Web GUI 将不可用');
      Logger.Warn(`[WebServer] 尝试的路径:`);
      possiblePaths.forEach(p => Logger.Warn(`  - ${p}`));
    }
    
    this._httpServer = createServer((req, res) => this.HandleRequest(req, res));
  }

  /**
   * 处理 HTTP 请求
   */
  private HandleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/';

    // API 路由
    if (url.startsWith('/api/')) {
      this.HandleAPI(url, req, res);
      return;
    }

    // 检查 public 目录是否存在
    if (!this._publicDir) {
      res.writeHead(503);
      res.end('Web GUI not available - public directory not found');
      return;
    }

    // 静态文件
    let filePath = url === '/' ? '/index.html' : url;
    filePath = join(this._publicDir, filePath);

    // 检查文件是否存在
    if (!existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      Logger.Warn(`[WebServer] 文件不存在: ${filePath}`);
      return;
    }

    // 读取并返回文件
    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content);
    } catch (err) {
      Logger.Error('[WebServer] 读取文件失败', err as Error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * 处理 API 请求
   */
  private HandleAPI(url: string, _req: IncomingMessage, res: ServerResponse): void {
    res.setHeader('Content-Type', 'application/json');

    if (url === '/api/packets') {
      // 获取所有数据包
      const packets = this._proxyServer.GetCapturedPackets();
      res.writeHead(200);
      res.end(JSON.stringify(packets));
    } else if (url === '/api/clear') {
      // 清空数据包
      this._proxyServer.ClearPackets();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  }

  /**
   * 广播数据包到所有 WebSocket 客户端
   */
  public BroadcastPacket(packet: ICapturedPacket): void {
    const message = JSON.stringify({ type: 'packet', data: packet });

    for (const client of this._clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  /**
   * 启动服务器
   */
  public Start(): void {
    if (this._running) return;

    this._httpServer.listen(this._webPort, () => {
      this._running = true;
      Logger.Info(`[WebServer] GUI 启动 http://127.0.0.1:${this._webPort}`);
    });

    // 创建 WebSocket 服务器
    this._wsServer = new WebSocketServer({ server: this._httpServer });

    this._wsServer.on('connection', (ws) => {
      this._clients.add(ws);
      Logger.Info(`[WebServer] WebSocket 客户端连接, 当前: ${this._clients.size}`);

      ws.on('close', () => {
        this._clients.delete(ws);
        Logger.Info(`[WebServer] WebSocket 客户端断开, 当前: ${this._clients.size}`);
      });

      ws.on('error', (err) => {
        Logger.Error('[WebServer] WebSocket 错误', err);
        this._clients.delete(ws);
      });
    });
  }

  /**
   * 停止服务器
   */
  public async Stop(): Promise<void> {
    if (!this._running) return;

    Logger.Info('[WebServer] 正在停止...');

    // 关闭所有 WebSocket 连接
    for (const client of this._clients) {
      try {
        client.close();
      } catch (err) {
        // 忽略关闭错误
      }
    }
    this._clients.clear();

    // 关闭 WebSocket 服务器
    if (this._wsServer) {
      await new Promise<void>((resolve) => {
        this._wsServer!.close(() => {
          Logger.Info('[WebServer] WebSocket 服务器已关闭');
          resolve();
        });
        
        // 设置超时，防止卡住
        setTimeout(() => {
          Logger.Warn('[WebServer] 关闭 WebSocket 服务器超时，强制继续');
          resolve();
        }, 3000);
      });
    }

    // 关闭 HTTP 服务器
    await new Promise<void>((resolve) => {
      this._httpServer.close(() => {
        this._running = false;
        Logger.Info('[WebServer] HTTP 服务器已关闭');
        resolve();
      });
      
      // 设置超时，防止卡住
      setTimeout(() => {
        Logger.Warn('[WebServer] 关闭 HTTP 服务器超时，强制继续');
        this._running = false;
        resolve();
      }, 3000);
    });
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
