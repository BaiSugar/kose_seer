import { Logger } from '../../../../shared/utils';
import { IBattlePet } from '../../../../shared/models/BattleModel';
import { IEffectResult, EffectTiming, createEffectContext } from '../effects/core/EffectContext';
import { effectManager } from '../effects/core/EffectManager';

/**
 * 技能效果服务
 * 处理战斗中的技能效果（吸血、能力变化、异常状态等）
 * 
 * 架构说明：
 * - 使用 EffectManager 统一管理所有效果
 * - 通过 EffectContext 传递战斗状态
 * - 支持多个效果组合和效果链
 * - 支持不同时机的效果触发
 */
export class SkillEffectService {
  /**
   * 处理技能效果
   * @param effectId 效果ID（从配置文件中的 Idx）
   * @param attacker 攻击方
   * @param defender 防御方
   * @param damage 造成的伤害
   * @param skillId 技能ID
   * @param timing 触发时机
   * @param customArgs 自定义参数（覆盖配置中的参数）
   */
  public ProcessEffect(
    effectId: number,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    skillId: number = 0,
    timing: EffectTiming = EffectTiming.AFTER_DAMAGE_APPLY,
    customArgs?: string
  ): IEffectResult[] {
    try {
      // 创建效果上下文
      const context = createEffectContext(attacker, defender, skillId, damage, timing);
      
      // 执行效果
      const results = effectManager.executeEffect(effectId, context, customArgs);
      
      Logger.Debug(`[SkillEffectService] 处理效果: EffectId=${effectId}, Results=${results.length}`);
      
      return results;
      
    } catch (error) {
      Logger.Error(`[SkillEffectService] 处理效果失败: EffectId=${effectId}, Error=${error}`);
      return [];
    }
  }

  /**
   * 批量处理技能效果
   * @param effectIds 效果ID列表
   * @param attacker 攻击方
   * @param defender 防御方
   * @param damage 造成的伤害
   * @param skillId 技能ID
   * @param timing 触发时机
   */
  public ProcessEffects(
    effectIds: number[],
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    skillId: number = 0,
    timing: EffectTiming = EffectTiming.AFTER_DAMAGE_APPLY
  ): IEffectResult[] {
    const allResults: IEffectResult[] = [];
    
    for (const effectId of effectIds) {
      const results = this.ProcessEffect(effectId, attacker, defender, damage, skillId, timing);
      allResults.push(...results);
    }
    
    return allResults;
  }

  /**
   * 在指定时机执行效果
   * @param timing 触发时机
   * @param attacker 攻击方
   * @param defender 防御方
   * @param skillId 技能ID
   * @param damage 伤害值
   */
  public ProcessEffectsAtTiming(
    timing: EffectTiming,
    attacker: IBattlePet,
    defender: IBattlePet,
    skillId: number,
    damage: number = 0
  ): IEffectResult[] {
    return effectManager.executeEffectsAtTiming(timing, attacker, defender, skillId, damage);
  }

  /**
   * 检查是否触发即死效果
   * @param attacker 攻击方
   * @param defender 防御方
   */
  public CheckInstantKill(attacker: IBattlePet, defender: IBattlePet): boolean {
    // TODO: 实现即死效果检查
    // 需要检查攻击方的特性、状态等
    return false;
  }

  /**
   * 检查是否触发存活效果
   * @param defender 防御方
   * @param damage 伤害
   */
  public CheckSurvive(defender: IBattlePet, damage: number): boolean {
    // TODO: 实现存活效果检查
    // 需要检查防御方的特性、状态等
    return false;
  }
}
