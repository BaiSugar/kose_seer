import { GMServer } from './GMServer/GMServer';
import { Logger } from './shared/utils/Logger';
import { Config } from './shared/config';
import { ConfigRegistry } from './shared/config/ConfigRegistry';
import { GetGameConfigRegistrations } from './shared/config/ConfigDefinitions';
import { DatabaseManager } from './DataBase/DatabaseManager';

// 初始化日志系统
Logger.Initialize(Config.Logging.level);

async function main() {
  try {
    Logger.Info('[GM Entry] ========================================');
    Logger.Info('[GM Entry] 启动 GM Server（独立模式）');
    Logger.Info('[GM Entry] ========================================');
    
    // 1. 加载游戏配置（GM 需要访问游戏数据）
    Logger.Info('[GM Entry] 加载游戏配置...');
    ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
    await ConfigRegistry.Instance.Initialize();
    Logger.Info('[GM Entry] 游戏配置加载完成');
    
    // 2. 初始化数据库
    Logger.Info('[GM Entry] 初始化数据库...');
    await DatabaseManager.Instance.Initialize();
    Logger.Info('[GM Entry] 数据库初始化完成');
    
    // 3. 启动 GM Server
    Logger.Info('[GM Entry] 启动 GM HTTP 服务...');
    const gmServer = new GMServer();
    gmServer.start();
    
    Logger.Info('[GM Entry] ========================================');
    Logger.Info('[GM Entry] GM Server 启动成功');
    Logger.Info('[GM Entry] ========================================');
    
  } catch (error) {
    Logger.Error('[GM Entry] GM Server 启动失败', error as Error);
    process.exit(1);
  }
}

// 优雅退出处理
process.on('SIGINT', async () => {
  Logger.Info('[GM Entry] 收到 SIGINT 信号，正在关闭...');
  await DatabaseManager.Instance.Shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.Info('[GM Entry] 收到 SIGTERM 信号，正在关闭...');
  await DatabaseManager.Instance.Shutdown();
  process.exit(0);
});

main();
