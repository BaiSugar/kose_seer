import { Logger } from '../../../../shared/utils';
import { IPetInfo } from '../../../../shared/models/PetModel';
import { PlayerInstance } from '../../Player/PlayerInstance';

/**
 * 精灵信息服务
 * 负责精灵信息的查询和基础操作
 */
export class PetInfoService {
  private _player: PlayerInstance;

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 获取精灵信息
   */
  public async GetPetInfo(petId: number): Promise<IPetInfo | null> {
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet) {
      Logger.Warn(`[PetInfoService] 精灵不存在: PetId=${petId}`);
      return null;
    }
    return pet;
  }

  /**
   * 获取玩家的所有精灵
   */
  public async GetAllPets(userId: number): Promise<IPetInfo[]> {
    const pets = await this._player.PetRepo.FindByUserId();
    Logger.Info(`[PetInfoService] 获取玩家精灵列表: UserID=${userId}, Count=${pets.length}`);
    return pets;
  }

  /**
   * 获取背包中的精灵
   */
  public async GetPetsInBag(userId: number): Promise<IPetInfo[]> {
    const pets = await this._player.PetRepo.FindInBag();
    Logger.Info(`[PetInfoService] 获取背包精灵: UserID=${userId}, Count=${pets.length}`);
    return pets;
  }

  /**
   * 获取仓库中的精灵
   */
  public async GetPetsInStorage(userId: number): Promise<IPetInfo[]> {
    const pets = await this._player.PetRepo.FindInStorage();
    Logger.Info(`[PetInfoService] 获取仓库精灵: UserID=${userId}, Count=${pets.length}`);
    return pets;
  }

  /**
   * 获取首发精灵
   */
  public async GetDefaultPet(userId: number): Promise<IPetInfo | null> {
    const pet = await this._player.PetRepo.FindDefault();
    if (!pet) {
      Logger.Warn(`[PetInfoService] 玩家没有首发精灵: UserID=${userId}`);
      return null;
    }
    return pet;
  }

  /**
   * 设置首发精灵
   */
  public async SetDefaultPet(userId: number, petId: number): Promise<boolean> {
    // 验证精灵
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetInfoService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 验证精灵是否在背包中
    if (!pet.isInBag) {
      Logger.Warn(`[PetInfoService] 精灵不在背包中，无法设为首发: PetId=${petId}`);
      return false;
    }

    const success = await this._player.PetRepo.SetDefault(petId);
    if (success) {
      Logger.Info(`[PetInfoService] 设置首发精灵成功: UserID=${userId}, PetId=${petId}`);
    } else {
      Logger.Error(`[PetInfoService] 设置首发精灵失败: UserID=${userId}, PetId=${petId}`);
    }

    return success;
  }

  /**
   * 释放精灵
   */
  public async ReleasePet(userId: number, petId: number): Promise<boolean> {
    // 验证精灵是否属于该玩家
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetInfoService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 不能释放首发精灵
    if (pet.isDefault) {
      Logger.Warn(`[PetInfoService] 不能释放首发精灵: PetId=${petId}`);
      return false;
    }

    const success = await this._player.PetRepo.Release(petId);
    if (success) {
      Logger.Info(`[PetInfoService] 释放精灵成功: UserID=${userId}, PetId=${petId}`);
    } else {
      Logger.Error(`[PetInfoService] 释放精灵失败: UserID=${userId}, PetId=${petId}`);
    }

    return success;
  }

  /**
   * 修改精灵昵称
   */
  public async ChangePetNick(userId: number, petId: number, newNick: string): Promise<boolean> {
    // 验证精灵是否属于该玩家
    const pet = await this._player.PetRepo.FindPetById(petId);
    if (!pet || pet.userId !== userId) {
      Logger.Warn(`[PetInfoService] 精灵不属于该玩家: UserID=${userId}, PetId=${petId}`);
      return false;
    }

    // 验证昵称长度
    if (newNick.length > 16) {
      Logger.Warn(`[PetInfoService] 精灵昵称过长: PetId=${petId}, Nick=${newNick}`);
      return false;
    }

    const success = await this._player.PetRepo.UpdateNick(petId, newNick);
    if (success) {
      Logger.Info(`[PetInfoService] 修改精灵昵称成功: PetId=${petId}, NewNick=${newNick}`);
    } else {
      Logger.Error(`[PetInfoService] 修改精灵昵称失败: PetId=${petId}`);
    }

    return success;
  }

  /**
   * 获取精灵数量
   */
  public async GetPetCount(userId: number): Promise<{ total: number; inBag: number }> {
    const total = await this._player.PetRepo.CountByUserId();
    const inBag = await this._player.PetRepo.CountInBag();
    
    return { total, inBag };
  }

  /**
   * 创建精灵（用于邮件附件、任务奖励等）
   * 
   * @param userId 玩家ID
   * @param petId 精灵种族ID
   * @returns 是否成功
   */
  public async CreatePet(userId: number, petId: number): Promise<boolean> {
    try {
      // 导入必要的模块
      const { createDefaultPetInfo } = await import('../../../../shared/models/PetModel');
      const { PetCalculator } = await import('../PetCalculator');
      const { SptSystem } = await import('../SptSystem');
      const { GameConfig } = await import('../../../../shared/config');

      // 检查精灵种族是否存在
      const petConfig = GameConfig.GetPetById(petId);
      if (!petConfig) {
        Logger.Warn(`[PetInfoService] 精灵种族不存在: PetId=${petId}`);
        return false;
      }

      // 创建默认精灵信息
      const petInfo = createDefaultPetInfo(userId, petId);
      
      // 设置捕获时间
      petInfo.catchTime = Math.floor(Date.now() / 1000);
      petInfo.obtainTime = petInfo.catchTime;
      petInfo.obtainWay = 2; // 2 = 系统赠送
      petInfo.obtainLevel = 1;
      
      // 生成随机个体值和性格
      const dvs = PetCalculator.GenerateRandomDVs();
      petInfo.dvHp = dvs.hp;
      petInfo.dvAtk = dvs.atk;
      petInfo.dvDef = dvs.def;
      petInfo.dvSpAtk = dvs.spAtk;
      petInfo.dvSpDef = dvs.spDef;
      petInfo.dvSpeed = dvs.speed;
      petInfo.nature = PetCalculator.GenerateRandomNature();
      
      // 计算初始属性
      const stats = PetCalculator.CalculateAllStats(
        petInfo.petId,
        petInfo.level,
        petInfo.exp,
        petInfo.nature,
        {
          hp: petInfo.dvHp,
          atk: petInfo.dvAtk,
          def: petInfo.dvDef,
          spAtk: petInfo.dvSpAtk,
          spDef: petInfo.dvSpDef,
          speed: petInfo.dvSpeed
        },
        {
          hp: petInfo.evHp,
          atk: petInfo.evAtk,
          def: petInfo.evDef,
          spAtk: petInfo.evSpAtk,
          spDef: petInfo.evSpDef,
          speed: petInfo.evSpeed
        }
      );
      petInfo.maxHp = stats.hp;
      petInfo.hp = stats.hp;
      petInfo.atk = stats.atk;
      petInfo.def = stats.def;
      petInfo.spAtk = stats.spAtk;
      petInfo.spDef = stats.spDef;
      petInfo.speed = stats.speed;
      
      // 获取默认技能
      const defaultSkills = SptSystem.GetDefaultSkills(petId, petInfo.level);
      petInfo.skillArray = defaultSkills.map(skill => skill.id).slice(0, 4); // 最多4个技能
      
      // 设置为在背包中
      petInfo.isInBag = true;
      petInfo.isDefault = false;
      
      // 获取背包中的精灵数量，设置位置
      const inBagCount = await this._player.PetRepo.CountInBag();
      petInfo.position = inBagCount;
      
      // 创建精灵
      const newPetId = await this._player.PetRepo.Create(petInfo);
      
      if (newPetId > 0) {
        Logger.Info(`[PetInfoService] 创建精灵成功: UserId=${userId}, PetId=${petId}, NewId=${newPetId}`);
        return true;
      } else {
        Logger.Error(`[PetInfoService] 创建精灵失败: UserId=${userId}, PetId=${petId}`);
        return false;
      }
    } catch (error) {
      Logger.Error(`[PetInfoService] 创建精灵异常: ${error}`);
      return false;
    }
  }
}
