/**
 * 自动保存任务
 * 定期将内存中的数据保存到数据库
 */

import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { Logger } from '../../../shared/utils';

/**
 * 自动保存任务
 * 每隔一定时间自动保存所有待保存的数据
 */
export class AutoSaveTask {
  private static _instance: AutoSaveTask;
  private _timer: NodeJS.Timeout | null = null;
  private _interval: number = 60000; // 默认60秒保存一次

  private constructor() {}

  public static get Instance(): AutoSaveTask {
    if (!AutoSaveTask._instance) {
      AutoSaveTask._instance = new AutoSaveTask();
    }
    return AutoSaveTask._instance;
  }

  /**
   * 启动自动保存任务
   * @param intervalMs 保存间隔（毫秒），默认60秒
   */
  public Start(intervalMs: number = 60000): void {
    if (this._timer) {
      Logger.Warn('[AutoSaveTask] 自动保存任务已经在运行');
      return;
    }

    this._interval = intervalMs;
    this._timer = setInterval(async () => {
      await this.SaveAll();
    }, this._interval);

    Logger.Info(`[AutoSaveTask] 自动保存任务已启动，间隔: ${intervalMs}ms`);
  }

  /**
   * 停止自动保存任务
   */
  public Stop(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
      Logger.Info('[AutoSaveTask] 自动保存任务已停止');
    }
  }

  /**
   * 立即保存所有数据
   */
  public async SaveAll(): Promise<void> {
    try {
      const startTime = Date.now();
      await DatabaseHelper.Instance.SaveAll();
      const elapsed = Date.now() - startTime;
      
      if (elapsed > 1000) {
        Logger.Warn(`[AutoSaveTask] 保存耗时较长: ${elapsed}ms`);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      Logger.Error('[AutoSaveTask] 自动保存失败', error);
    }
  }
}
