/**
 * GameServer服务独立入口
 */
import { GameServer } from './GameServer';
import { Logger } from './shared/utils';
import { Config } from './shared/config';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

async function start() {
  // 加载战斗效果系统
  await import('./GameServer/Game/Battle/effects');
  Logger.Info('[Startup] 战斗效果系统已加载');
  
  // 加载游戏配置
  const { SkillConfig, SkillEffectConfig } = await import('./shared/config');
  SkillConfig.Load();
  SkillEffectConfig.Load();
  
  const gameServer = new GameServer();
  await gameServer.Start();

  // 处理进程退出
  process.on('SIGINT', async () => {
    Logger.Info('收到退出信号...');
    await gameServer.Stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    Logger.Info('收到终止信号...');
    await gameServer.Stop();
    process.exit(0);
  });
}

start().catch((err: Error) => {
  Logger.Error('GameServer启动失败', err);
  process.exit(1);
});
