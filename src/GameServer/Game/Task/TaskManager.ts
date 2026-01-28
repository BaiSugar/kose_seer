import { TaskData } from '../../../DataBase/models/TaskData';
import { Logger } from '../../../shared/utils/Logger';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { PlayerInstance } from '../Player/PlayerInstance';
import { BaseManager } from '../Base/BaseManager';
import { TaskConfig, ITaskRewardItem } from './TaskConfig';
import { PacketCompleteTask } from '../../Server/Packet/Send/Task/PacketCompleteTask';

/**
 * 任务管理器
 * 负责任务相关的业务逻辑
 * 
 * 架构：Manager 持有 TaskData，提供业务逻辑方法
 */
export class TaskManager extends BaseManager {
  /** 任务数据 */
  public TaskData!: TaskData;

  constructor(player: PlayerInstance) {
    super(player);
  }

  /**
   * 初始化任务管理器
   */
  public async Initialize(): Promise<void> {
    // 通过 DatabaseHelper 加载或创建任务数据
    this.TaskData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_TaskData(this.UserID);
    Logger.Debug(`[TaskManager] 用户 ${this.UserID} 初始化完成`);
  }

  /**
   * 接受任务（业务逻辑）
   */
  public async AcceptTask(taskId: number): Promise<void> {
    this.TaskData.AcceptTask(taskId);
    // 立即保存到数据库
    await DatabaseHelper.Instance.SaveTaskData(this.TaskData);
  }

  /**
   * 完成任务（业务逻辑）
   */
  public async CompleteTask(taskId: number, param: number): Promise<void> {
    try {
      Logger.Info(`[TaskManager] 用户 ${this.UserID} 完成任务 ${taskId}，参数=${param}`);

      // 检查任务配置
      const taskConfig = TaskConfig.Instance.GetTask(taskId);
      if (!taskConfig) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 配置不存在`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5001));
        return;
      }

      // 检查任务状态
      if (!this.TaskData.IsTaskAccepted(taskId)) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 尚未接受`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5002));
        return;
      }

      if (this.TaskData.IsTaskCompleted(taskId)) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 已完成`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5003));
        return;
      }

      // 处理任务奖励
      let petId = 0;
      let captureTm = 0;
      const rewardItems: ITaskRewardItem[] = [];

      // 1. 处理选择精灵任务
      if (taskConfig.type === 'select_pet' && taskConfig.paramMap) {
        petId = taskConfig.paramMap[param.toString()] || 1;
        captureTm = 0x69686700 + petId;

        // 给玩家精灵 - 新手精灵等级为5
        await this.Player.PetManager.GivePet(petId, 5, captureTm);
        Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 精灵 ${petId}, 等级5, catchTime=0x${captureTm.toString(16)}`);
      }

      // 2. 处理物品奖励
      if (taskConfig.rewards?.items) {
        for (const item of taskConfig.rewards.items) {
          await this.Player.ItemManager.GiveItem(item.id, item.count);
          rewardItems.push(item);
          Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 物品 ${item.id} x${item.count}`);
        }
      }

      // 3. 处理金币奖励
      if (taskConfig.rewards?.coins) {
        this.Player.Data.coins += taskConfig.rewards.coins;  // 自动保存
        rewardItems.push({ id: 1, count: taskConfig.rewards.coins });
        Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 金币 ${taskConfig.rewards.coins}`);
      }

      // 4. 处理特殊奖励
      if (taskConfig.rewards?.special) {
        for (const special of taskConfig.rewards.special) {
          if (special.type === 1) {
            // 金币
            this.Player.Data.coins += special.value;  // 自动保存
          }
          rewardItems.push({ id: special.type, count: special.value });
        }
      }

      // 完成任务
      this.TaskData.CompleteTask(taskId);
      
      // 立即保存任务数据到数据库
      await DatabaseHelper.Instance.SaveTaskData(this.TaskData);

      // 发送响应
      await this.Player.SendPacket(new PacketCompleteTask(taskId, petId, captureTm, rewardItems));
      Logger.Info(`[TaskManager] 用户 ${this.UserID} 完成任务 ${taskId} 成功 - petId=${petId}, captureTm=${captureTm}, rewardItems=${rewardItems.length}个`);
      
      // 详细记录奖励内容
      if (rewardItems.length > 0) {
        Logger.Info(`[TaskManager] 奖励详情: ${JSON.stringify(rewardItems)}`);
      }
    } catch (error) {
      Logger.Error(`[TaskManager] 完成任务失败: taskId=${taskId}`, error as Error);
      await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5000));
    }
  }

  /**
   * 设置任务缓存值（业务逻辑）
   */
  public async SetTaskBufferValue(taskId: number, index: number, value: number): Promise<void> {
    this.TaskData.SetTaskBufferValue(taskId, index, value);
    // 立即保存到数据库
    await DatabaseHelper.Instance.SaveTaskData(this.TaskData);
  }

  /**
   * 获取任务缓存（只读，不需要标记保存）
   */
  public GetTaskBuffer(taskId: number): number[] {
    const buffer = this.TaskData.GetTaskBuffer(taskId);
    return [
      buffer[0] || 0,
      buffer[1] || 0,
      buffer[2] || 0,
      buffer[3] || 0,
      buffer[4] || 0
    ];
  }
}
