/**
 * 被动能力系统（兼容层）
 *
 * 保留原有接口以兼容 BattleInitService 等调用方。
 * 实际功能委托给 BossAbilityManager → PassiveEffectRunner。
 */

import { Logger } from '../../../shared/utils';
import { IBattlePet } from '../../../shared/models/BattleModel';
import { IEffectResult } from './effects/core/EffectContext';
import { BossAbilityManager } from './BossAbility/BossAbilityManager';
import { BossAbilityConfig } from './BossAbility/BossAbilityConfig';
import { IAbilityEntry } from './BossAbility/BossAbilityConfig';
import { GameConfig } from '../../../shared/config/game/GameConfig';

/**
 * 被动能力系统类
 */
export class PassiveAbilitySystem {

  /**
   * 在战斗开始时触发精灵的所有被动能力
   *
   * @param pet 精灵对象
   * @param opponent 对手精灵
   * @returns 空数组（实际效果由 PassiveEffectRunner 在各时机自动触发）
   */
  public static TriggerPassiveAbilities(
    pet: IBattlePet,
    opponent: IBattlePet
  ): IEffectResult[] {
    // 1. 从配置读取BOSS特性（含参数）
    const bossAbilityEntries = BossAbilityConfig.Instance.GetAbilityEntries(pet.petId);
    if (bossAbilityEntries.length > 0) {
      BossAbilityManager.InitializeBossAbilities(pet, bossAbilityEntries);
    }

    // 2. 从玩家精灵的effectList加载特性
    const playerAbilityEntries = this.LoadPlayerAbilities(pet);
    if (playerAbilityEntries.length > 0) {
      BossAbilityManager.InitializeBossAbilities(pet, playerAbilityEntries);
      Logger.Info(`[PassiveAbilitySystem] 玩家特性加载: petId=${pet.petId}, count=${playerAbilityEntries.length}`);
    }

    return [];
  }

  /**
   * 从玩家精灵的effectList加载特性配置
   */
  private static LoadPlayerAbilities(pet: IBattlePet): IAbilityEntry[] {
    const entries: IAbilityEntry[] = [];

    // 检查精灵是否有特性列表
    const effectList = (pet as any).effectList;
    if (!effectList || !Array.isArray(effectList)) {
      return entries;
    }

    for (const effect of effectList) {
      // 特性状态2表示已激活
      if (effect.status !== 2) {
        continue;
      }

      const abilityId = effect.itemId ?? effect.effectID;
      if (abilityId === undefined || abilityId === null) {
        Logger.Warn(`[PassiveAbilitySystem] 特性数据缺少 itemId/effectID: ${JSON.stringify(effect)}`);
        continue;
      }
      // 从pet_abilities.json获取特性配置
      const abilityConfig = GameConfig.GetPetAbilityById(abilityId);

      if (abilityConfig) {
        entries.push({
          id: abilityConfig.effectId,
          args: abilityConfig.args || [],
        });
        Logger.Info(`[PassiveAbilitySystem] 加载玩家特性: ${abilityConfig.name}, effectId=${abilityConfig.effectId}`);
      } else {
        Logger.Warn(`[PassiveAbilitySystem] 未找到特性配置: abilityId=${abilityId}`);
      }
    }

    return entries;
  }

  /**
   * 为精灵配置被动能力（运行时配置）
   *
   * @deprecated 请在 boss_abilities.json 中配置
   */
  public static ConfigurePassiveAbilities(petId: number, abilityIds: number[]): void {
    Logger.Warn(
      `[PassiveAbilitySystem] ConfigurePassiveAbilities已废弃，` +
      `请在 boss_abilities.json 中配置: petId=${petId}, abilities=[${abilityIds.join(', ')}]`
    );
  }
}
