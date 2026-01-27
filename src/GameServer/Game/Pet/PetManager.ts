import { BaseManager } from '../Base/BaseManager';
import { Logger } from '../../../shared/utils';
import { PlayerInstance } from '../Player/PlayerInstance';
import { PacketGetPetList, PacketGetPetInfo, PacketPetRelease, PacketPetShow, PacketPetCure, PacketPetDefault } from '../../Server/Packet/Send/Pet';
import { PacketEmpty } from '../../Server/Packet/Send/PacketEmpty';
import { CommandID } from '../../../shared/protocol/CommandID';
import { PetInfoService, PetBattleService, PetStorageService, PetSkillService } from './services';
import { IPetInfo } from '../../../shared/models/PetModel';
import { PetInfoProto } from '../../../shared/proto/common/PetInfoProto';
import { PetStudySkillReqProto } from '../../../shared/proto/packets/req/pet/PetStudySkillReqProto';
import { PetSkillSwitchReqProto } from '../../../shared/proto/packets/req/pet/PetSkillSwitchReqProto';
import { GetPetSkillReqProto } from '../../../shared/proto/packets/req/pet/GetPetSkillReqProto';
import { PetStudySkillRspProto } from '../../../shared/proto/packets/rsp/pet/PetStudySkillRspProto';
import { PetSkillSwitchRspProto } from '../../../shared/proto/packets/rsp/pet/PetSkillSwitchRspProto';
import { GetPetSkillRspProto } from '../../../shared/proto/packets/rsp/pet/GetPetSkillRspProto';

/**
 * 精灵管理器
 * 处理精灵相关的所有逻辑：获取精灵信息、精灵列表、治疗、展示等
 * 
 * 架构说明：
 * - Manager 负责协调各个 Service
 * - Service 使用 Player.PetRepo 访问数据库
 * - Manager 只处理请求转发和响应发送
 */
export class PetManager extends BaseManager {
  // 服务实例
  private _infoService: PetInfoService;
  private _battleService: PetBattleService;
  private _storageService: PetStorageService;
  private _skillService: PetSkillService;

  constructor(player: PlayerInstance) {
    super(player);
    
    // 初始化服务，传入 Player 实例
    this._infoService = new PetInfoService(player);
    this._battleService = new PetBattleService(player);
    this._storageService = new PetStorageService(player);
    this._skillService = new PetSkillService(player);
  }

  /**
   * 处理获取精灵列表
   * 复杂逻辑：从数据库读取所有精灵
   */
  public async HandleGetPetList(): Promise<void> {
    const pets = await this._infoService.GetPetsInBag(this.UserID);
    const petProtos = pets.map(pet => this.petInfoToProto(pet));
    
    await this.Player.SendPacket(new PacketGetPetList(petProtos));
    Logger.Info(`[PetManager] 获取精灵列表: UserID=${this.UserID}, Count=${pets.length}`);
  }

  /**
   * 处理获取精灵信息
   * 复杂逻辑：从数据库读取单个精灵详细信息
   */
  public async HandleGetPetInfo(petId: number): Promise<void> {
    const pet = await this._infoService.GetPetInfo(petId);
    
    if (pet) {
      const petProto = this.petInfoToProto(pet);
      await this.Player.SendPacket(new PacketGetPetInfo(petProto));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.GET_PET_INFO).setResult(5001));
    }
  }

  /**
   * 处理释放精灵
   * 复杂逻辑：验证并删除精灵
   */
  public async HandlePetRelease(petId: number): Promise<void> {
    const success = await this._infoService.ReleasePet(this.UserID, petId);
    
    if (success) {
      await this.Player.SendPacket(new PacketPetRelease(0, petId, 1));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_RELEASE).setResult(5001));
    }
  }

  /**
   * 处理展示精灵
   * 简单逻辑：展示精灵给其他玩家看
   */
  public async HandlePetShow(petId: number): Promise<void> {
    const pet = await this._infoService.GetPetInfo(petId);
    
    if (pet) {
      await this.Player.SendPacket(new PacketPetShow(this.UserID, pet.catchTime, pet.petId, 1, pet.dvHp, 0));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_SHOW).setResult(5001));
    }
  }

  /**
   * 处理治疗精灵
   * 复杂逻辑：恢复精灵HP
   */
  public async HandlePetCure(petId?: number): Promise<void> {
    let success = false;
    
    if (petId) {
      // 治疗单个精灵
      success = await this._battleService.CurePet(this.UserID, petId);
    } else {
      // 治疗所有精灵
      const curedCount = await this._battleService.CureAllPets(this.UserID);
      success = curedCount > 0;
    }
    
    if (success) {
      await this.Player.SendPacket(new PacketPetCure());
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_CURE).setResult(5001));
    }
  }

  /**
   * 处理设置首发精灵
   * 复杂逻辑：验证并设置首发精灵
   */
  public async HandlePetDefault(petId: number): Promise<void> {
    const success = await this._infoService.SetDefaultPet(this.UserID, petId);
    
    if (success) {
      await this.Player.SendPacket(new PacketPetDefault());
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_DEFAULT).setResult(5001));
    }
  }

  /**
   * 处理获取精灵仓库列表
   * 复杂逻辑：从数据库读取仓库中的精灵
   */
  public async HandlePetBargeList(): Promise<void> {
    const pets = await this._infoService.GetPetsInStorage(this.UserID);
    const petProtos = pets.map(pet => this.petInfoToProto(pet));
    
    await this.Player.SendPacket(new PacketGetPetList(petProtos));
    Logger.Info(`[PetManager] 获取仓库精灵列表: UserID=${this.UserID}, Count=${pets.length}`);
  }

  /**
   * 处理移动精灵到仓库
   * 复杂逻辑：验证并移动精灵
   */
  public async HandleMovePetToStorage(petId: number): Promise<void> {
    const success = await this._storageService.MoveToStorage(this.UserID, petId);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST).setResult(5001));
    }
  }

  /**
   * 处理移动精灵到背包
   * 复杂逻辑：验证背包空间并移动精灵
   */
  public async HandleMovePetToBag(petId: number): Promise<void> {
    const success = await this._storageService.MoveToBag(this.UserID, petId);
    
    if (success) {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST));
    } else {
      await this.Player.SendPacket(new PacketEmpty(CommandID.PET_BARGE_LIST).setResult(5001));
    }
  }

  /**
   * 处理增加精灵经验
   * 复杂逻辑：增加经验并处理升级
   */
  public async HandleAddPetExp(petId: number, expAmount: number): Promise<boolean> {
    const result = await this._battleService.AddExp(this.UserID, petId, expAmount);
    
    if (result) {
      Logger.Info(`[PetManager] 精灵获得经验: PetId=${petId}, Exp=${expAmount}, LevelUp=${result.levelUp}, NewLevel=${result.newLevel}`);
      return result.levelUp;
    }
    
    return false;
  }

  /**
   * 获取精灵数量信息
   */
  public async GetPetCount(): Promise<{ total: number; inBag: number }> {
    return await this._infoService.GetPetCount(this.UserID);
  }

  /**
   * 获取背包剩余空间
   */
  public async GetBagSpace(): Promise<number> {
    return await this._storageService.GetBagSpace(this.UserID);
  }

  /**
   * 将 IPetInfo 转换为 PetInfoProto
   */
  private petInfoToProto(pet: IPetInfo): PetInfoProto {
    const proto = new PetInfoProto();
    
    proto.id = pet.petId;
    proto.name = pet.nick || '';
    proto.dv = pet.dvHp;  // 简化：使用HP个体值代表总个体值
    proto.nature = pet.nature;
    proto.level = pet.level;
    proto.exp = pet.exp;
    proto.lvExp = this.calculateLvExp(pet.level);
    proto.nextLvExp = this.calculateLvExp(pet.level + 1);
    
    // 战斗属性
    proto.hp = pet.hp;
    proto.maxHp = pet.maxHp;
    proto.attack = pet.atk;
    proto.defence = pet.def;
    proto.s_a = pet.spAtk;
    proto.s_d = pet.spDef;
    proto.speed = pet.speed;
    
    // 努力值
    proto.ev_hp = pet.evHp;
    proto.ev_attack = pet.evAtk;
    proto.ev_defence = pet.evDef;
    proto.ev_sa = pet.evSpAtk;
    proto.ev_sd = pet.evSpDef;
    proto.ev_sp = pet.evSpeed;
    
    // 技能列表
    proto.skills = pet.skillArray.map(skillId => ({
      id: skillId,
      pp: 20,
      maxPp: 20
    }));
    
    // 捕获信息
    proto.catchTime = pet.catchTime;
    proto.catchMap = 0;
    proto.catchRect = 0;
    proto.catchLevel = pet.obtainLevel;
    
    // 效果和皮肤
    proto.effects = [];
    proto.skinID = 0;
    
    return proto;
  }

  /**
   * 计算等级经验值
   */
  private calculateLvExp(level: number): number {
    // 简化公式：level * 100
    return level * 100;
  }

  /**
   * 赠送精灵（用于邮件附件、任务奖励等）
   * 
   * @param petId 精灵ID（种族ID）
   * @returns 是否成功
   */
  public async GivePet(petId: number): Promise<boolean> {
    try {
      // 检查背包空间
      const bagSpace = await this.GetBagSpace();
      if (bagSpace <= 0) {
        Logger.Warn(`[PetManager] 背包已满，无法赠送精灵: UserId=${this.UserID}, PetId=${petId}`);
        return false;
      }

      // 使用 PetInfoService 创建精灵
      const success = await this._infoService.CreatePet(this.UserID, petId);
      
      if (success) {
        Logger.Info(`[PetManager] 赠送精灵成功: UserId=${this.UserID}, PetId=${petId}`);
      } else {
        Logger.Warn(`[PetManager] 赠送精灵失败: UserId=${this.UserID}, PetId=${petId}`);
      }
      
      return success;
    } catch (error) {
      Logger.Error(`[PetManager] 赠送精灵异常: ${error}`);
      return false;
    }
  }

  /**
   * 处理精灵学习技能
   * 复杂逻辑：验证技能、槽位，更新数据库
   */
  public async HandleStudySkill(userId: number, req: PetStudySkillReqProto): Promise<void> {
    const success = await this._skillService.LearnSkill(userId, req.petId, req.skillId, req.slotIndex);
    
    if (success) {
      await this.Player.SendPacket(
        new PetStudySkillRspProto()
          .setResult(0)
          .setPetId(req.petId)
          .setSkillId(req.skillId)
          .setSlotIndex(req.slotIndex)
      );
      Logger.Info(`[PetManager] 精灵学习技能: PetId=${req.petId}, SkillId=${req.skillId}, Slot=${req.slotIndex}`);
    } else {
      await this.Player.SendPacket(new PetStudySkillRspProto().setResult(5001));
    }
  }

  /**
   * 处理精灵技能切换
   * 复杂逻辑：交换技能槽位置
   */
  public async HandleSkillSwitch(userId: number, req: PetSkillSwitchReqProto): Promise<void> {
    const success = await this._skillService.SwitchSkills(userId, req.petId, req.slot1, req.slot2);
    
    if (success) {
      await this.Player.SendPacket(
        new PetSkillSwitchRspProto()
          .setResult(0)
          .setPetId(req.petId)
      );
      Logger.Info(`[PetManager] 切换技能: PetId=${req.petId}, Slot1=${req.slot1}, Slot2=${req.slot2}`);
    } else {
      await this.Player.SendPacket(new PetSkillSwitchRspProto().setResult(5001));
    }
  }

  /**
   * 处理获取精灵技能
   * 复杂逻辑：从数据库读取技能列表
   */
  public async HandleGetSkills(userId: number, req: GetPetSkillReqProto): Promise<void> {
    const skills = await this._skillService.GetPetSkills(userId, req.petId);
    
    await this.Player.SendPacket(
      new GetPetSkillRspProto()
        .setResult(0)
        .setPetId(req.petId)
        .setSkills(skills)
    );
    Logger.Info(`[PetManager] 获取精灵技能: PetId=${req.petId}, SkillCount=${skills.length}`);
  }
}

