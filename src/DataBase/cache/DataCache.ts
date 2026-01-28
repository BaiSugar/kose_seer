/**
 * 数据缓存管理器
 * 负责管理所有 Data 对象的内存缓存
 */

import { FriendData } from '../models/FriendData';
import { PlayerData } from '../models/PlayerData';
import { ItemData } from '../models/ItemData';
import { PetData } from '../models/PetData';
import { MailData } from '../models/MailData';
import { TaskData } from '../models/TaskData';

/**
 * 数据缓存管理器
 */
export class DataCache {
  private static _instance: DataCache;

  /** 缓存的数据对象 */
  private _friendDataCache: Map<number, FriendData> = new Map();
  private _playerDataCache: Map<number, PlayerData> = new Map();
  private _itemDataCache: Map<number, ItemData> = new Map();
  private _petDataCache: Map<number, PetData> = new Map();
  private _mailDataCache: Map<number, MailData> = new Map();
  private _taskDataCache: Map<number, TaskData> = new Map();

  private constructor() {}

  public static get Instance(): DataCache {
    if (!DataCache._instance) {
      DataCache._instance = new DataCache();
    }
    return DataCache._instance;
  }

  /**
   * 获取缓存 Map
   */
  public GetCache<T>(type: string): Map<number, T> {
    switch (type) {
      case 'friend': return this._friendDataCache as Map<number, T>;
      case 'item': return this._itemDataCache as Map<number, T>;
      case 'pet': return this._petDataCache as Map<number, T>;
      case 'mail': return this._mailDataCache as Map<number, T>;
      case 'task': return this._taskDataCache as Map<number, T>;
      case 'player': return this._playerDataCache as Map<number, T>;
      default: throw new Error(`Unknown data type: ${type}`);
    }
  }

  /**
   * 设置缓存
   */
  public Set<T>(type: string, uid: number, data: T): void {
    const cache = this.GetCache<T>(type);
    cache.set(uid, data);
  }

  /**
   * 获取缓存
   */
  public Get<T>(type: string, uid: number): T | null {
    const cache = this.GetCache<T>(type);
    return cache.get(uid) || null;
  }

  /**
   * 检查缓存是否存在
   */
  public Has(type: string, uid: number): boolean {
    const cache = this.GetCache(type);
    return cache.has(uid);
  }

  /**
   * 移除指定用户的所有缓存
   */
  public RemoveAll(uid: number): void {
    this._friendDataCache.delete(uid);
    this._playerDataCache.delete(uid);
    this._itemDataCache.delete(uid);
    this._petDataCache.delete(uid);
    this._mailDataCache.delete(uid);
    this._taskDataCache.delete(uid);
  }

  /**
   * 获取所有缓存的 UID
   */
  public GetAllUids(type: string): number[] {
    const cache = this.GetCache(type);
    return Array.from(cache.keys());
  }

  /**
   * 清空所有缓存
   */
  public ClearAll(): void {
    this._friendDataCache.clear();
    this._playerDataCache.clear();
    this._itemDataCache.clear();
    this._petDataCache.clear();
    this._mailDataCache.clear();
    this._taskDataCache.clear();
  }
}
