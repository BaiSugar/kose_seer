/**
 * 创建任务系统相关表
 * - tasks: 任务数据表（JSON格式存储）
 */
import { IMigration } from '../IMigration';

export class Migration010CreateTasksTables implements IMigration {
  version = 10;
  name = 'create_tasks_tables';

  upMySQL(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS tasks (
        user_id INT PRIMARY KEY COMMENT '用户ID',
        task_list TEXT NOT NULL DEFAULT '{}' COMMENT '任务列表（JSON格式）',
        task_buffers TEXT NOT NULL DEFAULT '{}' COMMENT '任务缓存（JSON格式）'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务数据表'`,
      
      `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`
    ];
  }

  upSQLite(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS tasks (
        user_id INTEGER PRIMARY KEY,
        task_list TEXT NOT NULL DEFAULT '{}',
        task_buffers TEXT NOT NULL DEFAULT '{}'
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`
    ];
  }

  downMySQL(): string[] {
    return [
      'DROP INDEX IF EXISTS idx_tasks_user_id ON tasks',
      'DROP TABLE IF EXISTS tasks'
    ];
  }

  downSQLite(): string[] {
    return [
      'DROP INDEX IF EXISTS idx_tasks_user_id',
      'DROP TABLE IF EXISTS tasks'
    ];
  }
}
