/**
 * TaskData 访问器
 * 提供 TaskData 的便捷访问接口
 */

import { TaskData } from '../models/TaskData';
import { DataLoader } from '../loaders/DataLoader';
import { DataSaver } from '../savers/DataSaver';

/**
 * TaskData 访问器
 */
export class TaskDataAccessor {
  private static _instance: TaskDataAccessor;

  private constructor() {}

  public static get Instance(): TaskDataAccessor {
    if (!TaskDataAccessor._instance) {
      TaskDataAccessor._instance = new TaskDataAccessor();
    }
    return TaskDataAccessor._instance;
  }

  /**
   * 获取或创建 TaskData
   */
  public async GetOrCreate(uid: number): Promise<TaskData> {
    return DataLoader.Instance.GetOrCreate<TaskData>('task', uid);
  }

  /**
   * 获取 TaskData（不创建）
   */
  public Get(uid: number): TaskData | null {
    return DataLoader.Instance.Get<TaskData>('task', uid);
  }

  /**
   * 保存 TaskData
   */
  public async Save(data: TaskData): Promise<void> {
    return DataSaver.Instance.Save('task', data);
  }
}
