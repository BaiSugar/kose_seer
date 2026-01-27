/**
 * 技能效果触发器
 * 负责在战斗中触发和应用技能效果
 * 
 * 集成效果系统到战斗流程
 */

import { Logger } from '../../../shared/utils';
import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { EffectRegistry } from './effects/core/EffectRegistry';
import { EffectTiming, createEffectContext, IEffectResult } from './effects/core/EffectContext';
import { SkillEffectConfig } from '../../../shared/config/game/SkillEffectConfig';

/**
 * 效果触发器类
 */
export class EffectTrigger {

  /**
   * 触发技能附加效果
   * 
   * @param skill 技能配置
   * @param attacker 攻击方
   * @param defender 防守方
   * @param damage 造成的伤害
   * @param timing 触发时机
   * @returns 效果结果数组
   */
  public static TriggerSkillEffect(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timing: EffectTiming
  ): IEffectResult[] {
    // 如果技能没有附加效果，直接返回
    if (!skill.sideEffect || skill.sideEffect === 0) {
      return [];
    }

    const results: IEffectResult[] = [];

    try {
      // 1. 从配置获取效果信息
      const effectConfig = SkillEffectConfig.GetEffect(skill.sideEffect);
      if (!effectConfig) {
        Logger.Warn(`[EffectTrigger] 效果配置不存在: effectId=${skill.sideEffect}`);
        return [];
      }

      // 2. 从注册表获取效果实例
      const effect = EffectRegistry.getInstance().getEffect(effectConfig.eid);
      if (!effect) {
        Logger.Warn(`[EffectTrigger] 效果未注册: eid=${effectConfig.eid}`);
        return [];
      }

      // 3. 检查是否在正确的时机触发
      if (!effect.canTrigger(timing)) {
        return [];
      }

      // 4. 解析效果参数
      const effectArgs = this.ParseEffectArgs(skill.sideEffectArg || effectConfig.args);

      // 5. 创建效果上下文
      const context = createEffectContext(attacker, defender, skill.id, damage, timing);
      context.effectId = skill.sideEffect;
      context.effectArgs = effectArgs;
      context.skillType = skill.type;
      context.skillCategory = skill.category;
      context.skillPower = skill.power;

      // 6. 执行效果
      const effectResults = effect.execute(context);
      results.push(...effectResults);

      // 7. 记录日志
      if (effectResults.length > 0) {
        Logger.Info(
          `[EffectTrigger] 触发效果: ${effect.getEffectName()} (Eid=${effectConfig.eid}), ` +
          `结果数: ${effectResults.length}`
        );
      }

    } catch (error) {
      Logger.Error(`[EffectTrigger] 效果执行失败: ${error}`);
    }

    return results;
  }

  /**
   * 应用效果结果到战斗精灵
   * 
   * @param results 效果结果数组
   * @param attacker 攻击方
   * @param defender 防守方
   */
  public static ApplyEffectResults(
    results: IEffectResult[],
    attacker: IBattlePet,
    defender: IBattlePet
  ): void {
    for (const result of results) {
      if (!result.success) {
        continue;
      }

      const target = result.target === 'attacker' ? attacker : defender;

      switch (result.type) {
        case 'heal':
        case 'absorb':
          // 回复HP
          if (result.value && result.value > 0) {
            target.hp = Math.min(target.maxHp, target.hp + result.value);
            Logger.Info(`[效果应用] ${result.target} 回复 ${result.value} HP`);
          }
          break;

        case 'damage':
        case 'recoil':
          // 造成伤害
          if (result.value && result.value > 0) {
            target.hp = Math.max(0, target.hp - result.value);
            Logger.Info(`[效果应用] ${result.target} 受到 ${result.value} 点伤害`);
          }
          break;

        case 'status':
          // 应用状态效果
          if (result.data && result.data.status !== undefined) {
            if (!target.statusDurations) {
              target.statusDurations = new Array(20).fill(0);
            }
            target.statusDurations[result.data.status] = result.data.duration || 3;
            target.status = result.data.status;
            target.statusTurns = result.data.duration || 3;
            Logger.Info(
              `[效果应用] ${result.target} 进入状态: ${result.data.statusName}, ` +
              `持续 ${result.data.duration} 回合`
            );
          }
          break;

        case 'stat_change':
          // 能力等级变化
          if (result.data && result.data.stat !== undefined && result.data.stages !== undefined) {
            if (!target.battleLv) {
              target.battleLv = [0, 0, 0, 0, 0, 0];
            }
            const statIndex = result.data.stat;
            const oldStage = target.battleLv[statIndex] || 0;
            const newStage = Math.max(-6, Math.min(6, oldStage + result.data.stages));
            target.battleLv[statIndex] = newStage;
            
            const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
            const change = result.data.stages > 0 ? '提升' : '降低';
            Logger.Info(
              `[效果应用] ${result.target} ${statNames[statIndex]}${change} ` +
              `${Math.abs(result.data.stages)} 级 (${oldStage} → ${newStage})`
            );
          }
          break;

        case 'multi_hit':
          // 连续攻击（在伤害计算时处理）
          Logger.Info(`[效果应用] 连续攻击 ${result.value} 次`);
          break;

        case 'hp_equal':
          // 同生共死
          defender.hp = attacker.hp;
          Logger.Info(`[效果应用] 同生共死: 对方HP变为 ${defender.hp}`);
          break;

        case 'mercy':
          // 手下留情
          if (defender.hp <= 0) {
            defender.hp = 1;
            Logger.Info(`[效果应用] 手下留情: 对方HP保留1点`);
          }
          break;

        case 'encore':
          // 克制
          if (result.data && result.data.turns) {
            defender.encore = true;
            defender.encoreTurns = result.data.turns;
            Logger.Info(`[效果应用] 克制: 对方被迫使用上次技能 ${result.data.turns} 回合`);
          }
          break;

        case 'pp_reduce':
          // 减少PP
          if (defender.lastMove && defender.skillPP) {
            const skillIndex = defender.skills.indexOf(defender.lastMove);
            if (skillIndex >= 0 && defender.skillPP[skillIndex]) {
              defender.skillPP[skillIndex] = Math.max(0, defender.skillPP[skillIndex] - 1);
              Logger.Info(`[效果应用] 减少对方技能PP`);
            }
          }
          break;

        default:
          Logger.Debug(`[效果应用] 未处理的效果类型: ${result.type}`);
      }
    }
  }

  /**
   * 解析效果参数字符串
   * 格式: "arg1 arg2 arg3" 或 "arg1,arg2,arg3"
   */
  private static ParseEffectArgs(argsStr: string): number[] {
    if (!argsStr || argsStr.trim() === '') {
      return [];
    }

    const args: number[] = [];
    const matches = argsStr.match(/(-?\d+)/g);

    if (matches) {
      for (const match of matches) {
        args.push(parseInt(match, 10));
      }
    }

    return args;
  }

  /**
   * 批量触发效果（用于多个时机）
   */
  public static TriggerMultipleEffects(
    skill: ISkillConfig,
    attacker: IBattlePet,
    defender: IBattlePet,
    damage: number,
    timings: EffectTiming[]
  ): IEffectResult[] {
    const allResults: IEffectResult[] = [];

    for (const timing of timings) {
      const results = this.TriggerSkillEffect(skill, attacker, defender, damage, timing);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * 检查效果是否应该触发（概率判定）
   */
  public static ShouldTrigger(chance: number): boolean {
    return Math.random() * 100 < chance;
  }
}
