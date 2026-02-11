import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { IPetInfo, createDefaultPetInfo } from '../../shared/models/PetModel';
import { GameConfig } from '../../shared/config/game/GameConfig';
import { PetCalculator } from '../../GameServer/Game/Pet/PetCalculator';
import { SptSystem } from '../../GameServer/Game/Pet/SptSystem';
import { OnlineTracker } from '../../GameServer/Game/Player/OnlineTracker';
import { PlayerManager } from '../../GameServer/Game/Player/PlayerManager';
import { PacketSystemMessage } from '../../GameServer/Server/Packet/Send/System/PacketSystemMessage';
import { PacketGetBossMonster } from '../../GameServer/Server/Packet/Send/System/PacketGetBossMonster';

/**
 * 精灵管理服务
 */
export class PetService {
  /**
   * 发送精灵（使用 GameServer 的实际实现）
   */
  public async givePet(
    uid: number,
    petId: number,
    level: number,
    shiny: boolean,
    customStats?: {
      dvHp?: number;
      dvAtk?: number;
      dvDef?: number;
      dvSpAtk?: number;
      dvSpDef?: number;
      dvSpeed?: number;
      evHp?: number;
      evAtk?: number;
      evDef?: number;
      evSpAtk?: number;
      evSpDef?: number;
      evSpeed?: number;
      nature?: number;
      skills?: number[];
      effectList?: Array<{
        itemId: number;
        status: number;
        leftCount: number;
        effectID: number;
        args: string;
      }>;
    }
  ): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    
    // 获取精灵配置
    const petConfig = GameConfig.GetPetById(petId);
    if (!petConfig) {
      throw new Error(`精灵配置不存在: petId=${petId}`);
    }

    // 检查背包空间
    const bagSpace = 6 - petData.PetList.filter(p => p.isInBag).length;
    const isInBag = bagSpace > 0; // 背包有空间就放背包，否则放仓库
    
    if (!isInBag) {
      Logger.Info(`[PetService] 背包已满，精灵将放入仓库: uid=${uid}, petId=${petId}`);
    }

    // 创建精灵对象（使用 GameServer 的方式）
    const newPet = createDefaultPetInfo(uid, petId);
    newPet.level = level;
    newPet.obtainLevel = level;
    
    // 如果提供了自定义属性，应用它们
    if (customStats) {
      if (customStats.dvHp !== undefined) newPet.dvHp = Math.max(0, customStats.dvHp);
      if (customStats.dvAtk !== undefined) newPet.dvAtk = Math.max(0, customStats.dvAtk);
      if (customStats.dvDef !== undefined) newPet.dvDef = Math.max(0, customStats.dvDef);
      if (customStats.dvSpAtk !== undefined) newPet.dvSpAtk = Math.max(0, customStats.dvSpAtk);
      if (customStats.dvSpDef !== undefined) newPet.dvSpDef = Math.max(0, customStats.dvSpDef);
      if (customStats.dvSpeed !== undefined) newPet.dvSpeed = Math.max(0, customStats.dvSpeed);

      if (customStats.evHp !== undefined) newPet.evHp = Math.max(0, customStats.evHp);
      if (customStats.evAtk !== undefined) newPet.evAtk = Math.max(0, customStats.evAtk);
      if (customStats.evDef !== undefined) newPet.evDef = Math.max(0, customStats.evDef);
      if (customStats.evSpAtk !== undefined) newPet.evSpAtk = Math.max(0, customStats.evSpAtk);
      if (customStats.evSpDef !== undefined) newPet.evSpDef = Math.max(0, customStats.evSpDef);
      if (customStats.evSpeed !== undefined) newPet.evSpeed = Math.max(0, customStats.evSpeed);

      if (customStats.nature !== undefined) newPet.nature = Math.max(0, Math.min(24, customStats.nature));

      if (customStats.effectList && customStats.effectList.length > 0) {
        // 从 pet_abilities.json 补全参数和 itemId
        for (const effect of customStats.effectList) {
          if (effect.effectID > 0) {
            const abilityConfig = GameConfig.GetPetAbilityById(effect.effectID);
            if (abilityConfig) {
              if (!effect.args) {
                effect.args = abilityConfig.args.join(' ');
              }
              // 客户端用 itemId 显示特性，确保 itemId = abilityId
              if (!effect.itemId) {
                effect.itemId = effect.effectID;
              }
            }
          }
        }
        newPet.effectList = customStats.effectList;
        newPet.effectCount = customStats.effectList.length;
      }
    }
    
    // 使用 PetCalculator 计算正确的属性
    PetCalculator.UpdatePetStats(newPet);
    
    // 分配技能
    if (customStats?.skills && customStats.skills.length > 0) {
      // 验证技能ID有效性
      const validSkills: number[] = [];
      const invalidSkills: number[] = [];
      
      for (const skillId of customStats.skills.slice(0, 4)) {
        const skillConfig = GameConfig.GetSkillById(skillId);
        if (skillConfig) {
          validSkills.push(skillId);
        } else {
          invalidSkills.push(skillId);
          Logger.Warn(`[PetService] 无效的技能ID: ${skillId}`);
        }
      }
      
      if (invalidSkills.length > 0) {
        throw new Error(`无效的技能ID: ${invalidSkills.join(', ')}`);
      }
      
      // 使用自定义技能
      newPet.skillArray = validSkills;
      Logger.Info(`[PetService] 使用自定义技能: ${newPet.skillArray.join(',')}`);
    } else {
      // 使用 SptSystem 获取默认技能
      const defaultSkills = SptSystem.GetDefaultSkills(petId, level);
      newPet.skillArray = defaultSkills.slice(0, 4).map(skill => skill.id);
    }
    
    // 设置精灵位置（背包或仓库）
    newPet.isInBag = isInBag;
    
    // 添加到背包或仓库
    petData.AddPet(newPet);
    
    Logger.Info(`[PetService] 发送精灵成功: uid=${uid}, petId=${petId}, level=${level}, isInBag=${isInBag}, catchTime=${newPet.catchTime}, skills=${newPet.skillArray.join(',')}`);
    
    // 如果玩家在线，发送系统消息通知并推送GET_BOSS_MONSTER
    try {
      if (OnlineTracker.Instance.IsOnline(uid)) {
        const player = PlayerManager.GetInstance().GetPlayer(uid);
        if (player) {
          // 获取精灵名称
          const petName = petConfig.DefName || `精灵#${petId}`;
          const location = isInBag ? '背包' : '仓库';
          const message = `恭喜你获得了 ${petName}（等级${level}），已放入${location}！`;
          
          // 发送系统消息通知 (SYSTEM_MESSAGE - CMD 8002)
          await player.SendPacket(new PacketSystemMessage(message, 0, 0));
          Logger.Info(`[PetService] 已发送获得精灵通知给在线玩家: uid=${uid}, petId=${petId}, message=${message}`);
          
          // 推送 GET_BOSS_MONSTER (8004) 通知客户端添加精灵
          // 客户端收到后会调用 PetManager.setIn(catchTime, 1)
          // 然后发送 PET_RELEASE 请求，服务器响应后客户端会添加精灵到背包
          await player.SendPacket(new PacketGetBossMonster(petId, newPet.catchTime));
          Logger.Info(`[PetService] 已推送 GET_BOSS_MONSTER 触发客户端添加精灵: uid=${uid}, petId=${petId}, catchTime=${newPet.catchTime}`);
        }
      }
    } catch (error) {
      Logger.Warn(`[PetService] 发送精灵通知失败: uid=${uid}, error=${error}`);
      // 不影响主流程，继续执行
    }
  }

  /**
   * 删除精灵
   */
  public async removePet(uid: number, catchTime: number): Promise<void> {
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const index = petData.PetList.findIndex(p => p.catchTime === catchTime);
    if (index === -1) {
      throw new Error('精灵不存在');
    }

    const pet = petData.PetList[index];
    petData.PetList.splice(index, 1);
    
    // 立即保存到数据库（不等待自动保存）
    await petData.save();
    
    Logger.Info(`[PetService] 删除精灵成功: uid=${uid}, petId=${pet.petId}, catchTime=${catchTime}`);
  }

  /**
   * 修改精灵属性
   */
  public async updatePet(uid: number, catchTime: number, field: string, value: any): Promise<void> {
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
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
        pet.evHp = Math.max(0, value);
        break;
      case 'evAtk':
        pet.evAtk = Math.max(0, value);
        break;
      case 'evDef':
        pet.evDef = Math.max(0, value);
        break;
      case 'evSpAtk':
        pet.evSpAtk = Math.max(0, value);
        break;
      case 'evSpDef':
        pet.evSpDef = Math.max(0, value);
        break;
      case 'evSpeed':
        pet.evSpeed = Math.max(0, value);
        break;
      case 'dvHp':
        pet.dvHp = Math.max(0, value);
        break;
      case 'dvAtk':
        pet.dvAtk = Math.max(0, value);
        break;
      case 'dvDef':
        pet.dvDef = Math.max(0, value);
        break;
      case 'dvSpAtk':
        pet.dvSpAtk = Math.max(0, value);
        break;
      case 'dvSpDef':
        pet.dvSpDef = Math.max(0, value);
        break;
      case 'dvSpeed':
        pet.dvSpeed = Math.max(0, value);
        break;
      case 'nature':
        pet.nature = value;
        break;
      default:
        throw new Error(`不支持的字段: ${field}`);
    }

    // 立即保存到数据库（不等待自动保存）
    await petData.save();

    Logger.Info(`[PetService] 修改精灵属性成功: uid=${uid}, catchTime=${catchTime}, field=${field}, value=${value}`);
  }

  /**
   * 批量修改精灵属性
   */
  public async updatePetBatch(uid: number, updateData: {
    catchTime: number;
    level?: number;
    nature?: number;
    exp?: number;
    hp?: number;
    maxHp?: number;
    atk?: number;
    def?: number;
    spAtk?: number;
    spDef?: number;
    speed?: number;
    evHp?: number;
    evAtk?: number;
    evDef?: number;
    evSpAtk?: number;
    evSpDef?: number;
    evSpeed?: number;
    dvHp?: number;
    dvAtk?: number;
    dvDef?: number;
    dvSpAtk?: number;
    dvSpDef?: number;
    dvSpeed?: number;
    skills?: number[];
    effectList?: Array<{
      itemId: number;
      status: number;
      leftCount: number;
      effectID: number;
      args: string;
    }>;
  }): Promise<void> {
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === updateData.catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    // 更新基本属性
    if (updateData.level !== undefined) {
      pet.level = Math.max(1, Math.min(100, updateData.level));
    }
    if (updateData.nature !== undefined) {
      pet.nature = Math.max(0, Math.min(24, updateData.nature));
    }
    if (updateData.exp !== undefined) {
      pet.exp = Math.max(0, updateData.exp);
    }

    // 更新属性值（如果提供）
    let hasDirectStats = false;
    if (updateData.hp !== undefined) {
      pet.hp = Math.max(1, Math.min(9999, updateData.hp));
      hasDirectStats = true;
    }
    if (updateData.maxHp !== undefined) {
      pet.maxHp = Math.max(1, Math.min(9999, updateData.maxHp));
      hasDirectStats = true;
    }
    if (updateData.atk !== undefined) {
      pet.atk = Math.max(1, Math.min(9999, updateData.atk));
      hasDirectStats = true;
    }
    if (updateData.def !== undefined) {
      pet.def = Math.max(1, Math.min(9999, updateData.def));
      hasDirectStats = true;
    }
    if (updateData.spAtk !== undefined) {
      pet.spAtk = Math.max(1, Math.min(9999, updateData.spAtk));
      hasDirectStats = true;
    }
    if (updateData.spDef !== undefined) {
      pet.spDef = Math.max(1, Math.min(9999, updateData.spDef));
      hasDirectStats = true;
    }
    if (updateData.speed !== undefined) {
      pet.speed = Math.max(1, Math.min(9999, updateData.speed));
      hasDirectStats = true;
    }

    // 更新努力值
    if (updateData.evHp !== undefined) pet.evHp = Math.max(0, updateData.evHp);
    if (updateData.evAtk !== undefined) pet.evAtk = Math.max(0, updateData.evAtk);
    if (updateData.evDef !== undefined) pet.evDef = Math.max(0, updateData.evDef);
    if (updateData.evSpAtk !== undefined) pet.evSpAtk = Math.max(0, updateData.evSpAtk);
    if (updateData.evSpDef !== undefined) pet.evSpDef = Math.max(0, updateData.evSpDef);
    if (updateData.evSpeed !== undefined) pet.evSpeed = Math.max(0, updateData.evSpeed);

    // 更新个体值
    if (updateData.dvHp !== undefined) pet.dvHp = Math.max(0, updateData.dvHp);
    if (updateData.dvAtk !== undefined) pet.dvAtk = Math.max(0, updateData.dvAtk);
    if (updateData.dvDef !== undefined) pet.dvDef = Math.max(0, updateData.dvDef);
    if (updateData.dvSpAtk !== undefined) pet.dvSpAtk = Math.max(0, updateData.dvSpAtk);
    if (updateData.dvSpDef !== undefined) pet.dvSpDef = Math.max(0, updateData.dvSpDef);
    if (updateData.dvSpeed !== undefined) pet.dvSpeed = Math.max(0, updateData.dvSpeed);

    // 更新特性列表
    if (updateData.effectList !== undefined) {
      // 从 pet_abilities.json 补全参数和 itemId
      for (const effect of updateData.effectList) {
        if (effect.effectID > 0) {
          const abilityConfig = GameConfig.GetPetAbilityById(effect.effectID);
          if (abilityConfig) {
            if (!effect.args) {
              effect.args = abilityConfig.args.join(' ');
            }
            // 客户端用 itemId 显示特性，确保 itemId = abilityId
            if (!effect.itemId) {
              effect.itemId = effect.effectID;
            }
          }
        }
      }
      pet.effectList = updateData.effectList;
      pet.effectCount = updateData.effectList.length;
      Logger.Info(`[PetService] 更新特性: ${JSON.stringify(pet.effectList)}`);
    }

    // 更新技能
    if (updateData.skills && updateData.skills.length > 0) {
      // 验证技能ID有效性
      const validSkills: number[] = [];
      const invalidSkills: number[] = [];
      
      for (const skillId of updateData.skills.slice(0, 4)) {
        if (skillId === 0) continue; // 跳过空技能槽
        
        const skillConfig = GameConfig.GetSkillById(skillId);
        if (skillConfig) {
          validSkills.push(skillId);
        } else {
          invalidSkills.push(skillId);
          Logger.Warn(`[PetService] 无效的技能ID: ${skillId}`);
        }
      }
      
      if (invalidSkills.length > 0) {
        throw new Error(`无效的技能ID: ${invalidSkills.join(', ')}`);
      }
      
      // 更新技能数组
      pet.skillArray = validSkills;
      Logger.Info(`[PetService] 更新技能: ${pet.skillArray.join(',')}`);
    }

    // 只有在没有直接设置属性值时才重新计算
    if (!hasDirectStats) {
      // 重新计算属性
      PetCalculator.UpdatePetStats(pet);
      Logger.Info(`[PetService] 自动重新计算精灵属性`);
    } else {
      Logger.Info(`[PetService] 使用手动设置的属性值，跳过自动计算`);
    }

    // 立即保存到数据库（不等待自动保存）
    await petData.save();
    Logger.Info(`[PetService] 精灵数据已立即保存到数据库`);

    Logger.Info(`[PetService] 批量修改精灵属性成功: uid=${uid}, catchTime=${updateData.catchTime}`);
  }

  /**
   * 获取玩家精灵列表
   */
  public async getPlayerPets(uid: number): Promise<IPetInfo[]> {
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      return [];
    }
    return petData.PetList;
  }

  /**
   * 治疗精灵（恢复满血）
   */
  public async curePet(uid: number, catchTime: number): Promise<void> {
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
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
    // 使用 GetInstanceOrCreateNew 以支持离线玩家
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
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
