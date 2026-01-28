/**
 * 精灵数据类
 * 直接映射数据库表，提供静态方法便捷访问
 * 
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */

import { DatabaseHelper } from '../DatabaseHelper';
import { IPetInfo } from '../../shared/models/PetModel';
import { Logger } from '../../shared/utils/Logger';
import { BaseData } from './BaseData';

/**
 * 精灵数据（对应数据库表 pets）
 * 
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetPetDataByUid 便捷访问
 */
export class PetData extends BaseData {
  /** 用户ID（主键） */
  public Uid: number;

  /** 精灵列表 */
  public PetList: IPetInfo[] = [];

  constructor(uid: number) {
    // 调用父类构造函数，传入黑名单字段和数组字段
    super(
      uid,
      [], // 额外的黑名单字段（父类已包含 Uid, _saveTimer, _pendingSave）
      ['PetList'] // 需要深度 Proxy 的数组字段
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
      await DatabaseHelper.Instance.SavePetData(this);
      Logger.Debug(`[PetData] 自动保存成功: uid=${this.Uid}`);
    } catch (error) {
      Logger.Error(`[PetData] 自动保存失败: uid=${this.Uid}`, error as Error);
    }
  }

  /**
   * 从数据库行创建 PetData
   */
  public static FromRow(row: any): PetData {
    const data = new PetData(row.owner_id);  // 修复：使用 owner_id
    data.PetList = row.pet_list ? JSON.parse(row.pet_list) : [];
    return data;
  }

  /**
   * 转换为数据库行
   */
  public ToRow(): any {
    return {
      owner_id: this.Uid,  // 修复：使用 owner_id
      pet_list: JSON.stringify(this.PetList)
    };
  }

  /**
   * 静态方法：根据 UID 获取精灵数据
   */
  public static async GetPetDataByUid(uid: number): Promise<PetData | null> {
    const data = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    return data;
  }

  /**
   * 添加精灵
   */
  public AddPet(pet: IPetInfo): void {
    this.PetList.push(pet);
    // 自动触发保存（通过 Proxy）
  }

  /**
   * 移除精灵
   */
  public RemovePet(petId: number): boolean {
    const index = this.PetList.findIndex(p => p.petId === petId);
    if (index === -1) return false;
    
    this.PetList.splice(index, 1);
    // 自动触发保存（通过 Proxy）
    return true;
  }

  /**
   * 获取精灵（按petId）
   */
  public GetPet(petId: number): IPetInfo | null {
    return this.PetList.find(p => p.petId === petId) || null;
  }

  /**
   * 获取精灵（按catchTime）
   */
  public GetPetByCatchTime(catchTime: number): IPetInfo | null {
    return this.PetList.find(p => p.catchTime === catchTime) || null;
  }

  /**
   * 移除精灵（按catchTime）
   */
  public RemovePetByCatchTime(catchTime: number): boolean {
    const index = this.PetList.findIndex(p => p.catchTime === catchTime);
    if (index === -1) return false;
    
    this.PetList.splice(index, 1);
    // 自动触发保存（通过 Proxy）
    return true;
  }

  /**
   * 获取背包中的精灵
   */
  public GetPetsInBag(): IPetInfo[] {
    return this.PetList.filter(p => p.isInBag);
  }

  /**
   * 获取仓库中的精灵
   */
  public GetPetsInStorage(): IPetInfo[] {
    return this.PetList.filter(p => !p.isInBag);
  }

  /**
   * 获取精灵数量
   */
  public GetPetCount(): { total: number; inBag: number } {
    const total = this.PetList.length;
    const inBag = this.PetList.filter(p => p.isInBag).length;
    return { total, inBag };
  }
}
