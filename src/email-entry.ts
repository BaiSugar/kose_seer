/**
 * EmailServer服务独立入口
 */
import { EmailServer } from './EmailServer';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

const emailServer = new EmailServer();

emailServer.Start();

// 处理进程退出
process.on('SIGINT', () => {
  Logger.Info('收到退出信号...');
  emailServer.Stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  Logger.Info('收到终止信号...');
  emailServer.Stop();
  process.exit(0);
});
