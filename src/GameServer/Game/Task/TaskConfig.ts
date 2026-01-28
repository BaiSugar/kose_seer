import { Logger } from '../../../shared/utils/Logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 任务奖励物品
 */
export interface ITaskRewardItem {
  id: number;
  count: number;
}

/**
 * 任务特殊奖励
 */
export interface ITaskSpecialReward {
  type: number;  // 1=金币, 3=经验, 5=其他
  value: number;
}

/**
 * 任务奖励
 */
export interface ITaskRewards {
  items?: ITaskRewardItem[];
  coins?: number;
  special?: ITaskSpecialReward[];
}

/**
 * 任务配置
 */
export interface ITaskConfig {
  name: string;
  type: string;  // normal, select_pet, get_item
  paramMap?: { [key: string]: number };  // 参数映射（用于选择精灵等）
  targetItemId?: number;  // 目标物品ID（用于获得物品任务）
  rewards?: ITaskRewards;
}

/**
 * 任务配置文件结构
 */
interface ITaskConfigFile {
  tasks: { [taskId: string]: ITaskConfig };
}

/**
 * 任务配置管理器
 */
export class TaskConfig {
  private static _instance: TaskConfig;
  private _tasks: Map<number, ITaskConfig> = new Map();
  private _loaded: boolean = false;

  private constructor() {}

  public static get Instance(): TaskConfig {
    if (!TaskConfig._instance) {
      TaskConfig._instance = new TaskConfig();
    }
    return TaskConfig._instance;
  }

  /**
   * 加载任务配置
   */
  public Load(): void {
    if (this._loaded) {
      return;
    }

    try {
      const configPath = path.join(process.cwd(), 'config', 'data', 'json', 'tasks.json');
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: ITaskConfigFile = JSON.parse(configData);

      // 加载所有任务
      for (const [taskIdStr, taskConfig] of Object.entries(config.tasks)) {
        const taskId = parseInt(taskIdStr, 10);
        this._tasks.set(taskId, taskConfig);
      }

      this._loaded = true;
      Logger.Info(`[TaskConfig] Loaded ${this._tasks.size} tasks`);
    } catch (error) {
      Logger.Error('[TaskConfig] Failed to load task config', error as Error);
    }
  }

  /**
   * 获取任务配置
   */
  public GetTask(taskId: number): ITaskConfig | undefined {
    if (!this._loaded) {
      this.Load();
    }
    return this._tasks.get(taskId);
  }

  /**
   * 检查任务是否存在
   */
  public HasTask(taskId: number): boolean {
    if (!this._loaded) {
      this.Load();
    }
    return this._tasks.has(taskId);
  }

  /**
   * 获取所有任务ID
   */
  public GetAllTaskIds(): number[] {
    if (!this._loaded) {
      this.Load();
    }
    return Array.from(this._tasks.keys());
  }
}
