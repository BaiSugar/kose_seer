/**
 * 任务数据类
 * 直接映射数据库表，通过 DatabaseHelper 自动保存
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  NOT_ACCEPTED = 0,  // 未接受
  ACCEPTED = 1,      // 已接受
  IN_PROGRESS = 2,   // 进行中
  COMPLETED = 3,     // 已完成
}

/**
 * 单个任务信息
 */
export interface ITaskInfo {
  taskId: number;
  status: TaskStatus;
  acceptTime: number;
  completeTime: number;
}

/**
 * 任务缓存（每个任务5个缓存值）
 */
export interface ITaskBuffer {
  [index: number]: number;  // 索引 0-4 对应缓存值
}

/**
 * 任务数据（对应数据库表 tasks）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - Map 类型不需要配置为数组字段，因为 Map 的 set/delete 操作会触发顶层属性变化
 */
export class TaskData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 任务列表（key: taskId） */
  public TaskList: Map<number, ITaskInfo> = new Map();

  /** 任务缓存（key: taskId） */
  public TaskBuffers: Map<number, ITaskBuffer> = new Map();

  constructor(uid: number) {
    if (!uid || uid === 0) {
      throw new Error(`[TaskData] Invalid uid: ${uid}`);
    }
    
    // 调用父类构造函数
    // Map 类型不需要配置为数组字段
    super(
      uid,
      [], // 额外的黑名单字段
      []  // 数组字段（Map 不需要深度监听）
    );
    
    this.Uid = uid;

    // 返回 Proxy 包装的对象，实现自动保存
    return this.createProxy(this);
  }

  /**
   * 立即保存到数据库
   */
  public async save(): Promise<void> {
    try {
      await DatabaseHelper.Instance.SaveTaskData(this);
      Logger.Debug(`[TaskData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[TaskData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 TaskData
   */
  public static FromRow(row: any): TaskData {
    const data = new TaskData(row.owner_id);
    
    // 解析 JSON 字段
    if (row.task_list) {
      const taskListObj = JSON.parse(row.task_list);
      data.TaskList = new Map(Object.entries(taskListObj).map(([k, v]) => [parseInt(k), v as ITaskInfo]));
    }
    
    if (row.task_buffers) {
      const buffersObj = JSON.parse(row.task_buffers);
      data.TaskBuffers = new Map(Object.entries(buffersObj).map(([k, v]) => [parseInt(k), v as ITaskBuffer]));
    }
    
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    // 将 Map 转换为普通对象
    const taskListObj: any = {};
    this.TaskList.forEach((value, key) => {
      taskListObj[key] = value;
    });

    const buffersObj: any = {};
    this.TaskBuffers.forEach((value, key) => {
      buffersObj[key] = value;
    });

    return {
      owner_id: this.Uid,
      task_list: JSON.stringify(taskListObj),
      task_buffers: JSON.stringify(buffersObj)
    };
  }

  /**
   * 获取任务信息
   */
  public GetTask(taskId: number): ITaskInfo | undefined {
    return this.TaskList.get(taskId);
  }

  /**
   * 接受任务
   */
  public AcceptTask(taskId: number): void {
    const task: ITaskInfo = {
      taskId,
      status: TaskStatus.ACCEPTED,
      acceptTime: Math.floor(Date.now() / 1000),
      completeTime: 0
    };
    this.TaskList.set(taskId, task);
    // 自动触发保存（通过 Proxy）
  }

  /**
   * 完成任务
   */
  public CompleteTask(taskId: number): void {
    const task = this.TaskList.get(taskId);
    if (task) {
      task.status = TaskStatus.COMPLETED;
      task.completeTime = Math.floor(Date.now() / 1000);
      // 自动触发保存（通过 Proxy）
    }
  }

  /**
   * 检查任务是否已接受
   */
  public IsTaskAccepted(taskId: number): boolean {
    const task = this.TaskList.get(taskId);
    return task !== undefined && task.status !== TaskStatus.NOT_ACCEPTED;
  }

  /**
   * 检查任务是否已完成
   */
  public IsTaskCompleted(taskId: number): boolean {
    const task = this.TaskList.get(taskId);
    return task !== undefined && task.status === TaskStatus.COMPLETED;
  }

  /**
   * 获取任务缓存
   */
  public GetTaskBuffer(taskId: number): ITaskBuffer {
    let buffer = this.TaskBuffers.get(taskId);
    if (!buffer) {
      buffer = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      this.TaskBuffers.set(taskId, buffer);
    }
    return buffer;
  }

  /**
   * 设置任务缓存值
   */
  public SetTaskBufferValue(taskId: number, index: number, value: number): void {
    const buffer = this.GetTaskBuffer(taskId);
    buffer[index] = value;
    // 自动触发保存（通过 Proxy）
  }

  /**
   * 获取任务缓存值
   */
  public GetTaskBufferValue(taskId: number, index: number): number {
    const buffer = this.GetTaskBuffer(taskId);
    return buffer[index] || 0;
  }

  /**
   * 获取任务状态数组（用于登录响应）
   * 返回长度为 500 的数组，每个元素是任务状态（0=未接受, 1=已接受, 3=已完成）
   */
  public GetTaskStatusArray(): number[] {
    const statusArray = new Array(500).fill(0);
    
    this.TaskList.forEach((task, taskId) => {
      if (taskId > 0 && taskId <= 500) {
        // 客户端任务状态: 0=未接受, 1=已接受, 3=已完成
        if (task.status === TaskStatus.COMPLETED) {
          statusArray[taskId - 1] = 3;
        } else if (task.status >= TaskStatus.ACCEPTED) {
          statusArray[taskId - 1] = 1;  // 客户端期望的是 1，不是 2
        }
      }
    });
    
    return statusArray;
  }
}
