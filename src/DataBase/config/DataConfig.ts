/**
 * 数据配置
 * 定义每种数据类型的数据库映射配置
 */

import { FriendData } from '../models/FriendData';
import { ItemData } from '../models/ItemData';
import { PetData } from '../models/PetData';
import { MailData } from '../models/MailData';
import { TaskData } from '../models/TaskData';

/**
 * 数据类型接口
 */
export interface IDataClass<T> {
  FromRow(row: any): T;
  new(uid: number): T;
}

/**
 * 数据配置接口
 */
export interface IDataConfig<T> {
  tableName: string;
  dataClass: IDataClass<T>;
  toRow: (data: T) => any;
  getUid: (data: T) => number;
  saveFields?: string[];
}

/**
 * 数据配置注册表
 */
export class DataConfigRegistry {
  private static _instance: DataConfigRegistry;
  private _configs: Map<string, IDataConfig<any>> = new Map();

  private constructor() {
    this._initConfigs();
  }

  public static get Instance(): DataConfigRegistry {
    if (!DataConfigRegistry._instance) {
      DataConfigRegistry._instance = new DataConfigRegistry();
    }
    return DataConfigRegistry._instance;
  }

  /**
   * 初始化所有数据配置
   */
  private _initConfigs(): void {
    // FriendData 配置
    this._configs.set('friend', {
      tableName: 'player_friends',
      dataClass: FriendData,
      toRow: (data: FriendData) => data.ToRow(),
      getUid: (data: FriendData) => data.Uid,
      saveFields: ['friend_list', 'black_list', 'send_apply_list', 'receive_apply_list', 'chat_history']
    });

    // ItemData 配置
    this._configs.set('item', {
      tableName: 'player_items',
      dataClass: ItemData,
      toRow: (data: ItemData) => data.ToRow(),
      getUid: (data: ItemData) => data.Uid,
      saveFields: ['item_list']
    });

    // PetData 配置
    this._configs.set('pet', {
      tableName: 'player_pets',
      dataClass: PetData,
      toRow: (data: PetData) => data.ToRow(),
      getUid: (data: PetData) => data.Uid,
      saveFields: ['pet_list']
    });

    // MailData 配置
    this._configs.set('mail', {
      tableName: 'player_mails',
      dataClass: MailData,
      toRow: (data: MailData) => data.ToRow(),
      getUid: (data: MailData) => data.Uid,
      saveFields: ['mail_list']
    });

    // TaskData 配置
    this._configs.set('task', {
      tableName: 'player_tasks',
      dataClass: TaskData,
      toRow: (data: TaskData) => data.ToRow(),
      getUid: (data: TaskData) => data.Uid,
      saveFields: ['task_list', 'task_buffers']
    });
  }

  /**
   * 获取数据配置
   */
  public GetConfig<T>(type: string): IDataConfig<T> {
    const config = this._configs.get(type);
    if (!config) {
      throw new Error(`No config found for type: ${type}`);
    }
    return config;
  }

  /**
   * 注册新的数据配置
   */
  public Register<T>(type: string, config: IDataConfig<T>): void {
    this._configs.set(type, config);
  }

  /**
   * 获取所有数据类型
   */
  public GetAllTypes(): string[] {
    return Array.from(this._configs.keys());
  }
}
