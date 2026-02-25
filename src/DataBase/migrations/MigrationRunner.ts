/**
 * 数据库迁移执行器
 */
import { DatabaseManager } from '../DatabaseManager';
import { IMigration } from './IMigration';
import { Logger } from '../../shared/utils';

// 导入所有迁移脚本
import { Migration001CreateAccounts } from './scripts/001_create_accounts';
import { Migration002CreateSessions } from './scripts/002_create_sessions';
import { Migration003CreatePlayers } from './scripts/003_create_players';
import { Migration004CreatePets } from './scripts/004_create_pets';
import { Migration005CreateEmailCodes } from './scripts/005_create_email_codes';
import { Migration006CreateItems } from './scripts/006_create_items';
import { Migration009CreateFriendsTables } from './scripts/009_create_friends_tables';
import { Migration010CreateTasksTables } from './scripts/010_create_tasks_tables';
import { Migration011CreateMails } from './scripts/006_create_mails';
import { Migration012FixAllTables } from './scripts/012_fix_all_tables';
import { Migration013AddAllocatableExp } from './scripts/013_add_allocatable_exp';
import { Migration008AlignNoNoFieldsWithOfficial } from './scripts/008_align_nono_fields_with_official';
import { Migration014AddMessWinAndCurTitle } from './scripts/014_add_mess_win_and_cur_title';
import { Migration016AddGoldField } from './scripts/016_add_gold_field';
import { Migration017AddClothIds } from './scripts/017_add_cloth_ids';
import { Migration018CreateChallengeProgressTable } from './scripts/018_create_challenge_progress_table';
import { Migration019AddChallengeFieldsToPlayers } from './scripts/019_add_challenge_fields_to_players';

/**
 * 所有迁移脚本（按版本号排序）
 */
const AllMigrations: IMigration[] = [
  new Migration001CreateAccounts(),
  new Migration002CreateSessions(),
  new Migration003CreatePlayers(),
  new Migration004CreatePets(),
  new Migration005CreateEmailCodes(),
  new Migration006CreateItems(),
  new Migration009CreateFriendsTables(),
  new Migration010CreateTasksTables(),
  new Migration011CreateMails(),
  new Migration012FixAllTables(),
  new Migration013AddAllocatableExp(),
  new Migration008AlignNoNoFieldsWithOfficial(),
  new Migration014AddMessWinAndCurTitle(),
  new Migration016AddGoldField(),
  new Migration017AddClothIds(),
  new Migration018CreateChallengeProgressTable(),
  new Migration019AddChallengeFieldsToPlayers(),
];

export class MigrationRunner {
  private _db: DatabaseManager;

  constructor() {
    this._db = DatabaseManager.Instance;
  }

  /**
   * 初始化迁移表
   */
  private async initMigrationTable(): Promise<void> {
    const dbType = this._db.DatabaseType;

    if (dbType === 'mysql') {
      await this._db.Execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          version INT NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } else {
      await this._db.Execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }
  }

  /**
   * 获取已执行的迁移版本
   */
  private async getExecutedVersions(): Promise<number[]> {
    const rows = await this._db.Query<{ version: number }>('SELECT version FROM migrations ORDER BY version');
    return rows.map(r => r.version);
  }

  /**
   * 记录迁移执行
   */
  private async recordMigration(migration: IMigration): Promise<void> {
    await this._db.Execute(
      'INSERT INTO migrations (version, name) VALUES (?, ?)',
      [migration.version, migration.name]
    );
  }

  /**
   * 删除迁移记录
   */
  private async removeMigrationRecord(version: number): Promise<void> {
    await this._db.Execute('DELETE FROM migrations WHERE version = ?', [version]);
  }

  /**
   * 执行所有待执行的迁移
   */
  public async RunAll(): Promise<void> {
    await this.initMigrationTable();

    const executedVersions = await this.getExecutedVersions();
    const dbType = this._db.DatabaseType;

    for (const migration of AllMigrations) {
      if (executedVersions.includes(migration.version)) {
        continue;
      }

      Logger.Info(`[Migration] 执行迁移: ${migration.version}_${migration.name}`);

      try {
        const sqls = dbType === 'mysql' ? migration.upMySQL() : migration.upSQLite();

        for (const sql of sqls) {
          await this._db.Execute(sql);
        }

        await this.recordMigration(migration);
        Logger.Info(`[Migration] 迁移完成: ${migration.version}_${migration.name}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        Logger.Error(`[Migration] 迁移失败: ${migration.version}_${migration.name}`, error);
        throw err;
      }
    }

    Logger.Info('[Migration] 所有迁移执行完成');
  }

  /**
   * 回滚最后一个迁移
   */
  public async RollbackLast(): Promise<void> {
    await this.initMigrationTable();

    const executedVersions = await this.getExecutedVersions();
    if (executedVersions.length === 0) {
      Logger.Info('[Migration] 没有可回滚的迁移');
      return;
    }

    const lastVersion = Math.max(...executedVersions);
    const migration = AllMigrations.find(m => m.version === lastVersion);

    if (!migration) {
      Logger.Error(`[Migration] 找不到版本 ${lastVersion} 的迁移脚本`);
      return;
    }

    const dbType = this._db.DatabaseType;

    Logger.Info(`[Migration] 回滚迁移: ${migration.version}_${migration.name}`);

    try {
      const sqls = dbType === 'mysql' ? migration.downMySQL() : migration.downSQLite();

      for (const sql of sqls) {
        await this._db.Execute(sql);
      }

      await this.removeMigrationRecord(migration.version);
      Logger.Info(`[Migration] 回滚完成: ${migration.version}_${migration.name}`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error(`[Migration] 回滚失败: ${migration.version}_${migration.name}`, error);
      throw err;
    }
  }

  /**
   * 回滚到指定版本
   */
  public async RollbackTo(targetVersion: number): Promise<void> {
    await this.initMigrationTable();

    const executedVersions = await this.getExecutedVersions();
    const versionsToRollback = executedVersions
      .filter(v => v > targetVersion)
      .sort((a, b) => b - a);

    for (const version of versionsToRollback) {
      const migration = AllMigrations.find(m => m.version === version);
      if (!migration) continue;

      const dbType = this._db.DatabaseType;

      Logger.Info(`[Migration] 回滚迁移: ${migration.version}_${migration.name}`);

      try {
        const sqls = dbType === 'mysql' ? migration.downMySQL() : migration.downSQLite();

        for (const sql of sqls) {
          await this._db.Execute(sql);
        }

        await this.removeMigrationRecord(migration.version);
        Logger.Info(`[Migration] 回滚完成: ${migration.version}_${migration.name}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        Logger.Error(`[Migration] 回滚失败: ${migration.version}_${migration.name}`, error);
        throw err;
      }
    }
  }

  /**
   * 获取迁移状态
   */
  public async GetStatus(): Promise<{ version: number; name: string; executed: boolean }[]> {
    await this.initMigrationTable();

    const executedVersions = await this.getExecutedVersions();

    return AllMigrations.map(m => ({
      version: m.version,
      name: m.name,
      executed: executedVersions.includes(m.version)
    }));
  }
}
