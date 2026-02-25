/**
 * 数据库助手（统一入口）
 * 提供向后兼容的接口，内部委托给各个专门的模块
 * 
 * 架构说明：
 * - DatabaseHelper 是统一入口，保持接口兼容
 * - DataCache 管理内存缓存
 * - DataLoader 负责加载数据
 * - DataSaver 负责保存数据
 * - DataAccessor 提供类型安全的访问接口
 */

import { FriendData } from './models/FriendData';
import { PlayerData } from './models/PlayerData';
import { ItemData } from './models/ItemData';
import { PetData } from './models/PetData';
import { MailData } from './models/MailData';
import { TaskData } from './models/TaskData';
import { ChallengeProgressData } from './models/ChallengeProgressData';

import { DataCache } from './cache/DataCache';
import { DataSaver } from './savers/DataSaver';
import { FriendDataAccessor } from './accessors/FriendDataAccessor';
import { ItemDataAccessor } from './accessors/ItemDataAccessor';
import { PetDataAccessor } from './accessors/PetDataAccessor';
import { MailDataAccessor } from './accessors/MailDataAccessor';
import { TaskDataAccessor } from './accessors/TaskDataAccessor';
import { PlayerDataAccessor } from './accessors/PlayerDataAccessor';
import { ChallengeProgressDataAccessor } from './accessors/ChallengeProgressDataAccessor';

/**
 * 数据库助手单例
 * 负责管理所有玩家的数据对象
 */
export class DatabaseHelper {
  private static _instance: DatabaseHelper;

  /** 待保存的 UID 列表（向后兼容） */
  public static ToSaveUidList: Set<number> = DataSaver.ToSaveUidList;

  private constructor() {}

  public static get Instance(): DatabaseHelper {
    if (!DatabaseHelper._instance) {
      DatabaseHelper._instance = new DatabaseHelper();
    }
    return DatabaseHelper._instance;
  }

  // ==================== FriendData ====================

  public async GetInstanceOrCreateNew_FriendData(uid: number): Promise<FriendData> {
    return FriendDataAccessor.Instance.GetOrCreate(uid);
  }

  public GetInstance_FriendData(uid: number): FriendData | null {
    return FriendDataAccessor.Instance.Get(uid);
  }

  public async SaveFriendData(data: FriendData): Promise<void> {
    return FriendDataAccessor.Instance.Save(data);
  }

  // ==================== ItemData ====================

  public async GetInstanceOrCreateNew_ItemData(uid: number): Promise<ItemData> {
    return ItemDataAccessor.Instance.GetOrCreate(uid);
  }

  public GetInstance_ItemData(uid: number): ItemData | null {
    return ItemDataAccessor.Instance.Get(uid);
  }

  public async SaveItemData(data: ItemData): Promise<void> {
    return ItemDataAccessor.Instance.Save(data);
  }

  // ==================== PetData ====================

  public async GetInstanceOrCreateNew_PetData(uid: number): Promise<PetData> {
    return PetDataAccessor.Instance.GetOrCreate(uid);
  }

  public GetInstance_PetData(uid: number): PetData | null {
    return PetDataAccessor.Instance.Get(uid);
  }

  public async SavePetData(data: PetData): Promise<void> {
    return PetDataAccessor.Instance.Save(data);
  }

  // ==================== MailData ====================

  public async GetInstanceOrCreateNew_MailData(uid: number): Promise<MailData> {
    return MailDataAccessor.Instance.GetOrCreate(uid);
  }

  public GetInstance_MailData(uid: number): MailData | null {
    return MailDataAccessor.Instance.Get(uid);
  }

  public async SaveMailData(data: MailData): Promise<void> {
    return MailDataAccessor.Instance.Save(data);
  }

  // ==================== TaskData ====================

  public async GetInstanceOrCreateNew_TaskData(uid: number): Promise<TaskData> {
    return TaskDataAccessor.Instance.GetOrCreate(uid);
  }

  public GetInstance_TaskData(uid: number): TaskData | null {
    return TaskDataAccessor.Instance.Get(uid);
  }

  public async SaveTaskData(data: TaskData): Promise<void> {
    return TaskDataAccessor.Instance.Save(data);
  }

  // ==================== PlayerData ====================

  public async GetInstance_PlayerData(uid: number): Promise<PlayerData | null> {
    return PlayerDataAccessor.Instance.Get(uid);
  }

  public async GetInstanceOrCreateNew_PlayerData(uid: number): Promise<PlayerData> {
    return PlayerDataAccessor.Instance.GetOrCreate(uid);
  }

  public async SavePlayerData(data: PlayerData): Promise<void> {
    return PlayerDataAccessor.Instance.Save(data);
  }

  // ==================== ChallengeProgressData ====================

  public async GetInstance_ChallengeProgressData(uid: number): Promise<ChallengeProgressData | undefined> {
    return ChallengeProgressDataAccessor.Instance.GetCached(uid);
  }

  public async GetInstanceOrCreateNew_ChallengeProgressData(uid: number): Promise<ChallengeProgressData> {
    return ChallengeProgressDataAccessor.Instance.GetOrCreate(uid);
  }

  public async SaveChallengeProgressData(data: ChallengeProgressData): Promise<void> {
    return ChallengeProgressDataAccessor.Instance.Save(data);
  }

  // ==================== 批量操作 ====================

  /**
   * 保存所有待保存的数据（定时调用）
   */
  public async SaveAll(): Promise<void> {
    return DataSaver.Instance.SaveAll();
  }

  /**
   * 保存指定用户的所有数据
   */
  public async SaveUser(uid: number): Promise<void> {
    return DataSaver.Instance.SaveUser(uid);
  }

  /**
   * 移除缓存（玩家下线时调用）
   */
  public RemoveCache(uid: number): void {
    DataCache.Instance.RemoveAll(uid);
  }
}

