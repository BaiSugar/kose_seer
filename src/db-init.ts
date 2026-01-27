/**
 * 数据库初始化脚本
 * 用于初始化数据库连接和执行迁移
 */
import { DatabaseManager, MigrationRunner } from './DataBase';
import { Logger } from './shared/utils';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  try {
    // 初始化数据库连接
    await DatabaseManager.Instance.Initialize();

    const runner = new MigrationRunner();

    switch (command) {
      case 'migrate':
        // 执行所有迁移
        await runner.RunAll();
        break;

      case 'rollback':
        // 回滚最后一个迁移
        await runner.RollbackLast();
        break;

      case 'rollback-all':
        // 回滚所有迁移
        await runner.RollbackTo(0);
        break;

      case 'status':
        // 显示迁移状态
        const status = await runner.GetStatus();
        Logger.Info('[Migration] 迁移状态:');
        for (const m of status) {
          const mark = m.executed ? '✓' : '✗';
          Logger.Info(`  ${mark} ${m.version}_${m.name}`);
        }
        break;

      default:
        Logger.Error(`未知命令: ${command}`);
        Logger.Info('可用命令: migrate, rollback, rollback-all, status');
    }

    // 关闭数据库连接
    await DatabaseManager.Instance.Shutdown();
    process.exit(0);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    Logger.Error('数据库操作失败', error);
    process.exit(1);
  }
}

main();
