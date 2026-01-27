import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { Logger } from '../shared/utils';

/**
 * HTTP 代理服务器配置
 */
export interface IHttpProxyConfig {
  listenPort: number;        // HTTP 代理监听端口
  tcpProxyHost: string;      // TCP 代理地址 (用于 ip.txt)
  tcpProxyPort: number;      // TCP 代理端口
  remoteHttpHost: string;    // 远程 HTTP 服务器 (www.nieo.cc)
}

/**
 * HTTP 代理服务器
 * 拦截 ip.txt 请求，返回本地 TCP 代理地址
 * 其他请求转发到远程服务器
 */
export class HttpProxyServer {
  private _server: Server;
  private _config: IHttpProxyConfig;
  private _running: boolean = false;

  constructor(config: IHttpProxyConfig) {
    this._config = config;
    this._server = createServer((req, res) => this.HandleRequest(req, res));
  }

  /**
   * 处理 HTTP 请求
   */
  private HandleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || '/';
    Logger.Info(`[HttpProxy] ${req.method} ${url}`);

    // 拦截 ip.txt 请求
    if (url === '/ip.txt' || url.endsWith('/ip.txt')) {
      this.HandleIpTxt(res);
      return;
    }

    // 其他请求转发到远程服务器
    this.ProxyToRemote(req, res);
  }

  /**
   * 处理 ip.txt 请求 - 返回本地 TCP 代理地址
   */
  private HandleIpTxt(res: ServerResponse): void {
    const ipContent = `${this._config.tcpProxyHost}:${this._config.tcpProxyPort}`;

    Logger.Info(`[HttpProxy] 拦截 ip.txt, 返回: ${ipContent}`);

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(ipContent),
      'Cache-Control': 'no-cache, no-store',
    });
    res.end(ipContent);
  }

  /**
   * 转发请求到远程 HTTPS 服务器
   */
  private ProxyToRemote(req: IncomingMessage, res: ServerResponse): void {
    const options = {
      hostname: this._config.remoteHttpHost,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: this._config.remoteHttpHost,
      },
    };

    const proxyReq = httpsRequest(options, (proxyRes) => {
      const headers: Record<string, string | string[] | undefined> = {};
      for (const key in proxyRes.headers) {
        headers[key] = proxyRes.headers[key];
      }

      res.writeHead(proxyRes.statusCode || 200, headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err: Error) => {
      Logger.Error(`[HttpProxy] 远程请求失败: ${req.url}`, err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  }

  /**
   * 启动服务器
   */
  public Start(): void {
    if (this._running) return;

    this._server.listen(this._config.listenPort, () => {
      this._running = true;
      Logger.Info(`[HttpProxy] HTTP 代理启动 http://127.0.0.1:${this._config.listenPort}`);
      Logger.Info(`[HttpProxy] ip.txt 将返回 ${this._config.tcpProxyHost}:${this._config.tcpProxyPort}`);
      Logger.Info(`[HttpProxy] 其他请求转发到 https://${this._config.remoteHttpHost}`);
    });
  }

  /**
   * 停止服务器
   */
  public Stop(): void {
    if (!this._running) return;

    this._server.close(() => {
      this._running = false;
      Logger.Info('[HttpProxy] 已停止');
    });
  }

  /**
   * 是否正在运行
   */
  public get IsRunning(): boolean {
    return this._running;
  }
}
