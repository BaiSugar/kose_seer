import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { 
  PacketGetPetList, 
  PacketGetPetInfo, 
  PacketPetRelease, 
  PacketPetShow, 
  PacketPetCure, 
  PacketPetDefault, 
  PacketStudySkill, 
  PacketSkillSwitch } from '../../Server/Packet/Send/Pet';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { IPetInfo, createDefaultPetInfo } from '../../../shared/models/PetModel';
import { PetInfoProto } from '../../../shared/proto/common/PetInfoProto';
import { PetData } from '../../../DataBase/models/PetData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { PacketPetSetExp } from '../../Server/Packet/Send/Pet/PacketPetSetExp';
import { PacketPetGetExp } from '../../Server/Packet/Send/Pet/PacketPetGetExp';
import { PacketPetEvolution } from '../../Server/Packet/Send/Pet/PacketPetEvolution';
import { PacketNoteUpdateProp } from '../../Server/Packet/Send/Pet/PacketNoteUpdateProp';
import { PacketNoteUpdateSkill } from '../../Server/Packet/Send/Pet/PacketNoteUpdateSkill';
import { IUpdatePropInfo } from '../../../shared/proto/packets/rsp/pet/NoteUpdatePropRspProto';
import { IUpdateSkillInfo } from '../../../shared/proto/packets/rsp/pet/NoteUpdateSkillRspProto';
import { SptSystem } from './SptSystem';
import { PetCalculator } from './PetCalculator';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { PacketPetOneCure } from '../../Server/Packet/Send/Pet/PacketPetOneCure';
import { PacketGetPetSkill } from '../../Server/Packet/Send/Pet/PacketGetPetSkill';
import { PacketPetRoomList } from '../../Server/Packet/Send/Pet/PacketPetRoomList';
import { PacketSkillSort } from '../../Server/Packet/Send/Pet/PacketSkillSort';
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
   * 获取精灵缺失的技能（应该学会但还没学会的）
   * @param pet 精灵信息
   * @returns 缺失的技能ID列表
   */
  private GetMissingSkills(pet: IPetInfo): number[] {
    // 获取当前等级应该学会的所有技能
    const shouldHaveSkills = SptSystem.GetLearnableMovesByLevel(pet.petId, pet.level);
    
    // 过滤出还没学会的技能
    const missingSkills: number[] = [];
    for (const skill of shouldHaveSkills) {
      if (!pet.skillArray.includes(skill.id)) {
        missingSkills.push(skill.id);
      }
    }
    
    return missingSkills;
  }


  /**
   * 处理获取精灵列表（返回所有精灵的简化信息，用于填充 _storageMap）
   * 客户端期望的格式：PetListInfo (id, catchTime, skinID)
   * 排序规则：首发精灵第一个，其他按 catchTime 升序排列
   */
  public async HandleGetPetList(): Promise<void> {
    // 获取所有精灵（背包+仓库）
    const allPets = this.PetData.PetList;
    
    // 排序：首发精灵第一个，其他按 catchTime 升序
    const sortedPets = [...allPets].sort((a, b) => {
      // 首发精灵排在最前面
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // 其他精灵按 catchTime 升序排列（越早获得越靠前）
      return a.catchTime - b.catchTime;
    });
    
    // 转换为 PetListInfo 格式（简化版：id, catchTime, skinID）
    const petListInfos = sortedPets.map(pet => ({
      id: pet.petId,
      catchTime: pet.catchTime,
      skinID: pet.skinId || 0
    }));
    
    await this.Player.SendPacket(new PacketPetRoomList(petListInfos));
    Logger.Info(`[PetManager] 获取精灵列表（所有精灵）: UserID=${this.UserID}, Count=${petListInfos.length}`);
  }

  /**
   * 处理获取精灵仓库列表
   * 排序规则：按 catchTime 升序排列（越早获得越靠前）
   */
  public async HandleGetPetRoomList(roomType: number): Promise<void> {
    const storagePets = this.PetData.GetPetsInStorage();
    
    // 排序：按 catchTime 升序
    const sortedPets = [...storagePets].sort((a, b) => a.catchTime - b.catchTime);
    
    // 转换为 PetListInfo 格式（简化版）
    const petList = sortedPets.map(pet => ({
      id: pet.petId,
      catchTime: pet.catchTime,
      skinID: pet.skinId || 0
    }));
    
    await this.Player.SendPacket(new PacketPetRoomList(petList));
    Logger.Info(`[PetManager] 获取精灵仓库列表: UserID=${this.UserID}, RoomType=${roomType}, Count=${petList.length}`);
  }

  /**
   * 主动推送精灵列表更新（用于GM发送精灵、捕捉精灵等场景）
   * @param includeStorage 是否包含仓库精灵（默认false，只推送背包）
   * @deprecated 不推荐使用，客户端没有持续监听GET_PET_LIST，请使用SendNoteUpdatePropForNewPet
   */
  public async SendPetListUpdate(includeStorage: boolean = false): Promise<void> {
    const pets = includeStorage ? this.PetData.GetPetsInStorage() : this.PetData.GetPetsInBag();
    const petProtos = pets.map(pet => this.petInfoToProto(pet));
    
    await this.Player.SendPacket(new PacketGetPetList(petProtos));
    Logger.Info(`[PetManager] 主动推送精灵列表更新: UserID=${this.UserID}, Type=${includeStorage ? '仓库' : '背包'}, Count=${pets.length}`);
  }

  /**
   * 推送 NOTE_UPDATE_PROP 触发客户端刷新精灵列表（用于GM发送精灵等场景）
   * 客户端收到此消息后会自动调用 PetManager.upDate() 刷新精灵列表
   * @param pet 新获得的精灵信息
   */
  public async SendNoteUpdatePropForNewPet(pet: IPetInfo): Promise<void> {
    await this.sendNoteUpdateProp([pet], 0);
    Logger.Info(`[PetManager] 推送 NOTE_UPDATE_PROP 触发客户端刷新: UserID=${this.UserID}, PetId=${pet.petId}`);
  }

  /**
   * 处理获取精灵信息
   */
  public async HandleGetPetInfo(catchTime: number): Promise<void> {
    Logger.Debug(`[PetManager] HandleGetPetInfo: UserID=${this.UserID}, CatchTime=${catchTime}`);
    
    // 忽略无效的 catchTime（客户端缓存的旧数据）
    if (catchTime < 1000000000) {
      Logger.Warn(`[PetManager] 忽略无效的 catchTime: UserID=${this.UserID}, CatchTime=${catchTime} (客户端缓存数据)`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_INFO).setResult(5001));
      return;
    }
    
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
   * 处理将精灵放到仓库（flag=0）
   */
  public async HandlePetRelease(catchTime: number): Promise<void> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (!pet) {
      Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
      return;
    }

    if (!pet.isInBag) {
      Logger.Warn(`[PetManager] 精灵不在背包中: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
      return;
    }

    // 将精灵移到仓库
    pet.isInBag = false;
    
    // 如果是首发精灵，需要取消首发状态
    if (pet.isDefault) {
      pet.isDefault = false;
      
      // 设置新的首发精灵（背包中的第一只）
      const bagPets = this.PetData.GetPetsInBag();
      if (bagPets.length > 0) {
        bagPets[0].isDefault = true;
      }
    }

    // 获取新的首发精灵的 catchTime
    const defaultPet = this.PetData.PetList.find(p => p.isDefault);
    const firstPetTime = defaultPet ? defaultPet.catchTime : 0;

    await DatabaseHelper.Instance.SavePetData(this.PetData);
    await this.Player.SendPacket(new PacketPetRelease(0, firstPetTime, 0));
    Logger.Info(`[PetManager] 将精灵放到仓库: UserID=${this.UserID}, CatchTime=${catchTime}, NewDefaultCatchTime=${firstPetTime}`);
  }

  /**
   * 处理将精灵放入背包（从仓库取出，或确认获得新精灵）
   */
  public async HandlePetTakeOut(catchTime: number): Promise<void> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (!pet) {
      Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
      return;
    }

    // 检查背包是否已满
    const bagCount = this.PetData.GetPetsInBag().length;
    if (!pet.isInBag && bagCount >= 6) {
      Logger.Warn(`[PetManager] 背包已满: UserID=${this.UserID}, BagCount=${bagCount}`);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
      return;
    }

    // 如果精灵在仓库中，将其移到背包
    if (!pet.isInBag) {
      pet.isInBag = true;
      Logger.Info(`[PetManager] 将精灵从仓库取回背包: UserID=${this.UserID}, CatchTime=${catchTime}, PetId=${pet.petId}`);
    } else {
      Logger.Info(`[PetManager] 确认精灵在背包中: UserID=${this.UserID}, CatchTime=${catchTime}, PetId=${pet.petId}`);
    }

    // 获取当前首发精灵的 catchTime
    const defaultPet = this.PetData.PetList.find(p => p.isDefault);
    const firstPetTime = defaultPet ? defaultPet.catchTime : 0;

    // 发送确认响应（包含精灵信息）
    const petProto = this.petInfoToProto(pet);
    await this.Player.SendPacket(new PacketPetRelease(0, firstPetTime, 1, petProto));
    Logger.Info(`[PetManager] 取回精灵响应: UserID=${this.UserID}, PetCatchTime=${catchTime}, FirstPetTime=${firstPetTime}`);
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
   * 
   * 优化：设置首发时直接调整数组顺序，确保首发精灵在第一位
   * 这样登录和其他地方就不需要额外排序了
   */
  public async HandlePetDefault(catchTime: number): Promise<void> {
    const pet = this.PetData.GetPetByCatchTime(catchTime);
    
    if (pet && pet.isInBag) {
      // 1. 清除其他精灵的首发标记
      this.PetData.PetList.forEach(p => p.isDefault = false);
      
      // 2. 设置当前精灵为首发
      pet.isDefault = true;
      
      // 3. 调整数组顺序：将首发精灵移到背包精灵的第一位
      // 找到所有背包精灵的索引
      const bagIndices: number[] = [];
      this.PetData.PetList.forEach((p, index) => {
        if (p.isInBag) {
          bagIndices.push(index);
        }
      });
      
      // 找到首发精灵在数组中的位置
      const defaultPetIndex = this.PetData.PetList.findIndex(p => p.catchTime === catchTime);
      
      if (defaultPetIndex !== -1 && bagIndices.length > 0) {
        // 如果首发精灵不在第一个背包位置，则移动它
        const firstBagIndex = bagIndices[0];
        if (defaultPetIndex !== firstBagIndex) {
          // 从原位置移除
          const [defaultPet] = this.PetData.PetList.splice(defaultPetIndex, 1);
          // 插入到第一个背包位置
          this.PetData.PetList.splice(firstBagIndex, 0, defaultPet);
          
          Logger.Debug(
            `[PetManager] 调整精灵顺序: PetId=${pet.petId} 从索引${defaultPetIndex}移到${firstBagIndex}`
          );
        }
      }
      
      // BaseData 自动保存（包括数组顺序的变化）
      
      await this.Player.SendPacket(new PacketPetDefault());
      Logger.Info(`[PetManager] 设置首发精灵: UserID=${this.UserID}, PetId=${pet.petId}, CatchTime=${catchTime}`);
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_DEFAULT).setResult(5001));
      Logger.Warn(`[PetManager] 设置首发精灵失败: UserID=${this.UserID}, CatchTime=${catchTime}`);
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
    const result = this.checkLevelUp(pet);
    const levelUp = result.newSkills.length > 0 || result.evolved;
    
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
    
    const oldLevel = pet.level;
    pet.exp += expAmount;
    const result = this.checkLevelUp(pet);
    const levelUp = pet.level > oldLevel;
    
    // 自动触发保存（通过深度 Proxy）
    Logger.Info(`[PetManager] 精灵获得经验: CatchTime=${catchTime}, PetId=${pet.petId}, Exp=${expAmount}, LevelUp=${levelUp}, NewLevel=${pet.level}`);
    
    return levelUp;
  }

  /**
   * 检查并处理升级（包括自动进化）
   * @returns { newSkills: 新学会的技能ID列表, evolved: 是否进化 }
   */
  private checkLevelUp(pet: IPetInfo): { newSkills: number[]; evolved: boolean } {
    const newSkills: number[] = [];
    let evolved = false;
    
    // pet.exp 是当前等级内的经验
    while (pet.exp >= PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId) && pet.level < 100) {
      // 扣除升级所需经验
      const requiredExp = PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId);
      pet.exp -= requiredExp;
      
      // 升级
      pet.level++;
      this.recalculateStats(pet);
      
      Logger.Debug(`[PetManager] 精灵升级: PetId=${pet.petId}, NewLevel=${pet.level}, RemainingExp=${pet.exp}`);
      
      // 检查是否需要自动进化（EvolvFlag=0 表示直接进化）
      const evolvesTo = SptSystem.GetEvolvesTo(pet.petId);
      const evolvingLevel = SptSystem.GetEvolvingLevel(pet.petId);
      
      Logger.Debug(`[PetManager] 检查进化: PetId=${pet.petId}, Level=${pet.level}, EvolvesTo=${evolvesTo}, EvolvingLevel=${evolvingLevel}`);
      
      if (evolvesTo > 0 && pet.level >= evolvingLevel) {
        const oldPetId = pet.petId;
        pet.petId = evolvesTo;
        this.recalculateStats(pet);
        evolved = true;
        Logger.Info(`[PetManager] 精灵自动进化: OldPetId=${oldPetId}, NewPetId=${evolvesTo}, Level=${pet.level}`);
      }
      
      // 检查是否学会新技能（使用进化后的petId）
      const learnedMoves = SptSystem.GetNewMovesOnLevelUp(pet.petId, pet.level);
      for (const move of learnedMoves) {
        newSkills.push(move.id);
        Logger.Info(`[PetManager] 精灵学会新技能: PetId=${pet.petId}, Level=${pet.level}, SkillId=${move.id}`);
      }
    }
    
    return { newSkills, evolved };
  }

  /**
   * 重新计算属性
   * 使用 PetCalculator 的正确计算方法，包含种族值和性格修正
   */
  private recalculateStats(pet: IPetInfo): void {
    PetCalculator.UpdatePetStats(pet);
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
      
      // 背包满时自动放入仓库
      if (bagSpace <= 0) {
        newPet.isInBag = false;
        Logger.Info(`[PetManager] 背包满，将精灵放入仓库: UserId=${this.UserID}, PetId=${petId}`);
      }
      
      // Add to bag or storage
      Logger.Debug(`[PetManager] 添加前 PetList 长度: ${this.PetData.PetList.length}`);
      Logger.Debug(`[PetManager] PetData 对象 Uid: ${this.PetData.Uid}`);
      Logger.Debug(`[PetManager] PetData 对象引用: ${typeof this.PetData}`);
      
      await this.PetData.AddPet(newPet);
      
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
    proto.lvExp = 0; // 当前等级的基础经验（总是0，因为pet.exp存储的是当前等级内的经验）
    proto.nextLvExp = PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId); // 升到下一级所需的经验
    
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
    
    proto.skills = pet.skillArray.map(skillId => {
      const skillConfig = GameConfig.GetSkillById(skillId);
      const maxPP = skillConfig?.MaxPP || 20;
      return {
        id: skillId,
        pp: maxPP,      // 当前PP（满值）
        maxPp: maxPP    // 最大PP
      };
    });
    
    proto.catchTime = pet.catchTime;
    proto.catchMap = 0;
    proto.catchRect = 0;
    proto.catchLevel = pet.obtainLevel;
    // 特性列表
    proto.effects = (pet.effectList || []).map(e => {
      const args = (e.args || '').split(' ').map(Number);
      const effect = {
        itemId: e.itemId || 0,
        status: e.status || 2,
        leftCount: e.leftCount === -1 ? 255 : (e.leftCount || 0),
        effectID: e.effectID || 0,
        arg1: args[0] || 0,
        arg2: args[1] || 0
      };
      Logger.Debug(`[PetManager] 构建特性: effectID=${effect.effectID}, itemId=${effect.itemId}, status=${effect.status}, leftCount=${effect.leftCount}, arg1=${effect.arg1}, arg2=${effect.arg2}`);
      return effect;
    });
    proto.skinID = 0;
    
    Logger.Debug(`[PetManager] 精灵 ${pet.petId} 特性数量: ${proto.effects.length}`);
    
    return proto;
  }

  /**
   * 发送 NOTE_UPDATE_PROP 推送（触发经验获得弹窗）
   * @param pets 更新的精灵列表
   * @param addition 加成百分比 * 100（例如 150 表示 1.5 倍）
   */
  private async sendNoteUpdateProp(pets: IPetInfo[], addition: number = 0): Promise<void> {
    const updateInfos: IUpdatePropInfo[] = pets.map(pet => ({
      catchTime: pet.catchTime,
      id: pet.petId,
      level: pet.level,
      exp: pet.exp, // 当前等级已获得的经验
      currentLvExp: 0, // 当前等级的基础经验（总是0）
      nextLvExp: PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId), // 升到下一级所需的经验
      maxHp: pet.maxHp,
      attack: pet.atk,
      defence: pet.def,
      sa: pet.spAtk,
      sd: pet.spDef,
      sp: pet.speed,
      ev_hp: pet.evHp,
      ev_a: pet.evAtk,
      ev_d: pet.evDef,
      ev_sa: pet.evSpAtk,
      ev_sd: pet.evSpDef,
      ev_sp: pet.evSpeed
    }));

    await this.Player.SendPacket(new PacketNoteUpdateProp(addition, updateInfos));
  }

  /**
   * 发送 NOTE_UPDATE_SKILL 推送（触发技能学习界面）
   * @param pet 精灵信息
   * @param newSkills 新学会的技能ID列表
   */
  private async sendNoteUpdateSkill(pet: IPetInfo, newSkills: number[]): Promise<void> {
    if (newSkills.length === 0) {
      return;
    }

    // 区分 activeSkills 和 unactiveSkills
    const activeSkills: number[] = [];
    const unactiveSkills: number[] = [];

    // 如果技能槽未满（< 4），新技能是 activeSkills（直接学习）
    if (pet.skillArray.length < 4) {
      // 自动添加到技能槽（会触发自动保存）
      for (const skillId of newSkills) {
        if (pet.skillArray.length < 4) {
          pet.skillArray.push(skillId);
          activeSkills.push(skillId);
          Logger.Info(`[PetManager] 自动学习技能: PetId=${pet.petId}, SkillId=${skillId}`);
        } else {
          // 技能槽已满，剩余技能需要替换
          unactiveSkills.push(skillId);
        }
      }
      
      // 触发保存：重新赋值数组以触发 Proxy
      // 注意：push() 操作会触发 Proxy，但为了保险起见，重新赋值确保保存
      pet.skillArray = [...pet.skillArray];
    } else {
      // 如果技能槽已满（= 4），新技能是 unactiveSkills（需要替换）
      unactiveSkills.push(...newSkills);
    }

    const updateInfos: IUpdateSkillInfo[] = [{
      catchTime: pet.catchTime,
      activeSkills: activeSkills,
      unactiveSkills: unactiveSkills
    }];

    await this.Player.SendPacket(new PacketNoteUpdateSkill(updateInfos));
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

      Logger.Info(`[PetManager] 分配经验前: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, Exp=${pet.exp}, AllocExp=${this.Player.Data.allocatableExp}`);

      // 2. 验证经验值有效
      if (expAmount <= 0) {
        Logger.Warn(`[PetManager] 经验值无效: UserID=${this.UserID}, ExpAmount=${expAmount}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5001));
        return;
      }

      // 3. 验证可分配经验足够
      if (this.Player.Data.allocatableExp < expAmount) {
        Logger.Warn(`[PetManager] 可分配经验不足: UserID=${this.UserID}, Need=${expAmount}, Have=${this.Player.Data.allocatableExp}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(10016));
        return;
      }

      // 4. 验证精灵未满级
      if (pet.level >= 100) {
        Logger.Warn(`[PetManager] 精灵已满级: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5001));
        return;
      }

      // 5. 记录初始经验
      const initialExp = pet.exp;
      const oldLevel = pet.level;

      // 6. 增加精灵经验并检查升级
      pet.exp += expAmount;
      const result = this.checkLevelUp(pet);
      const newLevel = pet.level;

      // 7. 计算实际消耗的经验（如果满级，剩余经验会留在 pet.exp 中）
      let actualUsedExp = expAmount;
      if (pet.level >= 100) {
        // 精灵满级，计算实际使用的经验
        // 满级后 pet.exp 应该为 0，多余的经验需要返还
        const excessExp = pet.exp;
        actualUsedExp = expAmount - excessExp;
        pet.exp = 0; // 满级精灵经验归零
        Logger.Info(`[PetManager] 精灵满级，返还剩余经验: ExcessExp=${excessExp}, ActualUsed=${actualUsedExp}`);
      }

      // 8. 扣除实际消耗的可分配经验（自动保存）
      this.Player.Data.allocatableExp -= actualUsedExp;

      Logger.Info(`[PetManager] 分配经验后: UserID=${this.UserID}, PetId=${pet.petId}, Level=${newLevel}, Exp=${pet.exp}, AllocExp=${this.Player.Data.allocatableExp}, UsedExp=${actualUsedExp}`);

      // 9. 推送 NOTE_UPDATE_PROP (2508) 触发经验获得弹窗（和进化动画）
      await this.sendNoteUpdateProp([pet], 0);
      Logger.Info(`[PetManager] 推送 NOTE_UPDATE_PROP: PetId=${pet.petId}, OldLevel=${oldLevel}, NewLevel=${newLevel}, Evolved=${result.evolved}`);

      // 10. 如果学会了新技能，推送 NOTE_UPDATE_SKILL (2507)
      if (result.newSkills.length > 0) {
        await this.sendNoteUpdateSkill(pet, result.newSkills);
        Logger.Info(`[PetManager] 推送 NOTE_UPDATE_SKILL: PetId=${pet.petId}, NewSkills=[${result.newSkills.join(', ')}]`);
      }

      // 11. 发送成功响应（只返回经验池剩余经验，4字节）
      // 注意：根据抓包分析，响应必须在推送之后发送
      await this.Player.SendPacket(new PacketPetSetExp(this.Player.Data.allocatableExp));
      Logger.Info(`[PetManager] 发送 PET_SET_EXP 响应: RemainingAllocExp=${this.Player.Data.allocatableExp}`);
    } catch (error) {
      Logger.Error(`[PetManager] HandlePetSetExp failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SET_EXP).setResult(5000));
    }
  }

  /**
   * 处理精灵进化
   * @param catchTime 精灵捕获时间
   * @param evolveIndex 进化索引（通常为1）
   */
  public async HandlePetEvolution(catchTime: number, evolveIndex: number): Promise<void> {
    try {
      // 1. 验证精灵存在
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_EVOLVTION).setResult(5001));
        return;
      }

      // 2. 检查是否可以进化
      const evolvesTo = SptSystem.GetEvolvesTo(pet.petId);
      if (!evolvesTo || evolvesTo === 0) {
        Logger.Warn(`[PetManager] 精灵无法进化: UserID=${this.UserID}, PetId=${pet.petId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_EVOLVTION).setResult(5001));
        return;
      }

      // 3. 检查等级是否满足
      const evolvingLevel = SptSystem.GetEvolvingLevel(pet.petId);
      if (pet.level < evolvingLevel) {
        Logger.Warn(`[PetManager] 精灵等级不足: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, Required=${evolvingLevel}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_EVOLVTION).setResult(5001));
        return;
      }

      Logger.Info(`[PetManager] 精灵进化前: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, OldCatchTime=${pet.catchTime}`);

      // 4. 执行进化
      const oldPetId = pet.petId;
      const oldCatchTime = pet.catchTime;
      pet.petId = evolvesTo;
      
      // 更新 catchTime 为当前时间（进化时间）
      pet.catchTime = Math.floor(Date.now() / 1000);
      Logger.Info(`[PetManager] 更新 catchTime: OldCatchTime=${oldCatchTime}, NewCatchTime=${pet.catchTime}`);

      // 5. 重新计算属性（进化后种族值可能改变）
      this.recalculateStats(pet);

      // 6. 检查进化后是否学会新技能
      const newSkills: number[] = [];
      const learnedMoves = SptSystem.GetNewMovesOnLevelUp(pet.petId, pet.level);
      for (const move of learnedMoves) {
        newSkills.push(move.id);
        Logger.Info(`[PetManager] 进化后学会新技能: PetId=${pet.petId}, Level=${pet.level}, SkillId=${move.id}`);
      }

      // 7. 自动触发保存（通过深度 Proxy）

      Logger.Info(`[PetManager] 精灵进化成功: UserID=${this.UserID}, OldPetId=${oldPetId}, NewPetId=${evolvesTo}, Level=${pet.level}, NewSkills=${newSkills.length}`);

      // 8. 发送成功响应
      await this.Player.SendPacket(new PacketPetEvolution(0));

      // 9. 推送 NOTE_UPDATE_PROP (2508) 触发进化动画和弹窗
      // 注意：客户端 EvolvePetPanel 监听此消息来播放进化动画
      await this.sendNoteUpdateProp([pet], 0);
      Logger.Info(`[PetManager] 推送 NOTE_UPDATE_PROP: OldPetId=${oldPetId}, NewPetId=${evolvesTo}`);

      // 10. 如果进化后学会了新技能，推送 NOTE_UPDATE_SKILL (2507)
      if (newSkills.length > 0) {
        await this.sendNoteUpdateSkill(pet, newSkills);
        Logger.Info(`[PetManager] 推送 NOTE_UPDATE_SKILL: PetId=${pet.petId}, NewSkills=[${newSkills.join(', ')}]`);
      }
    } catch (error) {
      Logger.Error(`[PetManager] HandlePetEvolution failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_EVOLVTION).setResult(5000));
    }
  }

  /**
   * 处理精灵学习技能（替换技能）
   * @param catchTime 精灵捕获时间
   * @param skillId 要学习的技能ID
   * @param slotIndex 要替换的技能槽位置 (0-3)
   */
  public async HandleStudySkill(catchTime: number, skillId: number, slotIndex: number): Promise<void> {
    try {
      // 1. 验证精灵存在
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5001));
        return;
      }

      // 2. 验证技能槽位置有效 (0-3)
      if (slotIndex < 0 || slotIndex > 3) {
        Logger.Warn(`[PetManager] 技能槽位置无效: UserID=${this.UserID}, SlotIndex=${slotIndex}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5001));
        return;
      }

      // 3. 验证技能ID有效
      if (skillId <= 0) {
        Logger.Warn(`[PetManager] 技能ID无效: UserID=${this.UserID}, SkillId=${skillId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5001));
        return;
      }

      // 4. 检查精灵是否已经拥有该技能
      if (pet.skillArray.includes(skillId)) {
        Logger.Warn(`[PetManager] 精灵已拥有该技能: UserID=${this.UserID}, PetId=${pet.petId}, SkillId=${skillId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5002));
        return;
      }

      // 5. 记录旧技能
      const oldSkillId = pet.skillArray[slotIndex] || 0;

      // 6. 替换技能
      pet.skillArray[slotIndex] = skillId;
      
      // 7. 触发保存：重新赋值数组以触发 Proxy
      // 注意：直接修改数组元素不会触发 BaseData 的 Proxy，需要重新赋值整个数组
      pet.skillArray = [...pet.skillArray];

      Logger.Info(
        `[PetManager] 精灵学习技能成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
        `SlotIndex=${slotIndex}, OldSkill=${oldSkillId}, NewSkill=${skillId}`
      );

      // 8. 发送成功响应
      await this.Player.SendPacket(new PacketStudySkill());
    } catch (error) {
      Logger.Error(`[PetManager] HandleStudySkill failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_STUDY_SKILL).setResult(5000));
    }
  }

  /**
   * 处理精灵技能切换（用新技能替换旧技能）
   * @param catchTime 精灵捕获时间
   * @param slot1 未使用
   * @param slot2 未使用
   * @param oldSkillId 旧技能ID - 要被替换的技能
   * @param newSkillId 新技能ID - 要学习的新技能
   */
  public async HandleSkillSwitch(
    catchTime: number, 
    slot1: number, 
    slot2: number, 
    oldSkillId: number, 
    newSkillId: number
  ): Promise<void> {
    try {
      // 1. 验证精灵存在
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      // 2. 查找旧技能在技能数组中的索引
      const oldSkillIndex = pet.skillArray.indexOf(oldSkillId);
      if (oldSkillIndex === -1) {
        Logger.Warn(
          `[PetManager] 旧技能不存在: UserID=${this.UserID}, ` +
          `OldSkillId=${oldSkillId}, SkillArray=[${pet.skillArray.join(',')}]`
        );
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      // 3. 验证新技能不能是已装备的技能
      if (pet.skillArray.includes(newSkillId)) {
        Logger.Warn(
          `[PetManager] 新技能已装备: UserID=${this.UserID}, SkillId=${newSkillId}, ` +
          `SkillArray=[${pet.skillArray.join(',')}]`
        );
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      // 4. 验证新技能是否可学习
      const petConfig = GameConfig.GetPetById(pet.petId);
      if (!petConfig) {
        Logger.Warn(`[PetManager] 精灵配置不存在: PetId=${pet.petId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      // 构建技能ID到学习等级的映射
      const skillLevelMap = new Map<number, number>();
      if (petConfig.LearnableMoves?.Move) {
        const moves = Array.isArray(petConfig.LearnableMoves.Move) 
          ? petConfig.LearnableMoves.Move 
          : [petConfig.LearnableMoves.Move];
        
        for (const move of moves) {
          skillLevelMap.set(move.ID, move.LearningLv);
        }
      }

      const learnLevel = skillLevelMap.get(newSkillId);
      if (learnLevel === undefined) {
        Logger.Warn(`[PetManager] 新技能不在可学习列表中: SkillId=${newSkillId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      if (pet.level < learnLevel) {
        Logger.Warn(
          `[PetManager] 精灵等级不足: Level=${pet.level}, Required=${learnLevel}, SkillId=${newSkillId}`
        );
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5001));
        return;
      }

      // 5. 替换技能
      pet.skillArray[oldSkillIndex] = newSkillId;

      // 6. 触发保存：重新赋值数组以触发 Proxy
      pet.skillArray = [...pet.skillArray];

      Logger.Info(
        `[PetManager] 精灵技能替换成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
        `Index=${oldSkillIndex}, OldSkill=${oldSkillId}, NewSkill=${newSkillId}`
      );

      // 7. 发送成功响应
      await this.Player.SendPacket(new PacketSkillSwitch(pet.petId));
    } catch (error) {
      Logger.Error(`[PetManager] HandleSkillSwitch failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SKILL_SWICTH).setResult(5000));
    }
  }

  /**
   * 处理恢复单个精灵HP
   * CMD 2310: PET_ONE_CURE
   * 
   * 功能：
   * - 恢复精灵HP到满值
   * - 非VIP用户扣除20赛尔豆
   * - VIP用户免费
   * 
   * 注意：客户端会自动恢复技能PP，服务器端不需要处理
   */
  public async HandlePetOneCure(catchTime: number, clientCoins: number = 0): Promise<void> {
    try {
      Logger.Debug(`[PetManager] HandlePetOneCure: UserID=${this.UserID}, CatchTime=${catchTime}`);
      Logger.Debug(`[PetManager] 当前精灵列表: ${JSON.stringify(this.PetData.PetList.map(p => ({ petId: p.petId, catchTime: p.catchTime, hp: p.hp })))}`);

      // 1. 查找精灵
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_ONE_CURE).setResult(5001));
        return;
      }

      Logger.Debug(`[PetManager] 找到精灵: PetId=${pet.petId}, HP=${pet.hp}/${pet.maxHp}`);

      // 2. 检查是否需要恢复
      if (pet.hp >= pet.maxHp) {
        Logger.Debug(`[PetManager] 精灵HP已满: UserID=${this.UserID}, PetId=${pet.petId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_ONE_CURE).setResult(5002));
        return;
      }

      // 3. 计算费用（非VIP用户需要支付20赛尔豆）
      const isVip = this.Player.Data.vip > 0; // 假设vip字段表示VIP状态
      const cost = isVip ? 0 : 20;

      // 4. 检查赛尔豆是否足够
      if (!isVip && this.Player.Data.coins < cost) {
        Logger.Warn(`[PetManager] 赛尔豆不足: UserID=${this.UserID}, 需要=${cost}, 拥有=${this.Player.Data.coins}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.PET_ONE_CURE).setResult(10016)); // 10016: 赛尔豆不足
        return;
      }

      // 5. 扣除赛尔豆（非VIP）
      if (!isVip) {
        this.Player.Data.coins -= cost;
      }

      // 6. 恢复HP到满值
      pet.hp = pet.maxHp;

      Logger.Info(
        `[PetManager] 恢复精灵HP: UserID=${this.UserID}, PetId=${pet.petId}, ` +
        `HP=${pet.hp}/${pet.maxHp}, 消耗赛尔豆=${cost}, 剩余=${this.Player.Data.coins}, ` +
        `VIP=${isVip}, CatchTime=${catchTime}`
      );

      // 7. 发送成功响应（只发送catchTime，客户端会在本地更新HP和PP）
      await this.Player.SendPacket(new PacketPetOneCure(catchTime));
    } catch (error) {
      Logger.Error(`[PetManager] HandlePetOneCure failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_ONE_CURE).setResult(5000));
    }
  }

  /**
   * 处理技能排序
   * CMD: 2328 Skill_Sort
   * 
   * 功能：调整精灵技能槽的顺序
   * @param catchTime 精灵捕获时间
   * @param skill1 第1个技能ID
   * @param skill2 第2个技能ID
   * @param skill3 第3个技能ID
   * @param skill4 第4个技能ID
   */
  public async HandleSkillSort(
    catchTime: number,
    skill1: number,
    skill2: number,
    skill3: number,
    skill4: number
  ): Promise<void> {
    try {
      // 1. 验证精灵存在
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.Skill_Sort).setResult(5001));
        return;
      }

      // 2. 构建新的技能数组
      const newSkills = [skill1, skill2, skill3, skill4].filter(id => id > 0);

      // 3. 验证技能数量（必须是4个）
      if (newSkills.length !== 4) {
        Logger.Warn(
          `[PetManager] 技能数量无效: UserID=${this.UserID}, Count=${newSkills.length}, ` +
          `Skills=[${newSkills.join(',')}]`
        );
        await this.Player.SendPacket(new PacketEmpty(CommandID.Skill_Sort).setResult(5001));
        return;
      }

      // 4. 验证所有技能都在精灵的技能列表中
      const currentSkills = new Set(pet.skillArray);
      for (const skillId of newSkills) {
        if (!currentSkills.has(skillId)) {
          Logger.Warn(
            `[PetManager] 技能不属于该精灵: UserID=${this.UserID}, SkillId=${skillId}, ` +
            `CurrentSkills=[${pet.skillArray.join(',')}]`
          );
          await this.Player.SendPacket(new PacketEmpty(CommandID.Skill_Sort).setResult(5001));
          return;
        }
      }

      // 5. 验证没有重复的技能
      const uniqueSkills = new Set(newSkills);
      if (uniqueSkills.size !== newSkills.length) {
        Logger.Warn(
          `[PetManager] 技能列表包含重复: UserID=${this.UserID}, Skills=[${newSkills.join(',')}]`
        );
        await this.Player.SendPacket(new PacketEmpty(CommandID.Skill_Sort).setResult(5001));
        return;
      }

      // 6. 更新技能顺序
      const oldSkills = [...pet.skillArray];
      pet.skillArray = newSkills;

      Logger.Info(
        `[PetManager] 技能排序成功: UserID=${this.UserID}, PetId=${pet.petId}, ` +
        `OldSkills=[${oldSkills.join(',')}], NewSkills=[${newSkills.join(',')}]`
      );

      // 7. 发送成功响应（空包）
      await this.Player.SendPacket(new PacketSkillSort());
    } catch (error) {
      Logger.Error(`[PetManager] HandleSkillSort failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.Skill_Sort).setResult(5000));
    }
  }

  /**
   * 获取精灵技能
   * CMD: 2336
   * 只返回当前等级已学会的技能
   */
  public async HandleGetPetSkill(catchTime: number): Promise<void> {
    try {
      const pet = this.PetData.GetPetByCatchTime(catchTime);
      if (!pet) {
        Logger.Warn(`[PetManager] 精灵不存在: UserID=${this.UserID}, CatchTime=${catchTime}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_SKILL).setResult(5001));
        return;
      }

      // 获取精灵配置
      const petConfig = GameConfig.GetPetById(pet.petId);
      if (!petConfig) {
        Logger.Warn(`[PetManager] 精灵配置不存在: PetId=${pet.petId}`);
        await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_SKILL).setResult(5001));
        return;
      }

      // 构建技能ID到学习等级的映射
      const skillLevelMap = new Map<number, number>();
      if (petConfig.LearnableMoves?.Move) {
        const moves = Array.isArray(petConfig.LearnableMoves.Move) 
          ? petConfig.LearnableMoves.Move 
          : [petConfig.LearnableMoves.Move];
        
        for (const move of moves) {
          skillLevelMap.set(move.ID, move.LearningLv);
        }
      }

      // 获取已装备的技能集合
      const equippedSkills = new Set(pet.skillArray.filter(id => id > 0));

      // 获取所有可学习但未装备的技能（使用Set去重）
      const skillSet = new Set<number>();

      for (const [skillId, learnLevel] of skillLevelMap) {
        // 跳过已装备的技能
        if (equippedSkills.has(skillId)) {
          Logger.Debug(`[PetManager] 跳过已装备技能: SkillId=${skillId}`);
          continue;
        }

        // 检查等级是否满足
        if (pet.level >= learnLevel) {
          skillSet.add(skillId);
        } else {
          Logger.Debug(`[PetManager] 等级不足: SkillId=${skillId}, Required=${learnLevel}, Current=${pet.level}`);
        }
      }

      // 转换为数组
      const skills = Array.from(skillSet);

      await this.Player.SendPacket(new PacketGetPetSkill(skills));
      
      Logger.Info(
        `[PetManager] 获取精灵技能: UserID=${this.UserID}, PetId=${pet.petId}, Level=${pet.level}, ` +
        `SkillCount=${skills.length}, Skills=[${skills.join(',')}], ` +
        `Equipped=[${Array.from(equippedSkills).join(',')}]`
      );
    } catch (error) {
      Logger.Error(`[PetManager] HandleGetPetSkill failed`, error as Error);
      await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_SKILL).setResult(5000));
    }
  }
}
