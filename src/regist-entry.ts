/**
 * RegistServer服务独立入口
 */
import { RegistServer } from './RegistServer';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

const registServer = new RegistServer();

registServer.Start().catch((err: Error) => {
  Logger.Error('RegistServer启动失败', err);
  process.exit(1);
});

// 处理进程退出
process.on('SIGINT', async () => {
  Logger.Info('收到退出信号...');
  await registServer.Stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.Info('收到终止信号...');
  await registServer.Stop();
  process.exit(0);
});
