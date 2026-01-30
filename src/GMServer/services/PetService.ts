import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { IPetInfo, createDefaultPetInfo } from '../../shared/models/PetModel';
import { GameConfig } from '../../shared/config/game/GameConfig';
import { PetCalculator } from '../../GameServer/Game/Pet/PetCalculator';
import { SptSystem } from '../../GameServer/Game/Pet/SptSystem';

/**
 * 精灵管理服务
 */
export class PetService {
  /**
   * 发送精灵（使用 GameServer 的实际实现）
   */
  public async givePet(uid: number, petId: number, level: number, shiny: boolean): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    
    // 获取精灵配置
    const petConfig = GameConfig.GetPetById(petId);
    if (!petConfig) {
      throw new Error(`精灵配置不存在: petId=${petId}`);
    }

    // 检查背包空间
    const bagSpace = 6 - petData.PetList.filter(p => p.isInBag).length;
    if (bagSpace <= 0) {
      throw new Error('背包已满');
    }

    // 创建精灵对象（使用 GameServer 的方式）
    const newPet = createDefaultPetInfo(uid, petId);
    newPet.level = level;
    newPet.obtainLevel = level;
    
    // 使用 PetCalculator 计算正确的属性
    PetCalculator.UpdatePetStats(newPet);
    
    // 使用 SptSystem 获取默认技能
    const defaultSkills = SptSystem.GetDefaultSkills(petId, level);
    newPet.skillArray = defaultSkills.slice(0, 4).map(skill => skill.id);
    
    // 添加到背包
    petData.AddPet(newPet);
    
    Logger.Info(`[PetService] 发送精灵成功: uid=${uid}, petId=${petId}, level=${level}, catchTime=${newPet.catchTime}, skills=${newPet.skillArray.join(',')}`);
  }

  /**
   * 删除精灵
   */
  public async removePet(uid: number, catchTime: number): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const index = petData.PetList.findIndex(p => p.catchTime === catchTime);
    if (index === -1) {
      throw new Error('精灵不存在');
    }

    const pet = petData.PetList[index];
    petData.PetList.splice(index, 1);
    Logger.Info(`[PetService] 删除精灵成功: uid=${uid}, petId=${pet.petId}, catchTime=${catchTime}`);
  }

  /**
   * 修改精灵属性
   */
  public async updatePet(uid: number, catchTime: number, field: string, value: any): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    // 根据字段更新数据
    switch (field) {
      case 'level':
        pet.level = Math.max(1, Math.min(100, value));
        // 重新计算属性
        PetCalculator.UpdatePetStats(pet);
        break;
      case 'hp':
        pet.hp = Math.max(0, Math.min(pet.maxHp, value));
        break;
      case 'maxHp':
        pet.maxHp = value;
        break;
      case 'atk':
        pet.atk = value;
        break;
      case 'def':
        pet.def = value;
        break;
      case 'spAtk':
        pet.spAtk = value;
        break;
      case 'spDef':
        pet.spDef = value;
        break;
      case 'speed':
        pet.speed = value;
        break;
      case 'exp':
        pet.exp = value;
        break;
      case 'evHp':
        pet.evHp = Math.max(0, Math.min(255, value));
        break;
      case 'evAtk':
        pet.evAtk = Math.max(0, Math.min(255, value));
        break;
      case 'evDef':
        pet.evDef = Math.max(0, Math.min(255, value));
        break;
      case 'evSpAtk':
        pet.evSpAtk = Math.max(0, Math.min(255, value));
        break;
      case 'evSpDef':
        pet.evSpDef = Math.max(0, Math.min(255, value));
        break;
      case 'evSpeed':
        pet.evSpeed = Math.max(0, Math.min(255, value));
        break;
      case 'dvHp':
        pet.dvHp = Math.max(0, Math.min(31, value));
        break;
      case 'dvAtk':
        pet.dvAtk = Math.max(0, Math.min(31, value));
        break;
      case 'dvDef':
        pet.dvDef = Math.max(0, Math.min(31, value));
        break;
      case 'dvSpAtk':
        pet.dvSpAtk = Math.max(0, Math.min(31, value));
        break;
      case 'dvSpDef':
        pet.dvSpDef = Math.max(0, Math.min(31, value));
        break;
      case 'dvSpeed':
        pet.dvSpeed = Math.max(0, Math.min(31, value));
        break;
      case 'nature':
        pet.nature = value;
        break;
      default:
        throw new Error(`不支持的字段: ${field}`);
    }

    Logger.Info(`[PetService] 修改精灵属性成功: uid=${uid}, catchTime=${catchTime}, field=${field}, value=${value}`);
  }

  /**
   * 获取玩家精灵列表
   */
  public async getPlayerPets(uid: number): Promise<IPetInfo[]> {
    const petData = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    if (!petData) {
      return [];
    }
    return petData.PetList;
  }

  /**
   * 治疗精灵（恢复满血）
   */
  public async curePet(uid: number, catchTime: number): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    pet.hp = pet.maxHp;
    Logger.Info(`[PetService] 治疗精灵成功: uid=${uid}, petId=${pet.petId}, catchTime=${catchTime}`);
  }

  /**
   * 治疗所有精灵
   */
  public async cureAllPets(uid: number): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstance_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    for (const pet of petData.PetList) {
      pet.hp = pet.maxHp;
    }

    Logger.Info(`[PetService] 治疗所有精灵成功: uid=${uid}, count=${petData.PetList.length}`);
  }

  /**
   * 设置精灵等级
   */
  public async setPetLevel(uid: number, catchTime: number, level: number): Promise<void> {
    await this.updatePet(uid, catchTime, 'level', level);
  }

  /**
   * 设置精灵经验
   */
  public async setPetExp(uid: number, catchTime: number, exp: number): Promise<void> {
    await this.updatePet(uid, catchTime, 'exp', exp);
  }
}
