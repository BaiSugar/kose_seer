/**
 * Gateway服务独立入口
 */
import { GatewayServer } from './Gateway';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

const gateway = new GatewayServer();

gateway.Start().catch((err: Error) => {
  Logger.Error('Gateway启动失败', err);
  process.exit(1);
});

// 处理进程退出
process.on('SIGINT', async () => {
  Logger.Info('收到退出信号...');
  await gateway.Stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.Info('收到终止信号...');
  await gateway.Stop();
  process.exit(0);
});
