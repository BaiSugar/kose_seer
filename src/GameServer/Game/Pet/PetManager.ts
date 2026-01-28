import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { PacketGetPetList, PacketGetPetInfo, PacketPetRelease, PacketPetShow, PacketPetCure, PacketPetDefault } from '../../Server/Packet/Send/Pet';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { IPetInfo, createDefaultPetInfo } from '../../../shared/models/PetModel';
import { PetInfoProto } from '../../../shared/proto/common/PetInfoProto';
import { PetData } from '../../../DataBase/models/PetData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { PacketPetSetExp } from '../../Server/Packet/Send/Pet/PacketPetSetExp';
import { PacketPetGetExp } from '../../Server/Packet/Send/Pet/PacketPetGetExp';

/**
 * 精灵管理器
 * 处理精灵相关的所有逻辑：获取精灵信息、精灵列表、治疗、展示等
 * 
 * 架构说明：
 * - 持有 PetData 对象，直接操作数据
 * - 使用 DatabaseHelper 实时保存数据
 */
export class PetManager extends BaseManager {
  /** 精灵数据*/
  public PetData!: PetData;

  constructor(player: PlayerInstance) {
    super(player);
  }

  /**
   * 初始化（加载数据�?
   */
  public async Initialize(): Promise<void> {
    this.PetData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(this.UserID);
    Logger.Debug(`[PetManager] 初始化完�? UserID=${this.UserID}, Pets=${this.PetData.PetList.length}`);
  }

  /**
   * 处理获取精灵列表
   */
  public async HandleGetPetList(): Promise<void> {
    const pets = this.PetData.GetPetsInBag();
    const petProtos = pets.map(pet => this.petInfoToProto(pet));
    
    await this.Player.SendPacket(new PacketGetPetList(petProtos));
    Logger.Info(`[PetManager] 获取精灵列表: UserID=${this.UserID}, Count=${pets.length}`);
  }

  /**
   * 处理获取精灵信息
   */
  public async HandleGetPetInfo(catchTime: number): Promise<void> {
    Logger.Debug(`[PetManager] HandleGetPetInfo: UserID=${this.UserID}, CatchTime=${catchTime}`);
    
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (pet) {
      Logger.Info(`[PetManager] 找到精灵: PetID=${pet.petId}, Level=${pet.level}, CatchTime=${pet.catchTime}`);
      const petProto = this.petInfoToProto(pet);
      await this.Player.SendPacket(new PacketGetPetInfo(petProto));
    } else {
      Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      Logger.Debug(`[PetManager] 当前精灵列表: ${JSON.stringify(this.PetData.PetList.map(p => ({ petId: p.petId, catchTime: p.catchTime })))}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_INFO).setResult(5001));
    }
  }

  /**
   * 处理释放精灵
   */
  public async HandlePetRelease(catchTime: number): Promise<void> {
    const success = this.PetData.RemovePetByCatchTime(catchTime);
    
    if (success) {
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      await this.Player.SendPacket(new PacketPetRelease(0, catchTime, 1));
      Logger.Info(`[PetManager] 释放精灵: UserID=${this.UserID}, CatchTime=${catchTime}`);
    } else {
      Logger.Warn(`[PetManager] 释放精灵失败，精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
    }
  }

  /**
   * 处理将精灵放入背包（从仓库取出，或确认获得新精灵）
   */
  public async HandlePetTakeOut(catchTime: number): Promise<void> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (pet) {
      // 精灵已经在背包中，发送确认响应（包含精灵信息）
      const petProto = this.petInfoToProto(pet);
      await this.Player.SendPacket(new PacketPetRelease(0, catchTime, 1, petProto));
      Logger.Info(`[PetManager] 确认精灵放入背包: UserID=${this.UserID}, CatchTime=${catchTime}, PetId=${pet.petId}`);
    } else {
      Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
    }
  }

  /**
   * 处理展示精灵
   */
  public async HandlePetShow(catchTime: number): Promise<void> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (pet) {
      await this.Player.SendPacket(new PacketPetShow(this.UserID, pet.catchTime, pet.petId, 1, pet.dvHp, 0));
    } else {
      Logger.Warn(`[PetManager] 展示精灵失败，精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SHOW).setResult(5001));
    }
  }

  /**
   * 处理治疗精灵
   */
  public async HandlePetCure(petId?: number): Promise<void> {
    let success = false;
    
    if (petId) {
      // 治疗单个精灵
      const pet = this.PetData.GetPet(petId);
      if (pet) {
        pet.hp = pet.maxHp;
        success = true;
      }
    } else {
      // 治疗所有精�?
      const pets = this.PetData.GetPetsInBag();
      pets.forEach(pet => pet.hp = pet.maxHp);
      success = pets.length > 0;
    }
    
    if (success) {
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      await this.Player.SendPacket(new PacketPetCure());
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_CURE).setResult(5001));
    }
  }

  /**
   * 处理设置首发精灵
   */
  public async HandlePetDefault(petId: number): Promise<void> {
    const pet = this.PetData.GetPet(petId);
    
    if (pet && pet.isInBag) {
      // 清除其他精灵的首发标�?
      this.PetData.PetList.forEach(p => p.isDefault = false);
      // 设置当前精灵为首�?
      pet.isDefault = true;
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      
      await this.Player.SendPacket(new PacketPetDefault());
      Logger.Info(`[PetManager] 设置首发精灵: UserID=${this.UserID}, PetId=${petId}`);
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_DEFAULT).setResult(5001));
    }
  }

  /**
   * 处理获取精灵仓库列表
   */
  public async HandlePetBargeList(): Promise<void> {
    const pets = this.PetData.GetPetsInStorage();
    const petProtos = pets.map(pet => this.petInfoToProto(pet));
    
    await this.Player.SendPacket(new PacketGetPetList(petProtos));
    Logger.Info(`[PetManager] 获取仓库精灵列表: UserID=${this.UserID}, Count=${pets.length}`);
  }

  /**
   * 处理移动精灵到仓�?
   */
  public async HandleMovePetToStorage(petId: number): Promise<void> {
    const pet = this.PetData.GetPet(petId);
    
    if (pet && pet.isInBag) {
      pet.isInBag = false;
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST));
      Logger.Info(`[PetManager] 移动精灵到仓�? UserID=${this.UserID}, PetId=${petId}`);
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST).setResult(5001));
    }
  }

  /**
   * 处理移动精灵到背�?
   */
  public async HandleMovePetToBag(petId: number): Promise<void> {
    const pet = this.PetData.GetPet(petId);
    const { inBag } = this.PetData.GetPetCount();
    
    if (pet && !pet.isInBag && inBag < 6) {
      pet.isInBag = true;
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST));
      Logger.Info(`[PetManager] 移动精灵到背�? UserID=${this.UserID}, PetId=${petId}`);
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST).setResult(5001));
    }
  }

  /**
   * 处理增加精灵经验（按petId查找）
   * @deprecated 使用HandleAddPetExpByCatchTime代替
   */
  public async HandleAddPetExp(petId: number, expAmount: number): Promise<boolean> {
    const pet = this.PetData.GetPet(petId);
    if (!pet) return false;
    
    pet.exp += expAmount;
    const levelUp = this.checkLevelUp(pet);
    
    // 自动触发保存（通过深度 Proxy）
    Logger.Info(`[PetManager] 精灵获得经验: PetId=${petId}, Exp=${expAmount}, LevelUp=${levelUp}, NewLevel=${pet.level}`);
    
    return levelUp;
  }

  /**
   * 处理增加精灵经验（按catchTime查找）
   */
  public async HandleAddPetExpByCatchTime(catchTime: number, expAmount: number): Promise<boolean> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    if (!pet) {
      Logger.Warn(`[PetManager] 精灵未找到: CatchTime=${catchTime}`);
      return false;
    }
    
    pet.exp += expAmount;
    const levelUp = this.checkLevelUp(pet);
    
    // 自动触发保存（通过深度 Proxy）
    Logger.Info(`[PetManager] 精灵获得经验: CatchTime=${catchTime}, PetId=${pet.petId}, Exp=${expAmount}, LevelUp=${levelUp}, NewLevel=${pet.level}`);
    
    return levelUp;
  }

  /**
   * 检查并处理升级
   */
  private checkLevelUp(pet: IPetInfo): boolean {
    let levelUp = false;
    while (pet.exp >= this.calculateLvExp(pet.level + 1) && pet.level < 100) {
      pet.level++;
      levelUp = true;
      this.recalculateStats(pet);
    }
    return levelUp;
  }

  /**
   * 重新计算属�?
   */
  private recalculateStats(pet: IPetInfo): void {
    pet.maxHp = Math.floor(100 + pet.level * 5 + pet.dvHp + pet.evHp / 4);
    pet.atk = Math.floor(50 + pet.level * 2 + pet.dvAtk + pet.evAtk / 4);
    pet.def = Math.floor(50 + pet.level * 2 + pet.dvDef + pet.evDef / 4);
    pet.spAtk = Math.floor(50 + pet.level * 2 + pet.dvSpAtk + pet.evSpAtk / 4);
    pet.spDef = Math.floor(50 + pet.level * 2 + pet.dvSpDef + pet.evSpDef / 4);
    pet.speed = Math.floor(50 + pet.level * 2 + pet.dvSpeed + pet.evSpeed / 4);
    pet.hp = pet.maxHp;
  }

  /**
   * 获取精灵数量信息
   */
  public async GetPetCount(): Promise<{ total: number; inBag: number }> {
    return this.PetData.GetPetCount();
  }

  /**
   * 获取背包剩余空间
   */
  public async GetBagSpace(): Promise<number> {
    const { inBag } = this.PetData.GetPetCount();
    return Math.max(0, 6 - inBag);
  }

  /**
   * Give pet to player (for mail attachments, task rewards, etc.)
   */
  public async GivePet(petId: number, level: number = 1, catchTime?: number): Promise<boolean> {
    try {
      Logger.Info(`[PetManager] GivePet 开始: UserId=${this.UserID}, PetId=${petId}, Level=${level}, CatchTime=${catchTime}`);
      
      const bagSpace = await this.GetBagSpace();
      Logger.Debug(`[PetManager] 背包空间: ${bagSpace}`);
      
      if (bagSpace <= 0) {
        Logger.Warn(`[PetManager] Bag full, cannot give pet UserId=${this.UserID}, PetId=${petId}`);
        return false;
      }

      // Create new pet using createDefaultPetInfo
      const newPet = createDefaultPetInfo(this.UserID, petId);
      Logger.Debug(`[PetManager] 创建精灵对象: PetId=${newPet.petId}, CatchTime=${newPet.catchTime}`);
      
      // Set level and catch time
      newPet.level = level;
      newPet.obtainLevel = level;
      if (catchTime) {
        newPet.catchTime = catchTime;
      }
      Logger.Debug(`[PetManager] 设置等级和捕获时间: Level=${newPet.level}, CatchTime=0x${newPet.catchTime.toString(16)}`);
      
      // Use PetCalculator to calculate correct stats
      const { PetCalculator } = await import('./PetCalculator');
      PetCalculator.UpdatePetStats(newPet);
      Logger.Debug(`[PetManager] 计算属性: HP=${newPet.hp}/${newPet.maxHp}, ATK=${newPet.atk}`);
      
      // Use SptSystem to get default skills
      const { SptSystem } = await import('./SptSystem');
      const defaultSkills = SptSystem.GetDefaultSkills(petId, level);
      newPet.skillArray = defaultSkills.slice(0, 4).map(skill => skill.id);
      Logger.Debug(`[PetManager] 设置技能: ${newPet.skillArray.join(',')}`);
      
      // Add to bag
      Logger.Debug(`[PetManager] 添加前 PetList 长度: ${this.PetData.PetList.length}`);
      Logger.Debug(`[PetManager] PetData 对象 Uid: ${this.PetData.Uid}`);
      Logger.Debug(`[PetManager] PetData 对象引用: ${typeof this.PetData}`);
      
      this.PetData.AddPet(newPet);
      
      Logger.Debug(`[PetManager] 添加后 PetList 长度: ${this.PetData.PetList.length}`);
      Logger.Debug(`[PetManager] PetList 内容: ${JSON.stringify(this.PetData.PetList.map(p => ({ petId: p.petId, catchTime: p.catchTime })))}`);
      Logger.Debug(`[PetManager] 准备保存的 PetData.Uid: ${this.PetData.Uid}`);
      Logger.Debug(`[PetManager] 准备保存的 PetData.PetList.length: ${this.PetData.PetList.length}`);
      
      Logger.Info(`[PetManager] 准备保存精灵数据到数据库...`);
      await DatabaseHelper.Instance.SavePetData(this.PetData);
      
      Logger.Info(`[PetManager] Give pet success UserId=${this.UserID}, PetId=${petId}, Level=${level}, Skills=${newPet.skillArray.join(',')}`);
      return true;
    } catch (error) {
      Logger.Error(`[PetManager] Give pet error`, error as Error);
      return false;
    }
  }

  /**
   * 获取精灵Proto列表（用于登录响应等）
   */
  public GetPetProtoList(pets: IPetInfo[]): PetInfoProto[] {
    return pets.map(pet => this.petInfoToProto(pet));
  }

  /**
   * �?IPetInfo 转换�?PetInfoProto
   */
  private petInfoToProto(pet: IPetInfo): PetInfoProto {
    const proto = new PetInfoProto();
    
    proto.id = pet.petId;
    proto.name = pet.nick || '';
    proto.dv = pet.dvHp;
    proto.nature = pet.nature;
    proto.level = pet.level;
    proto.exp = pet.exp;
    proto.lvExp = this.calculateLvExp(pet.level);
    proto.nextLvExp = this.calculateLvExp(pet.level + 1);
    
    proto.hp = pet.hp;
    proto.maxHp = pet.maxHp;
    proto.attack = pet.atk;
    proto.defence = pet.def;
    proto.s_a = pet.spAtk;
    proto.s_d = pet.spDef;
    proto.speed = pet.speed;
    
    proto.ev_hp = pet.evHp;
    proto.ev_attack = pet.evAtk;
    proto.ev_defence = pet.evDef;
    proto.ev_sa = pet.evSpAtk;
    proto.ev_sd = pet.evSpDef;
    proto.ev_sp = pet.evSpeed;
    
    proto.skills = pet.skillArray.map(skillId => ({
      id: skillId,
      pp: 20,
      maxPp: 20
    }));
    
    proto.catchTime = pet.catchTime;
    proto.catchMap = 0;
    proto.catchRect = 0;
    proto.catchLevel = pet.obtainLevel;
    proto.effects = [];
    proto.skinID = 0;
    
    return proto;
  }

  /**
   * 处理获取可分配经验（精灵分配仪）
   */
  public async HandlePetGetExp(): Promise<void> {
    const allocatableExp = this.Player.Data.allocatableExp;
    await this.Player.SendPacket(new PacketPetGetExp(allocatableExp));
    Logger.Info(`[PetManager] 查询可分配经验: UserID=${this.UserID}, AllocExp=${allocatableExp}`);
  }

  /**
   * 处理设置精灵经验（精灵分配仪）
   */
  public async HandlePetSetExp(catchTime: number, expAmount: number): Promise<void> {
    try {
      // 1. 验证精灵存在
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5001));
        return;
      }

      // 2. 验证经验值有效
      if (expAmount <= 0) {
        Logger.Warn(`[PetManager] 经验值无效: UserID=${this.UserID}, ExpAmount=${expAmount}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5001));
        return;
      }

      // 3. 验证可分配经验足够
      if (this.Player.Data.allocatableExp < expAmount) {
        Logger.Warn(`[PetManager] 可分配经验不足: UserID=${this.UserID}, Need=${expAmount}, Have=${this.Player.Data.allocatableExp}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5004));
        return;
      }

      // 4. 验证精灵未满级
      if (pet.level >= 100) {
        Logger.Warn(`[PetManager] 精灵已满级: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5001));
        return;
      }

      // 5. 扣除可分配经验（自动保存）
      this.Player.Data.allocatableExp -= expAmount;

      // 6. 增加精灵经验
      pet.exp += expAmount;
      this.checkLevelUp(pet);

      // 7. 自动触发保存（通过深度 Proxy）

      // 8. 发送成功响应
      await this.Player.SendPacket(new PacketPetSetExp(
        pet.catchTime,
        pet.level,
        pet.exp,
        this.Player.Data.allocatableExp
      ));

      Logger.Info(`[PetManager] 分配经验成功: UserID=${this.UserID}, PetId=${pet.petId}, ExpAmount=${expAmount}, NewLevel=${pet.level}, RemainingExp=${this.Player.Data.allocatableExp}`);
    } catch (error) {
      Logger.Error(`[PetManager] HandlePetSetExp failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5000));
    }
  }

  /**
   * 计算等级经验
   */
  private calculateLvExp(level: number): number {
    return level * 100;
  }
}
